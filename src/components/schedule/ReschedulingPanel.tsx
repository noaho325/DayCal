'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, AlertTriangle, Clock, SkipForward, RotateCcw } from 'lucide-react'
import type { TimeBlock, SkipReason } from '@/types'
import { SKIP_REASON_LABELS } from '@/utils/constants'
import { formatTime, getCurrentTime } from '@/utils/formatters'
import { getSmartSuggestions } from '@/lib/scheduling'
import { Button } from '@/components/shared/Button'
import toast from 'react-hot-toast'

const DELAY_OPTIONS = [5, 10, 15, 30, 60]

interface ReschedulingPanelProps {
  isOpen: boolean
  onClose: () => void
  blocks: TimeBlock[]
  onDelayBlock: (id: string, minutes: number) => void
  onPushAllBack: (fromTime: string, minutes: number) => void
  onSkipBlock: (id: string, reason: SkipReason, reasonText?: string) => void
  onExcuseBlock: (id: string) => void
  onUndo: () => void
  canUndo: boolean
}

type PanelMode = 'main' | 'skip-reason' | 'skip-excused'

export const ReschedulingPanel: React.FC<ReschedulingPanelProps> = ({
  isOpen,
  onClose,
  blocks,
  onDelayBlock,
  onPushAllBack,
  onSkipBlock,
  onExcuseBlock,
  onUndo,
  canUndo,
}) => {
  const [mode, setMode] = useState<PanelMode>('main')
  const [skipReason, setSkipReason] = useState<SkipReason | null>(null)
  const [skipReasonText, setSkipReasonText] = useState('')
  const [lastActionLabel, setLastActionLabel] = useState('')
  const [undoCountdown, setUndoCountdown] = useState(0)
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Find current / next block
  const now = getCurrentTime()
  const currentBlock = blocks.find((b) => b.status === 'in-progress')
  const nextBlock = blocks.find((b) => b.status === 'upcoming' && b.startTime >= now)

  const suggestions = getSmartSuggestions(blocks)

  useEffect(() => {
    if (!isOpen) {
      setMode('main')
      setSkipReason(null)
      setSkipReasonText('')
    }
  }, [isOpen])

  const startUndoCountdown = (label: string) => {
    setLastActionLabel(label)
    setUndoCountdown(10)
    if (undoTimerRef.current) clearInterval(undoTimerRef.current)
    undoTimerRef.current = setInterval(() => {
      setUndoCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(undoTimerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleDelayBlock = (id: string, minutes: number, label: string) => {
    onDelayBlock(id, minutes)
    startUndoCountdown(`Delayed "${label}" by ${minutes}m`)
    toast.success(`Block delayed by ${minutes} min`)
  }

  const handlePushAll = (minutes: number) => {
    onPushAllBack(now, minutes)
    startUndoCountdown(`Pushed everything back by ${minutes}m`)
    toast.success(`All upcoming blocks shifted by ${minutes} min`)
  }

  const handleSkipConfirm = (blockId: string, blockTitle: string) => {
    if (!skipReason) return
    onSkipBlock(blockId, skipReason, skipReasonText.trim() || undefined)
    startUndoCountdown(`Skipped "${blockTitle}"`)
    setMode('skip-excused')
  }

  const handleExcuse = (id: string) => {
    onExcuseBlock(id)
    toast.success('Block marked as excused — not counted against your score')
    setMode('main')
  }

  const handleUndo = () => {
    onUndo()
    if (undoTimerRef.current) clearInterval(undoTimerRef.current)
    setUndoCountdown(0)
    toast.success('Action undone')
  }

  if (!isOpen) return null

  const targetBlock = currentBlock ?? nextBlock

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-t-2xl shadow-2xl z-10 max-h-[85vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-[#48484A]" />
        </div>

        <div className="px-5 pb-6 pt-2 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Running Behind?</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Smart suggestion */}
          {suggestions[0] && (
            <div className="bg-amber-50 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700 font-medium">{suggestions[0]}</p>
            </div>
          )}

          {mode === 'main' && (
            <>
              {/* Delay current block */}
              {targetBlock && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Delay &ldquo;{targetBlock.title}&rdquo;
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {DELAY_OPTIONS.map((m) => (
                      <button
                        key={m}
                        onClick={() => handleDelayBlock(targetBlock.id, m, targetBlock.title)}
                        className="px-3 py-2 text-sm font-medium bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                      >
                        +{m}m
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Push everything back */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Push everything from now back
                </p>
                <div className="flex gap-2 flex-wrap">
                  {DELAY_OPTIONS.map((m) => (
                    <button
                      key={m}
                      onClick={() => handlePushAll(m)}
                      className="px-3 py-2 text-sm font-medium bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors"
                    >
                      +{m}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Skip block */}
              {targetBlock && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Skip this block
                  </p>
                  <button
                    onClick={() => setMode('skip-reason')}
                    className="flex items-center gap-2 text-sm font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 rounded-lg px-4 py-2.5 transition-colors w-full"
                  >
                    <SkipForward size={16} />
                    Skip &ldquo;{targetBlock.title}&rdquo;
                  </button>
                </div>
              )}
            </>
          )}

          {mode === 'skip-reason' && targetBlock && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Why are you skipping?</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(SKIP_REASON_LABELS) as SkipReason[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setSkipReason(r)}
                    className={[
                      'text-sm py-2.5 px-3 rounded-xl border-2 transition-colors text-left',
                      skipReason === r
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium'
                        : 'border-gray-100 dark:border-[#38383A] text-gray-600 dark:text-gray-300 hover:border-gray-200 dark:hover:border-[#48484A]',
                    ].join(' ')}
                  >
                    {SKIP_REASON_LABELS[r]}
                  </button>
                ))}
              </div>
              <textarea
                value={skipReasonText}
                onChange={(e) => setSkipReasonText(e.target.value)}
                placeholder="Optional: add more context..."
                rows={2}
                className="w-full border border-gray-200 dark:border-[#48484A] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-50 bg-white dark:bg-[#1C1C1E] resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setMode('main')} className="flex-1">
                  Back
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleSkipConfirm(targetBlock.id, targetBlock.title)}
                  disabled={!skipReason}
                  className="flex-1"
                >
                  Confirm Skip
                </Button>
              </div>
            </div>
          )}

          {mode === 'skip-excused' && targetBlock && (
            <div className="space-y-3 text-center">
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Block skipped. Should it be <strong>excused</strong> (not counted against your score)?
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setMode('main')} className="flex-1">
                  No, count it
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleExcuse(targetBlock.id)}
                  className="flex-1 text-purple-600 bg-purple-50 hover:bg-purple-100"
                >
                  Yes, excuse it
                </Button>
              </div>
            </div>
          )}

          {/* Undo toast */}
          {undoCountdown > 0 && canUndo && (
            <div className="flex items-center justify-between bg-gray-900 text-white rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">{lastActionLabel}</span>
              </div>
              <button
                onClick={handleUndo}
                className="flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 ml-3 shrink-0"
              >
                <RotateCcw size={14} />
                Undo ({undoCountdown}s)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
