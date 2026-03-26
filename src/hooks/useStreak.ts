'use client'

import { useState, useEffect } from 'react'
import { format, subDays, parse } from 'date-fns'
import type { TimeBlock } from '@/types'
import { calculateDailyScore } from '@/lib/scoring'

export interface StreakData {
  current: number
  longest: number
  lastActiveDate: string
}

const STREAK_KEY = 'daycal_streak'
const ACTIVE_THRESHOLD = 40  // daily score must reach 40 to count as active

function loadStreak(): StreakData {
  if (typeof window === 'undefined') return { current: 0, longest: 0, lastActiveDate: '' }
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    return raw ? JSON.parse(raw) : { current: 0, longest: 0, lastActiveDate: '' }
  } catch {
    return { current: 0, longest: 0, lastActiveDate: '' }
  }
}

function saveStreak(data: StreakData) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

export function useStreak(todayDate: string, todayBlocks: TimeBlock[], onSave?: (s: StreakData) => void) {
  const [streak, setStreak] = useState<StreakData>(() => loadStreak())

  useEffect(() => {
    const score = calculateDailyScore(todayBlocks)
    const hasAnyCompleted = todayBlocks.some((b) => b.status === 'completed')
    const isActive = score >= ACTIVE_THRESHOLD || hasAnyCompleted

    const current = loadStreak()

    // If already recorded today, only update if we crossed the active threshold
    if (current.lastActiveDate === todayDate) {
      if (isActive && current.current === 0) {
        const updated = { current: 1, longest: Math.max(1, current.longest), lastActiveDate: todayDate }
        saveStreak(updated)
        setStreak(updated)
      }
      return
    }

    if (!isActive) return  // nothing to update until today becomes active

    const yesterday = format(
      subDays(parse(todayDate, 'yyyy-MM-dd', new Date()), 1),
      'yyyy-MM-dd'
    )

    const newCurrent =
      current.lastActiveDate === yesterday ? current.current + 1 : 1

    const updated: StreakData = {
      current: newCurrent,
      longest: Math.max(current.longest, newCurrent),
      lastActiveDate: todayDate,
    }

    saveStreak(updated)
    setStreak(updated)
    onSave?.(updated)
  }, [todayBlocks, todayDate, onSave])

  return streak
}
