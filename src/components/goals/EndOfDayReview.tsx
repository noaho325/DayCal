'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { TimeBlock, OnboardingGoals } from '@/types'
import type { WeekProgress } from '@/hooks/useGoals'
import { calculateDailyScore, getScoreColor, getScoreLabel } from '@/lib/scoring'

interface Props {
  todayBlocks: TimeBlock[]
  weekProgress: WeekProgress
  goals: OnboardingGoals
  todayDate: string
  onDismiss: () => void
}

const MOODS = [
  { key: 'great', label: 'Great' },
  { key: 'okay', label: 'Okay' },
  { key: 'tough', label: 'Tough' },
  { key: 'frustrated', label: 'Frustrated' },
  { key: 'exhausted', label: 'Exhausted' },
]

export function EndOfDayReview({ todayBlocks, weekProgress, goals, todayDate, onDismiss }: Props) {
  const [mood, setMood] = useState<string | null>(null)

  const score = calculateDailyScore(todayBlocks)
  const scoreColor = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)
  const completed = todayBlocks.filter((b) => b.status === 'completed')
  const skipped = todayBlocks.filter((b) => b.status === 'skipped')
  const excused = todayBlocks.filter((b) => b.status === 'excused')

  const enabled = goals.enabledGoals ?? {
    study: true, workouts: true, meals: true, sleep: false, work: false,
  }

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `daycal_eod_${todayDate}`,
        JSON.stringify({ date: todayDate, score, mood })
      )
    }
    onDismiss()
  }

  // Points earned today
  const todayPoints = weekProgress.weeklyPoints  // approximate

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[92vh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-6 pb-8 pt-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Day Review</h2>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Score ring */}
          <div className="flex flex-col items-center mb-7">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center border-[5px]"
              style={{ borderColor: scoreColor }}
            >
              <div className="text-center">
                <p className="text-4xl font-black leading-none" style={{ color: scoreColor }}>
                  {score}
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">/ 100</p>
              </div>
            </div>
            <p className="mt-3 text-base font-semibold text-gray-800">{scoreLabel}</p>
            <p className="text-xs text-gray-400 mt-0.5">+{todayPoints} pts earned this week</p>
          </div>

          {/* Block summary grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-green-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{completed.length}</p>
              <p className="text-xs text-green-500 mt-0.5">Completed</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-red-500">{skipped.length}</p>
              <p className="text-xs text-red-400 mt-0.5">Skipped</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-500">{excused.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Excused</p>
            </div>
          </div>

          {/* Week progress highlights */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Week so far
            </p>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              {enabled.study && goals.studyHoursPerWeek > 0 && (
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{weekProgress.studyHours.toFixed(1)}h</span>
                  <span className="text-gray-400"> / {goals.studyHoursPerWeek}h study</span>
                </p>
              )}
              {enabled.workouts && goals.workoutsPerWeek > 0 && (
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{weekProgress.workouts}</span>
                  <span className="text-gray-400"> / {goals.workoutsPerWeek} workouts</span>
                </p>
              )}
              {enabled.meals && goals.mealsPerDay > 0 && (
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{weekProgress.avgMealsPerDay.toFixed(1)}</span>
                  <span className="text-gray-400"> / {goals.mealsPerDay} meals/day</span>
                </p>
              )}
              {enabled.work && goals.workHoursPerWeek > 0 && (
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{weekProgress.workHours.toFixed(1)}h</span>
                  <span className="text-gray-400"> / {goals.workHoursPerWeek}h work</span>
                </p>
              )}
            </div>
          </div>

          {/* Mood picker */}
          <div className="mb-7">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
              How did today feel?
            </p>
            <div className="flex justify-between gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMood(m.key)}
                  className={[
                    'flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all',
                    mood === m.key
                      ? 'bg-blue-100 ring-2 ring-blue-400 scale-105'
                      : 'bg-gray-100 hover:bg-gray-200',
                  ].join(' ')}
                >
                  <span className="text-[11px] font-semibold text-gray-600">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-sm font-semibold transition-colors"
          >
            Done — see you tomorrow!
          </button>
        </div>
      </div>
    </div>
  )
}
