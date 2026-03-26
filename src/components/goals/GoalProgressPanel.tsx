'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Flame, Trophy, BookOpen, Dumbbell, Utensils, Briefcase, GraduationCap, Zap } from 'lucide-react'
import type { OnboardingGoals, TimeBlock } from '@/types'
import type { WeekProgress } from '@/hooks/useGoals'
import type { StreakData } from '@/hooks/useStreak'
import { getScoreColor } from '@/lib/scoring'
import { getTodayString } from '@/utils/formatters'

interface Props {
  weekProgress: WeekProgress
  goals: OnboardingGoals
  streak: StreakData
  currentDate: string
}

interface GoalBar {
  key: string
  label: string
  icon: React.ReactNode
  actual: number
  target: number
  unit: string
}

export function GoalProgressPanel({ weekProgress, goals, streak, currentDate }: Props) {
  const [expanded, setExpanded] = useState(false)
  const isToday = currentDate === getTodayString()
  const { todayScore, weeklyPoints } = weekProgress
  const enabled = goals.enabledGoals ?? {
    study: true, workouts: true, meals: true, sleep: false, work: false,
  }

  const bars: GoalBar[] = [
    { key: 'study', label: 'Study', icon: <BookOpen size={14} className="text-purple-500" />, actual: weekProgress.studyHours, target: goals.studyHoursPerWeek, unit: 'h' },
    { key: 'workouts', label: 'Workouts', icon: <Dumbbell size={14} className="text-green-500" />, actual: weekProgress.workouts, target: goals.workoutsPerWeek, unit: '' },
    { key: 'meals', label: 'Meals/day', icon: <Utensils size={14} className="text-amber-500" />, actual: weekProgress.avgMealsPerDay, target: goals.mealsPerDay, unit: '' },
    { key: 'work', label: 'Work', icon: <Briefcase size={14} className="text-blue-500" />, actual: weekProgress.workHours, target: goals.workHoursPerWeek, unit: 'h' },
  ].filter((b) => {
    const keyMap: Record<string, boolean> = {
      study: enabled.study,
      workouts: enabled.workouts,
      meals: enabled.meals,
      work: enabled.work ?? false,
    }
    return keyMap[b.key] && b.target > 0
  })

  // Smart nudges — show goals that are behind weekly pace
  const dow = new Date().getDay() // 0=Sun
  const daysElapsed = dow === 0 ? 7 : dow
  const weekFraction = daysElapsed / 7
  const behindBars = bars.filter((bar) => {
    const pct = bar.target > 0 ? bar.actual / bar.target : 1
    return pct < weekFraction - 0.2 // behind by >20% of expected pace
  })

  return (
    <div className="mx-3 mt-2 mb-1 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] shadow-sm overflow-hidden shrink-0">
      {/* Always-visible summary row */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-2.5"
      >
        <div className="flex items-center gap-4">
          {/* Streak */}
          <div className="flex items-center gap-1.5">
            <Flame size={14} className="text-orange-400" />
            <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{streak.current}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">day streak</span>
          </div>

          {/* Today score */}
          {isToday && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getScoreColor(todayScore) }} />
              <span className="text-sm font-bold" style={{ color: getScoreColor(todayScore) }}>{todayScore}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">today</span>
            </div>
          )}

          {/* Weekly points */}
          <div className="flex items-center gap-1.5">
            <Trophy size={13} className="text-amber-400" />
            <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{weeklyPoints}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">pts</span>
          </div>
        </div>

        <span className="text-gray-300 dark:text-gray-600">{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
      </button>

      {/* Expandable goal bars */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 dark:border-[#38383A] pt-3 space-y-3">
          {bars.map((bar) => {
            const pct = bar.target > 0 ? Math.min(bar.actual / bar.target, 1) : 0
            const color = pct >= 0.8 ? '#22C55E' : pct >= 0.45 ? '#EAB308' : '#EF4444'
            const actualStr = bar.unit === 'h' ? bar.actual.toFixed(1) : Math.round(bar.actual).toString()
            const targetStr = bar.unit === 'h' ? bar.target.toFixed(0) : bar.target.toString()
            return (
              <div key={bar.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {bar.icon}
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{bar.label}</span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{actualStr}{bar.unit} / {targetStr}{bar.unit}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
                </div>
              </div>
            )
          })}

          {/* Class attendance */}
          {weekProgress.classesAttended > 0 && (
            <div className="flex items-center gap-2 pt-1 text-xs text-gray-500">
              <GraduationCap size={13} className="text-indigo-400" />
              <span>{weekProgress.classesAttended} class{weekProgress.classesAttended !== 1 ? 'es' : ''} attended this week</span>
            </div>
          )}

          {/* Behind-pace nudges */}
          {behindBars.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-gray-50">
              {behindBars.slice(0, 2).map((bar) => {
                const needed = bar.target - bar.actual
                const text = bar.key === 'study' ? `${Math.ceil(needed)}h of study still needed this week`
                  : bar.key === 'workouts' ? `${Math.ceil(needed)} more workout${Math.ceil(needed) !== 1 ? 's' : ''} to hit goal`
                  : bar.key === 'meals' ? `Log ${Math.ceil(bar.target - bar.actual)} more meals/day`
                  : `${Math.ceil(needed)}h of work still remaining`
                return (
                  <div key={bar.key} className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
                    <Zap size={11} className="text-amber-500 shrink-0" />
                    <span>{text}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
