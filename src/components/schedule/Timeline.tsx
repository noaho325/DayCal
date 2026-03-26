'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  Plus,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  Utensils,
  Dumbbell,
  Briefcase,
} from 'lucide-react'
import type { TimeBlock as TimeBlockType, BlockCategory, SkipReason } from '@/types'
import { TIMELINE_START_HOUR, TIMELINE_END_HOUR, PIXELS_PER_MINUTE, CATEGORY_META, BUILTIN_CATEGORY_ORDER, loadUserCategories, getCategoryMeta } from '@/utils/constants'
import {
  formatTime,
  getTimelinePosition,
  getBlockHeight,
  getCurrentTime,
  minutesToTime,
} from '@/utils/formatters'
import { TimeBlock } from './TimeBlock'
import { CurrentTimeMarker } from './CurrentTimeMarker'
import { AddBlockModal } from './AddBlockModal'
import { ReschedulingPanel } from './ReschedulingPanel'
import { FlexibleBlocks } from './FlexibleBlocks'

const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap, BookOpen, Utensils, Dumbbell, Briefcase,
}

interface TimelineProps {
  blocks: TimeBlockType[]
  onAddBlock: (block: Omit<TimeBlockType, 'id'>) => void
  onUpdateBlock: (id: string, changes: Partial<TimeBlockType>) => void
  onDeleteBlock: (id: string) => void
  onDelayBlock: (id: string, minutes: number) => void
  onPushAllBack: (fromTime: string, minutes: number) => void
  onSkipBlock: (id: string, reason: SkipReason, reasonText?: string) => void
  onExcuseBlock: (id: string) => void
  onCompleteBlock: (id: string) => void
  onUndo: () => void
  canUndo: boolean
  onAddNewCategory?: () => void
}

interface ContextMenuState {
  x: number
  y: number
  time: string
}

const HOUR_LABELS: number[] = Array.from(
  { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR },
  (_, i) => TIMELINE_START_HOUR + i
)

function formatHour(h: number): string {
  if (h === 0 || h === 24) return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}


export const Timeline: React.FC<TimelineProps> = ({
  blocks,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onDelayBlock,
  onPushAllBack,
  onSkipBlock,
  onExcuseBlock,
  onCompleteBlock,
  onUndo,
  canUndo,
  onAddNewCategory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [clickedTime, setClickedTime] = useState<string | undefined>()
  const [initialCategory, setInitialCategory] = useState<BlockCategory | undefined>()
  const [editBlock, setEditBlock] = useState<TimeBlockType | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const totalHeight =
    (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60 * PIXELS_PER_MINUTE

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (!containerRef.current) return
    const nowPos = getTimelinePosition(getCurrentTime(), TIMELINE_START_HOUR, PIXELS_PER_MINUTE)
    const offset = Math.max(0, nowPos - 120)
    containerRef.current.scrollTo({ top: offset, behavior: 'smooth' })
  }, [])

  // Close context menu on outside mousedown (deferred so the right-click that opened it doesn't immediately close it)
  useEffect(() => {
    if (!contextMenu) return
    let active = false
    const timer = setTimeout(() => { active = true }, 50)
    const handler = (e: MouseEvent) => {
      if (!active) return
      const menu = document.getElementById('timeline-context-menu')
      if (menu && menu.contains(e.target as Node)) return
      setContextMenu(null)
    }
    window.addEventListener('mousedown', handler)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousedown', handler)
    }
  }, [contextMenu])

  const getTimeFromEvent = useCallback((e: React.MouseEvent): string => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return getCurrentTime()
    const relY = e.clientY - rect.top + (containerRef.current?.scrollTop ?? 0)
    const minutes = relY / PIXELS_PER_MINUTE + TIMELINE_START_HOUR * 60
    const snapped = Math.round(minutes / 15) * 15
    return minutesToTime(snapped)
  }, [])

  // Left-click on empty timeline area → open add modal
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('[data-block]')) return
      if (contextMenu) { setContextMenu(null); return }
      const time = getTimeFromEvent(e)
      setClickedTime(time)
      setInitialCategory(undefined)
      setEditBlock(null)
      setAddModalOpen(true)
    },
    [contextMenu, getTimeFromEvent]
  )

  // Right-click on empty timeline area → show context menu at cursor
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('[data-block]')) return
      e.preventDefault()
      e.stopPropagation()
      const time = getTimeFromEvent(e)

      // Clamp so menu stays on screen
      const menuW = 200
      const menuH = 260
      const x = Math.min(e.clientX, window.innerWidth - menuW - 8)
      const y = Math.min(e.clientY, window.innerHeight - menuH - 8)

      setContextMenu({ x, y, time })
    },
    [getTimeFromEvent]
  )

  const openFromContext = (cat?: BlockCategory) => {
    if (!contextMenu) return
    setClickedTime(contextMenu.time)
    setInitialCategory(cat)
    setEditBlock(null)
    setContextMenu(null)
    setAddModalOpen(true)
  }

  const handleEdit = (block: TimeBlockType) => {
    setEditBlock(block)
    setInitialCategory(undefined)
    setAddModalOpen(true)
  }

  const handleSaveBlock = (block: Omit<TimeBlockType, 'id'>) => {
    if (editBlock) {
      onUpdateBlock(editBlock.id, block)
    } else {
      onAddBlock(block)
    }
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Timeline scroll area — onContextMenu here catches right-clicks on ALL child elements */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
        onContextMenu={handleContextMenu}
        style={{ minHeight: 0 }}
      >
        {/* Click-to-add overlay (left-click only) */}
        <div
          className="absolute inset-0 cursor-pointer z-0"
          onClick={handleTimelineClick}
          style={{ height: `${totalHeight}px` }}
          aria-label="Click to add a block"
        />

        {/* Timeline grid */}
        <div
          className="relative pointer-events-none"
          style={{ height: `${totalHeight}px`, paddingBottom: '80px' }}
        >
          {HOUR_LABELS.map((h) => {
            const top = (h - TIMELINE_START_HOUR) * 60 * PIXELS_PER_MINUTE
            return (
              <div
                key={h}
                className="absolute left-0 right-0 flex items-center"
                style={{ top: `${top}px` }}
              >
                <span className="text-[10px] text-gray-400 dark:text-gray-500 w-10 text-right pr-2 shrink-0 select-none">
                  {formatHour(h)}
                </span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-[#38383A]" />
              </div>
            )
          })}
        </div>

        {/* Blocks (pointer-events-auto so they're still interactive) */}
        <div className="absolute inset-0" style={{ height: `${totalHeight}px` }}>
          {blocks.map((block) => {
            const top = getTimelinePosition(block.startTime, TIMELINE_START_HOUR, PIXELS_PER_MINUTE)
            const height = getBlockHeight(block.startTime, block.endTime, PIXELS_PER_MINUTE)
            return (
              <div key={block.id} data-block="true">
                <TimeBlock
                  block={block}
                  style={{ top: `${top}px`, height: `${height}px`, minHeight: '40px' }}
                  onComplete={onCompleteBlock}
                  onSkip={(block) => onSkipBlock(block.id, 'other')}
                  onDelay={() => setRescheduleOpen(true)}
                  onEdit={handleEdit}
                  onDelete={onDeleteBlock}
                  onMove={(id, newStart, newEnd) => onUpdateBlock(id, { startTime: newStart, endTime: newEnd })}
                />
              </div>
            )
          })}
          <CurrentTimeMarker />
        </div>
      </div>

      {/* Flexible blocks */}
      <FlexibleBlocks
        blocks={blocks}
        onComplete={onCompleteBlock}
        onSkip={(block) => onSkipBlock(block.id, 'other')}
      />

      {/* Add block FAB */}
      <button
        onClick={() => {
          setClickedTime(getCurrentTime())
          setInitialCategory(undefined)
          setEditBlock(null)
          setAddModalOpen(true)
        }}
        className="fixed bottom-24 right-4 z-30 w-14 h-14 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Add schedule block"
      >
        <Plus size={24} />
      </button>

      {/* Running behind button */}
      <button
        onClick={() => setRescheduleOpen(true)}
        className="fixed bottom-24 left-4 z-30 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-full shadow-lg px-4 py-3 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
        aria-label="Running behind"
      >
        <AlertTriangle size={16} />
        Behind?
      </button>

      {/* Right-click context menu — compact category picker */}
      {contextMenu && (
        <div
          id="timeline-context-menu"
          className="fixed z-50 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#38383A] overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x, minWidth: '192px' }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Time label */}
          <div className="px-3.5 pt-3 pb-2">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Add block
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-50 mt-0.5">
              {formatTime(contextMenu.time)}
            </p>
          </div>

          <div className="h-px bg-gray-100 dark:bg-[#38383A] mx-3" />

          {/* Category options */}
          <div className="p-2 space-y-0.5">
            {BUILTIN_CATEGORY_ORDER.map((cat) => {
              const meta = getCategoryMeta(cat)
              const Ic = meta.iconName ? (ICON_MAP[meta.iconName] ?? null) : null
              return (
                <button
                  key={cat}
                  onClick={() => openFromContext(cat)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors text-left group"
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: meta.bgColor }}
                  >
                    {Ic ? (
                      <Ic size={13} style={{ color: meta.color }} />
                    ) : (
                      <span className="text-sm leading-none">{meta.emoji}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-50">
                    {meta.label}
                  </span>
                </button>
              )
            })}
            {loadUserCategories().map((cat) => (
              <button
                key={cat.id}
                onClick={() => openFromContext(cat.id)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors text-left group"
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-sm"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  {cat.emoji}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-50">
                  {cat.name}
                </span>
              </button>
            ))}
            <div className="h-px bg-gray-100 dark:bg-[#38383A] my-1" />
            <button
              onClick={() => { setContextMenu(null); onAddNewCategory?.() }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors text-left group"
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-gray-100 dark:bg-[#3A3A3C]">
                <Plus size={13} className="text-gray-400 dark:text-gray-500" />
              </div>
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Add new category
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      <AddBlockModal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false)
          setEditBlock(null)
          setInitialCategory(undefined)
        }}
        onSave={handleSaveBlock}
        initialTime={clickedTime}
        initialCategory={initialCategory}
        editBlock={editBlock}
        onAddNewCategory={onAddNewCategory}
      />

      {/* Rescheduling panel */}
      <ReschedulingPanel
        isOpen={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        blocks={blocks}
        onDelayBlock={onDelayBlock}
        onPushAllBack={onPushAllBack}
        onSkipBlock={onSkipBlock}
        onExcuseBlock={onExcuseBlock}
        onUndo={onUndo}
        canUndo={canUndo}
      />
    </div>
  )
}
