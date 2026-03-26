'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, startOfWeek, addDays, parse } from 'date-fns'
import type { TimeBlock, OnboardingGoals } from '@/types'
import { loadGoals } from '@/utils/constants'
import { calculateDailyScore, getBlockPoints } from '@/lib/scoring'

export interface WeekProgress {
  studyHours: number
  workouts: number
  avgMealsPerDay: number
  workHours: number
  classesAttended: number
  weeklyPoints: number
  dailyScores: Record<string, number>   // YYYY-MM-DD → 0-100
  todayScore: number
}

const EMPTY: WeekProgress = {
  studyHours: 0,
  workouts: 0,
  avgMealsPerDay: 0,
  workHours: 0,
  classesAttended: 0,
  weeklyPoints: 0,
  dailyScores: {},
  todayScore: 0,
}

export function useGoals(todayBlocks: TimeBlock[], todayDate: string) {
  const [goals] = useState<OnboardingGoals>(() => loadGoals())
  const [weekProgress, setWeekProgress] = useState<WeekProgress>(EMPTY)

  const compute = useCallback(() => {
    const today = parse(todayDate, 'yyyy-MM-dd', new Date())
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday

    let studyMins = 0
    let workouts = 0
    let totalMeals = 0
    let daysWithBlocks = 0
    let workMins = 0
    let classesAttended = 0
    let weeklyPoints = 0
    const dailyScores: Record<string, number> = {}

    for (let i = 0; i < 7; i++) {
      const date = format(addDays(weekStart, i), 'yyyy-MM-dd')
      let blocks: TimeBlock[]

      if (date === todayDate) {
        blocks = todayBlocks
      } else {
        try {
          const raw = localStorage.getItem(`daycal_schedule_${date}`)
          blocks = raw ? JSON.parse(raw) : []
        } catch {
          blocks = []
        }
      }

      if (blocks.length > 0) {
        daysWithBlocks++
        dailyScores[date] = calculateDailyScore(blocks)
      }

      const completed = blocks.filter((b) => b.status === 'completed')
      studyMins += completed
        .filter((b) => b.category === 'study')
        .reduce((s, b) => s + b.estimatedDuration, 0)
      workouts += completed.filter((b) => b.category === 'gym').length
      totalMeals += completed.filter((b) => b.category === 'meal').length
      workMins += completed
        .filter((b) => b.category === 'work' && !b.isExcused)
        .reduce((s, b) => s + b.estimatedDuration, 0)
      classesAttended += completed.filter((b) => b.category === 'class').length
      weeklyPoints += completed.reduce((s, b) => s + getBlockPoints(b), 0)
    }

    setWeekProgress({
      studyHours: studyMins / 60,
      workouts,
      avgMealsPerDay: daysWithBlocks > 0 ? totalMeals / daysWithBlocks : 0,
      workHours: workMins / 60,
      classesAttended,
      weeklyPoints,
      dailyScores,
      todayScore: calculateDailyScore(todayBlocks),
    })
  }, [todayBlocks, todayDate])

  useEffect(() => {
    compute()
  }, [compute])

  return { goals, weekProgress }
}
