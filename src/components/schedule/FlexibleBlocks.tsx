'use client'

import React from 'react'
import {
  GraduationCap,
  BookOpen,
  Utensils,
  Dumbbell,
  Briefcase,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import type { TimeBlock } from '@/types'
import { getCategoryMeta, loadUserCategories } from '@/utils/constants'
import { formatTime, formatDuration, timeToMinutes } from '@/utils/formatters'

const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap,
  BookOpen,
  Utensils,
  Dumbbell,
  Briefcase,
}

interface FlexibleBlocksProps {
  blocks: TimeBlock[]
  onComplete: (id: string) => void
  onSkip: (block: TimeBlock) => void
}

export const FlexibleBlocks: React.FC<FlexibleBlocksProps> = ({
  blocks,
  onComplete,
  onSkip,
}) => {
  const flexible = blocks.filter((b) => b.isFlexible)
  const customCats = loadUserCategories()

  if (flexible.length === 0) return null

  return (
    <div className="mt-4 px-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Flexible Blocks
        </h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">({flexible.length})</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {flexible.map((block) => {
          const meta = getCategoryMeta(block.category, customCats)
          const Icon = meta.iconName ? (ICON_MAP[meta.iconName] ?? null) : null
          const duration = timeToMinutes(block.endTime) - timeToMinutes(block.startTime)
          const isFinished =
            block.status === 'completed' ||
            block.status === 'skipped' ||
            block.status === 'excused'

          return (
            <div
              key={block.id}
              className={[
                'shrink-0 w-44 rounded-xl border border-gray-100 dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] shadow-sm p-3',
                isFinished ? 'opacity-60' : '',
              ].join(' ')}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="rounded-lg p-1.5"
                  style={{ backgroundColor: meta.bgColor }}
                >
                  {Icon ? (
                    <Icon size={13} style={{ color: meta.color }} />
                  ) : (
                    <span className="text-sm leading-none">{meta.emoji}</span>
                  )}
                </div>
              </div>

              <p className={[
                'text-sm font-medium text-gray-900 dark:text-gray-50 truncate mb-0.5',
                block.status === 'skipped' ? 'line-through text-gray-400 dark:text-gray-500' : '',
              ].join(' ')}>
                {block.title}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {formatTime(block.startTime)} · {formatDuration(duration)}
              </p>

              {!isFinished && (
                <div className="flex gap-1.5 mt-2.5">
                  <button
                    onClick={() => onComplete(block.id)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 rounded-lg py-1.5 transition-colors"
                  >
                    <CheckCircle size={12} />
                    Done
                  </button>
                  <button
                    onClick={() => onSkip(block)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 rounded-lg py-1.5 transition-colors"
                  >
                    <XCircle size={12} />
                    Skip
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
