'use client'

import React from 'react'
import { X, Flame, Trophy, TrendingUp, TrendingDown, Share2, GraduationCap } from 'lucide-react'
import { format, parse, startOfWeek, addDays } from 'date-fns'
import type { OnboardingGoals } from '@/types'
import type { WeekProgress } from '@/hooks/useGoals'
import type { StreakData } from '@/hooks/useStreak'
import { getScoreColor, getScoreLabel } from '@/lib/scoring'

interface Props {
  weekProgress: WeekProgress
  goals: OnboardingGoals
  streak: StreakData
  currentDate: string
  onDismiss: () => void
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function WeeklySummaryReport({ weekProgress, goals, streak, currentDate, onDismiss }: Props) {
  const enabled = goals.enabledGoals ?? {
    study: true, workouts: true, meals: true, sleep: false, work: false,
  }

  // Build week day grid
  const today = parse(currentDate, 'yyyy-MM-dd', new Date())
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i)
    const dateStr = format(d, 'yyyy-MM-dd')
    const score = weekProgress.dailyScores[dateStr]
    return { label: format(d, 'EEE'), dateStr, score }
  })

  // Best / worst
  const scoredDays = weekDays.filter((d) => d.score !== undefined)
  const bestDay = scoredDays.reduce((best, d) => (!best || d.score! > best.score!) ? d : best, scoredDays[0])
  const worstDay = scoredDays.reduce((worst, d) => (!worst || d.score! < worst.score!) ? d : worst, scoredDays[0])
  const avgScore = scoredDays.length > 0
    ? Math.round(scoredDays.reduce((s, d) => s + d.score!, 0) / scoredDays.length)
    : 0

  // Goal hit/miss
  const goalRows = [
    { key: 'study', label: 'Study', enabled: enabled.study, actual: weekProgress.studyHours, target: goals.studyHoursPerWeek, unit: 'h', fmt: (v: number) => v.toFixed(1) },
    { key: 'workouts', label: 'Workouts', enabled: enabled.workouts, actual: weekProgress.workouts, target: goals.workoutsPerWeek, unit: '', fmt: (v: number) => Math.round(v).toString() },
    { key: 'meals', label: 'Meals/day', enabled: enabled.meals, actual: weekProgress.avgMealsPerDay, target: goals.mealsPerDay, unit: '', fmt: (v: number) => v.toFixed(1) },
    { key: 'work', label: 'Work', enabled: enabled.work ?? false, actual: weekProgress.workHours, target: goals.workHoursPerWeek, unit: 'h', fmt: (v: number) => v.toFixed(1) },
  ].filter((g) => g.enabled && g.target > 0)

  const goalsHit = goalRows.filter((g) => g.actual >= g.target * 0.9).length
  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 pt-6 pb-5 text-white shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wide mb-0.5">Weekly Review</p>
              <h2 className="text-xl font-black leading-tight">Week in Review</h2>
              <p className="text-indigo-200 text-xs mt-0.5">{weekLabel}</p>
            </div>
            <button onClick={onDismiss} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors mt-0.5">
              <X size={15} />
            </button>
          </div>

          {/* Top stats */}
          <div className="flex gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
              <Flame size={14} className="text-orange-300" />
              <div>
                <p className="text-base font-black leading-none">{streak.current}</p>
                <p className="text-[10px] text-indigo-200 mt-0.5">day streak</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
              <Trophy size={14} className="text-amber-300" />
              <div>
                <p className="text-base font-black leading-none">{weekProgress.weeklyPoints}</p>
                <p className="text-[10px] text-indigo-200 mt-0.5">pts earned</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
              <span className="text-base font-black" style={{ color: getScoreColor(avgScore) === '#22C55E' ? '#86efac' : getScoreColor(avgScore) === '#EAB308' ? '#fde68a' : '#fca5a5' }}>
                {avgScore}
              </span>
              <p className="text-[10px] text-indigo-200">avg score</p>
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
              <span className="text-base font-black text-white">{goalsHit}/{goalRows.length}</span>
              <p className="text-[10px] text-indigo-200">goals hit</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Day heatmap */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Daily Scores</p>
            <div className="flex gap-1.5">
              {weekDays.map((day) => {
                const hasScore = day.score !== undefined
                const color = hasScore ? getScoreColor(day.score!) : '#E5E7EB'
                const isToday = day.dateStr === currentDate
                return (
                  <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1.5">
                    <div
                      className={['w-full rounded-xl flex items-center justify-center', isToday ? 'ring-2 ring-offset-1 ring-indigo-400' : ''].join(' ')}
                      style={{
                        height: 44,
                        backgroundColor: hasScore ? hexToRgba(color, 0.18) : '#F9FAFB',
                        borderBottom: hasScore ? `3px solid ${color}` : '3px solid #E5E7EB',
                      }}
                    >
                      <span className="text-sm font-black" style={{ color: hasScore ? color : '#D1D5DB' }}>
                        {hasScore ? day.score : '—'}
                      </span>
                    </div>
                    <span className={['text-[10px] font-medium', isToday ? 'text-indigo-500' : 'text-gray-400'].join(' ')}>
                      {day.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Best / Worst */}
          {scoredDays.length >= 2 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-2xl p-3.5 border border-green-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={13} className="text-green-500" />
                  <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">Best day</p>
                </div>
                <p className="text-xl font-black text-green-700">{bestDay?.label}</p>
                <p className="text-xs text-green-500 font-medium">{bestDay?.score} / 100</p>
              </div>
              <div className="bg-orange-50 rounded-2xl p-3.5 border border-orange-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown size={13} className="text-orange-400" />
                  <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wide">Toughest day</p>
                </div>
                <p className="text-xl font-black text-orange-600">{worstDay?.label}</p>
                <p className="text-xs text-orange-400 font-medium">{worstDay?.score} / 100</p>
              </div>
            </div>
          )}

          {/* Goals breakdown */}
          {goalRows.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Goals</p>
              <div className="space-y-2.5">
                {goalRows.map((g) => {
                  const pct = g.target > 0 ? Math.min(g.actual / g.target, 1) : 0
                  const hit = pct >= 0.9
                  const color = pct >= 0.8 ? '#22C55E' : pct >= 0.45 ? '#EAB308' : '#EF4444'
                  return (
                    <div key={g.key} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-gray-800">{g.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {g.fmt(g.actual)}{g.unit} / {g.fmt(g.target)}{g.unit}
                          </span>
                          <span className={['text-xs font-bold px-2 py-0.5 rounded-full', hit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'].join(' ')}>
                            {hit ? '✓ Hit' : '✗ Missed'}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Classes attended */}
          {weekProgress.classesAttended > 0 && (
            <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-blue-100">
              <GraduationCap size={20} className="text-indigo-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">
                  {weekProgress.classesAttended} class{weekProgress.classesAttended !== 1 ? 'es' : ''} attended
                </p>
                <p className="text-xs text-blue-500">this week</p>
              </div>
            </div>
          )}

          {/* Score verdict */}
          <div className="text-center py-2">
            <div className="flex justify-center mb-2">
              <Trophy size={36} className={avgScore >= 80 ? 'text-amber-400' : avgScore >= 60 ? 'text-blue-400' : avgScore >= 40 ? 'text-orange-400' : 'text-gray-400'} />
            </div>
            <p className="text-lg font-black text-gray-900">{getScoreLabel(avgScore)}</p>
            <p className="text-sm text-gray-400 mt-0.5">
              {avgScore >= 80
                ? 'Outstanding week — you crushed it!'
                : avgScore >= 60
                ? 'Solid week. Keep the momentum going.'
                : avgScore >= 40
                ? 'Decent effort — there\'s room to grow.'
                : 'Tough week. Tomorrow is a fresh start.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 pb-8 pt-3 space-y-2.5 border-t border-gray-100">
          <button
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition opacity-60 cursor-not-allowed"
            disabled
          >
            <Share2 size={15} />
            Share this week (coming soon)
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-sm font-semibold transition"
          >
            On to next week
          </button>
        </div>
      </div>
    </div>
  )
}
