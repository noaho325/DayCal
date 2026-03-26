'use client'

import React, { useState, useRef, useCallback } from 'react'
import {
  GraduationCap,
  BookOpen,
  Utensils,
  Dumbbell,
  Briefcase,
  Lock,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit3,
  MapPin,
  X,
  GripVertical,
} from 'lucide-react'
import type { TimeBlock as TimeBlockType } from '@/types'
import { PRIORITY_META, getCategoryMeta, loadUserCategories } from '@/utils/constants'
import { PIXELS_PER_MINUTE, TIMELINE_START_HOUR, TIMELINE_END_HOUR } from '@/utils/constants'
import { formatTime, formatDuration, timeToMinutes, minutesToTime } from '@/utils/formatters'

const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap,
  BookOpen,
  Utensils,
  Dumbbell,
  Briefcase,
}

interface TimeBlockProps {
  block: TimeBlockType
  style?: React.CSSProperties
  onComplete: (id: string) => void
  onSkip: (block: TimeBlockType) => void
  onDelay: (block: TimeBlockType) => void
  onEdit: (block: TimeBlockType) => void
  onDelete: (id: string) => void
  onMove?: (id: string, newStartTime: string, newEndTime: string) => void
}

export const TimeBlock: React.FC<TimeBlockProps> = ({
  block,
  style,
  onComplete,
  onSkip,
  onDelay,
  onEdit,
  onDelete,
  onMove,
}) => {
  const [expanded, setExpanded] = useState(false)
  const customCats = loadUserCategories()
  const meta = getCategoryMeta(block.category, customCats)
  const Icon = meta.iconName ? (ICON_MAP[meta.iconName] ?? null) : null

  const duration = timeToMinutes(block.endTime) - timeToMinutes(block.startTime)
  const isCompact = duration < 45
  const isFinished =
    block.status === 'completed' ||
    block.status === 'skipped' ||
    block.status === 'excused'

  const priorityColor =
    block.priority === 'must'
      ? '#EF4444'
      : block.priority === 'should'
      ? '#F59E0B'
      : '#94A3B8'

  const leftBorderColor =
    block.status === 'completed'
      ? '#22C55E'
      : block.status === 'skipped'
      ? '#EF4444'
      : block.status === 'excused'
      ? '#9CA3AF'
      : block.status === 'in-progress'
      ? '#3B82F6'
      : priorityColor

  const catColor = meta.color
  const bgColor = isFinished
    ? block.status === 'completed'
      ? 'rgba(34,197,94,0.08)'
      : block.status === 'skipped'
      ? 'rgba(239,68,68,0.18)'
      : 'rgba(156,163,175,0.08)'
    : catColor + '28'

  const blockStyle: React.CSSProperties = {
    ...style,
    borderLeftColor: leftBorderColor,
    backgroundColor: bgColor,
    borderColor: !isFinished ? catColor + '55' : undefined,
  }

  // ── Drag logic ──────────────────────────────────────────────────────────────
  const blockRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{
    startY: number
    origStartMins: number
    duration: number
    moved: boolean
  } | null>(null)

  const handleGrabMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!onMove || !blockRef.current) return

    const origStartMins = timeToMinutes(block.startTime)
    const dur = timeToMinutes(block.endTime) - origStartMins
    dragState.current = { startY: e.clientY, origStartMins, duration: dur, moved: false }

    const el = blockRef.current
    el.style.opacity = '0.85'
    el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.22)'
    el.style.zIndex = '40'
    el.style.cursor = 'grabbing'

    // Snap indicator label
    const label = document.createElement('div')
    label.id = 'drag-time-label'
    label.style.cssText = `
      position: absolute; right: 8px; top: 4px;
      background: rgba(0,0,0,0.72); color: #fff;
      font-size: 11px; font-weight: 600; border-radius: 6px;
      padding: 2px 6px; pointer-events: none; z-index: 50;
    `
    label.textContent = formatTime(block.startTime)
    el.appendChild(label)

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragState.current) return
      dragState.current.moved = true
      const deltaY = ev.clientY - dragState.current.startY
      el.style.transform = `translateY(${deltaY}px)`

      // Update snap label
      const deltaMinutes = Math.round((deltaY / PIXELS_PER_MINUTE) / 15) * 15
      const snappedStart = Math.max(
        TIMELINE_START_HOUR * 60,
        Math.min(TIMELINE_END_HOUR * 60 - dragState.current.duration, dragState.current.origStartMins + deltaMinutes)
      )
      const lbl = document.getElementById('drag-time-label')
      if (lbl) lbl.textContent = formatTime(minutesToTime(snappedStart))
    }

    const handleMouseUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)

      if (!dragState.current) return
      const { origStartMins, duration, moved } = dragState.current

      // Reset visual
      el.style.transform = ''
      el.style.opacity = ''
      el.style.boxShadow = ''
      el.style.zIndex = ''
      el.style.cursor = ''
      document.getElementById('drag-time-label')?.remove()
      dragState.current = null

      if (!moved) return // no drag movement — was a regular click, ignore

      // e.clientY is the mousedown Y captured in the outer handleGrabMouseDown closure
      const totalDeltaY = ev.clientY - e.clientY
      const deltaMinutes = Math.round((totalDeltaY / PIXELS_PER_MINUTE) / 15) * 15
      const newStartMins = Math.max(
        TIMELINE_START_HOUR * 60,
        Math.min(TIMELINE_END_HOUR * 60 - duration, origStartMins + deltaMinutes)
      )
      onMove(block.id, minutesToTime(newStartMins), minutesToTime(newStartMins + duration))
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [block.id, block.startTime, block.endTime, onMove])

  return (
    <>
      {/* Compact block — never changes height */}
      <div
        ref={blockRef}
        className={[
          'absolute left-14 right-2 rounded-xl border border-gray-100 dark:border-[#38383A] border-l-4 shadow-sm overflow-visible cursor-pointer hover:shadow-md transition-shadow duration-150 group',
          'z-10',
          isFinished && block.status !== 'skipped' ? 'opacity-70' : '',
        ].join(' ')}
        style={blockStyle}
        onClick={() => { if (!dragState.current?.moved) setExpanded(true) }}
      >
        {/* Drag handle — visible on hover */}
        {onMove && (
          <div
            className="absolute left-0.5 top-1/2 -translate-y-1/2 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-20"
            onMouseDown={handleGrabMouseDown}
            onClick={e => e.stopPropagation()}
          >
            <GripVertical size={12} className="text-gray-400 dark:text-gray-500" />
          </div>
        )}

        <div className="w-full text-left px-3 py-2 flex items-start gap-2">
          {/* Category icon */}
          <div
            className="rounded-lg p-1.5 shrink-0 mt-0.5"
            style={{ backgroundColor: meta.bgColor }}
          >
            {Icon ? (
              <Icon size={14} style={{ color: meta.color }} />
            ) : (
              <span className="text-sm leading-none">{meta.emoji}</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={[
                  'text-sm font-medium text-gray-900 dark:text-gray-50 truncate',
                  block.status === 'skipped' ? 'line-through text-gray-400 dark:text-gray-500' : '',
                ].join(' ')}
              >
                {block.title}
              </span>
              {block.isLocked && (
                <Lock size={11} className="text-gray-400 shrink-0" />
              )}
              {block.status === 'in-progress' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-100 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Now
                </span>
              )}
              {block.status === 'completed' && (
                <CheckCircle size={13} className="text-green-500 shrink-0" />
              )}
              {block.status === 'skipped' && (
                <XCircle size={13} className="text-red-400 shrink-0" />
              )}
            </div>

            {!isCompact && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {formatTime(block.startTime)} – {formatTime(block.endTime)}
                &nbsp;·&nbsp;{formatDuration(duration)}
              </p>
            )}

            {block.category === 'meal' && block.mealName && !isCompact && (
              <p
                className="text-xs font-medium mt-0.5"
                style={{ color: meta.color }}
              >
                {block.mealName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Detail sheet — fixed overlay, no overlap */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-[2px]"
          onClick={() => setExpanded(false)}
        >
          <div
            className="bg-white dark:bg-[#1C1C1E] w-full max-w-lg rounded-t-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 dark:bg-[#48484A] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-start gap-3 px-5 py-3">
              <div
                className="rounded-xl p-2.5 shrink-0"
                style={{ backgroundColor: meta.bgColor }}
              >
                {Icon ? (
                  <Icon size={18} style={{ color: meta.color }} />
                ) : (
                  <span className="text-xl leading-none">{meta.emoji}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className={[
                    'text-base font-bold text-gray-900 dark:text-gray-50 leading-tight',
                    block.status === 'skipped' ? 'line-through text-gray-400 dark:text-gray-500' : '',
                  ].join(' ')}
                >
                  {block.title}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatTime(block.startTime)} – {formatTime(block.endTime)}
                  &nbsp;·&nbsp;{formatDuration(duration)}
                </p>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3A3C] text-gray-400 dark:text-gray-500 shrink-0 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Meta info */}
            <div className="px-5 pb-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center text-[10px] font-semibold rounded-full px-2 py-0.5"
                  style={{ color: PRIORITY_META[block.priority].color, backgroundColor: PRIORITY_META[block.priority].color + '18' }}
                >
                  {PRIORITY_META[block.priority].label}
                </span>
                {block.status === 'in-progress' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-100 rounded-full px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    In Progress
                  </span>
                )}
                {block.status === 'completed' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-100 rounded-full px-2 py-0.5">
                    <CheckCircle size={10} />
                    Completed
                  </span>
                )}
                {block.status === 'skipped' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 bg-red-100 rounded-full px-2 py-0.5">
                    <XCircle size={10} />
                    Skipped
                  </span>
                )}
              </div>

              {block.location && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <MapPin size={12} className="text-gray-400 dark:text-gray-500 shrink-0" />
                  <span>{block.location}</span>
                </div>
              )}
              {block.notes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{block.notes}</p>
              )}
              {block.category === 'meal' && block.mealName && (
                <p className="text-sm font-medium" style={{ color: meta.color }}>{block.mealName}</p>
              )}
              {block.category === 'meal' && !block.mealPhotoURL && (
                <button
                  className="flex items-center gap-1.5 text-xs font-medium hover:opacity-80"
                  style={{ color: meta.color }}
                >
                  <Camera size={13} />
                  Add meal photo
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="px-5 pb-8 flex flex-wrap gap-2">
              <button
                onClick={() => { onComplete(block.id); setExpanded(false) }}
                className={[
                  'flex items-center gap-1.5 text-sm font-medium rounded-xl px-4 py-2.5 transition-colors',
                  block.status === 'completed'
                    ? 'text-green-700 bg-green-100 ring-1 ring-green-300'
                    : 'text-green-600 dark:text-green-400 hover:text-green-700 bg-green-50 dark:bg-green-900/30 hover:bg-green-100',
                ].join(' ')}
              >
                <CheckCircle size={15} />
                Complete
              </button>
              <button
                onClick={() => { onSkip(block); setExpanded(false) }}
                className={[
                  'flex items-center gap-1.5 text-sm font-medium rounded-xl px-4 py-2.5 transition-colors',
                  block.status === 'skipped'
                    ? 'text-red-700 bg-red-100 ring-1 ring-red-300'
                    : 'text-red-500 dark:text-red-400 hover:text-red-600 bg-red-50 dark:bg-red-900/30 hover:bg-red-100',
                ].join(' ')}
              >
                <XCircle size={15} />
                Skip
              </button>
              <button
                onClick={() => { onDelay(block); setExpanded(false) }}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-500 dark:text-blue-400 hover:text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl px-4 py-2.5 transition-colors"
              >
                <Clock size={15} />
                Delay
              </button>
              <button
                onClick={() => { onEdit(block); setExpanded(false) }}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 bg-gray-50 dark:bg-[#2C2C2E] hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-xl px-4 py-2.5 transition-colors"
              >
                <Edit3 size={15} />
                Edit
              </button>
              <button
                onClick={() => { onDelete(block.id); setExpanded(false) }}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 bg-gray-50 dark:bg-[#2C2C2E] hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl px-4 py-2.5 transition-colors"
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
