'use client'

import React from 'react'
import { X, Flame, Trophy, Calendar, TrendingUp } from 'lucide-react'
import type { OnboardingGoals, TimeBlock } from '@/types'
import type { WeekProgress } from '@/hooks/useGoals'
import type { StreakData } from '@/hooks/useStreak'
import { getScoreColor, getScoreLabel } from '@/lib/scoring'

interface Props {
  goals: OnboardingGoals
  weekProgress: WeekProgress
  todayBlocks: TimeBlock[]
  streak: StreakData
  yesterdayScore: number | null
  onDismiss: () => void
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function MorningBriefing({
  goals,
  weekProgress,
  todayBlocks,
  streak,
  yesterdayScore,
  onDismiss,
}: Props) {
  const enabled = goals.enabledGoals ?? {
    study: true, workouts: true, meals: true, sleep: false, work: false,
  }

  // Build contextual nudges
  const nudges: string[] = []
  if (enabled.study && goals.studyHoursPerWeek > 0) {
    const remaining = goals.studyHoursPerWeek - weekProgress.studyHours
    if (remaining > 0.5) nudges.push(`${remaining.toFixed(1)}h of study left this week`)
  }
  if (enabled.workouts && goals.workoutsPerWeek > 0) {
    const remaining = goals.workoutsPerWeek - weekProgress.workouts
    if (remaining > 0) nudges.push(`${remaining} workout${remaining > 1 ? 's' : ''} to hit your goal`)
  }
  if (enabled.work && goals.workHoursPerWeek > 0) {
    const remaining = goals.workHoursPerWeek - weekProgress.workHours
    if (remaining > 0.5) nudges.push(`${remaining.toFixed(1)}h of work hours remaining`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-5">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-6 pt-7 pb-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide mb-1">
                {getGreeting()}
              </p>
              <h2 className="text-2xl font-bold leading-snug">
                Ready to sync<br />your day?
              </h2>
            </div>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors mt-1"
            >
              <X size={15} />
            </button>
          </div>

          {/* Stats chips */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
              <Flame size={15} className="text-orange-300" />
              <div>
                <p className="text-base font-bold leading-none">{streak.current}</p>
                <p className="text-[10px] text-blue-200 mt-0.5">day streak</p>
              </div>
            </div>

            {yesterdayScore !== null && (
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
                <TrendingUp size={15} className="text-green-300" />
                <div>
                  <p
                    className="text-base font-bold leading-none"
                    style={{ color: getScoreColor(yesterdayScore) === '#22C55E' ? '#86efac' : '#fde68a' }}
                  >
                    {yesterdayScore}
                  </p>
                  <p className="text-[10px] text-blue-200 mt-0.5">yesterday</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
              <Trophy size={15} className="text-amber-300" />
              <div>
                <p className="text-base font-bold leading-none">{weekProgress.weeklyPoints}</p>
                <p className="text-[10px] text-blue-200 mt-0.5">pts this week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Today's schedule count */}
          {todayBlocks.length > 0 && (
            <div className="flex items-center gap-3 bg-blue-50 rounded-2xl px-4 py-3">
              <Calendar size={18} className="text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {todayBlocks.length} block{todayBlocks.length !== 1 ? 's' : ''} scheduled today
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Your day is ready</p>
              </div>
            </div>
          )}

          {/* Nudges */}
          {nudges.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                This week
              </p>
              {nudges.map((n, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {n}
                </div>
              ))}
            </div>
          )}

          {nudges.length === 0 && todayBlocks.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">
              No blocks yet — right-click the calendar to add your first block!
            </p>
          )}

          <button
            onClick={onDismiss}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-sm font-semibold transition-colors"
          >
            Let&apos;s go
          </button>
        </div>
      </div>
    </div>
  )
}
