'use client'

import React, { useState, useMemo } from 'react'
import { format, subDays, startOfWeek, addDays, parse } from 'date-fns'
import { TrendingUp, TrendingDown, Minus, Zap, BookOpen, Dumbbell, GraduationCap, Briefcase, Utensils, Droplets, Trophy } from 'lucide-react'
import { calculateDailyScore, getScoreColor } from '@/lib/scoring'
import type { TimeBlock } from '@/types'
import { timeToMinutes } from '@/utils/formatters'

// ─── Data helpers ─────────────────────────────────────────────────────────────

function loadBlocks(dateStr: string): TimeBlock[] {
  try {
    const raw = localStorage.getItem(`daycal_schedule_${dateStr}`)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function loadHydration(dateStr: string): number {
  return parseInt(localStorage.getItem(`daycal_hydration_${dateStr}`) ?? '0', 10)
}

interface DayData {
  dateStr: string
  date: Date
  blocks: TimeBlock[]
  score: number
  studyMins: number
  gymCount: number
  classMins: number
  workMins: number
  mealCount: number
  hydration: number
}

function buildDayData(dateStr: string): DayData {
  const blocks = loadBlocks(dateStr)
  const completed = blocks.filter(b => b.status === 'completed')
  return {
    dateStr,
    date: parse(dateStr, 'yyyy-MM-dd', new Date()),
    blocks,
    score: blocks.length > 0 ? calculateDailyScore(blocks) : -1,
    studyMins: completed.filter(b => b.category === 'study').reduce((s, b) => s + (timeToMinutes(b.endTime) - timeToMinutes(b.startTime)), 0),
    gymCount: completed.filter(b => b.category === 'gym').length,
    classMins: completed.filter(b => b.category === 'class').reduce((s, b) => s + (timeToMinutes(b.endTime) - timeToMinutes(b.startTime)), 0),
    workMins: completed.filter(b => b.category === 'work').reduce((s, b) => s + (timeToMinutes(b.endTime) - timeToMinutes(b.startTime)), 0),
    mealCount: completed.filter(b => b.category === 'meal').length,
    hydration: loadHydration(dateStr),
  }
}

// ─── Chart components ─────────────────────────────────────────────────────────

function BarChart({ data, label, color = '#3B82F6', unit = '' }: {
  data: { label: string; value: number }[]
  label: string
  color?: string
  unit?: string
}) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{label}</p>
      <div className="flex items-end gap-1.5 h-28">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="w-full flex flex-col justify-end" style={{ height: '88px' }}>
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: `${Math.max(2, (d.value / max) * 88)}px`, backgroundColor: d.value > 0 ? color : '#E5E7EB' }}
              />
            </div>
            <span className="text-[9px] text-gray-400 dark:text-gray-500 truncate w-full text-center">{d.label}</span>
          </div>
        ))}
      </div>
      {unit && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 text-right">{unit}</p>}
    </div>
  )
}

function HeatmapGrid({ days }: { days: DayData[] }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  // Group into weeks (16 weeks, Sun-Sat)
  const weekStart = startOfWeek(subDays(new Date(), 16 * 7 - 1), { weekStartsOn: 0 })
  const grid: (DayData | null)[][] = []

  for (let w = 0; w < 16; w++) {
    const week: (DayData | null)[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(weekStart, w * 7 + d)
      const ds = format(date, 'yyyy-MM-dd')
      if (ds > today) { week.push(null); continue }
      week.push(days.find(day => day.dateStr === ds) ?? { dateStr: ds, date, blocks: [], score: -1, studyMins: 0, gymCount: 0, classMins: 0, workMins: 0, mealCount: 0, hydration: 0 })
    }
    grid.push(week)
  }

  return (
    <div>
      <div className="flex gap-0.5 mb-1">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-gray-300 dark:text-gray-600">{d}</div>
        ))}
      </div>
      <div className="space-y-0.5">
        {grid.map((week, wi) => (
          <div key={wi} className="flex gap-0.5">
            {week.map((day, di) => {
              if (!day) return <div key={di} className="flex-1 aspect-square rounded-sm" />
              const bg = day.score === -1
                ? 'bg-gray-100 dark:bg-[#2C2C2E]'
                : day.score >= 80 ? 'bg-green-400 dark:bg-green-500'
                : day.score >= 50 ? 'bg-yellow-300 dark:bg-yellow-500'
                : day.score > 0  ? 'bg-red-300 dark:bg-red-500'
                : 'bg-gray-100 dark:bg-[#2C2C2E]'
              const isToday = day.dateStr === today
              return (
                <div
                  key={di}
                  title={`${day.dateStr}${day.score >= 0 ? `: ${day.score}%` : ''}`}
                  className={`flex-1 aspect-square rounded-sm ${bg} ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 justify-end">
        <span className="text-[9px] text-gray-400">Less</span>
        {['bg-gray-100 dark:bg-[#2C2C2E]', 'bg-red-300 dark:bg-red-500', 'bg-yellow-300 dark:bg-yellow-500', 'bg-green-400 dark:bg-green-500'].map((c, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
        ))}
        <span className="text-[9px] text-gray-400">More</span>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'flat' }) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="flex items-end gap-2 mt-1">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{value}</p>
        {trend && (
          trend === 'up' ? <TrendingUp size={14} className="text-green-500 mb-1" />
          : trend === 'down' ? <TrendingDown size={14} className="text-red-400 mb-1" />
          : <Minus size={14} className="text-gray-400 mb-1" />
        )}
      </div>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type AnalyticsTab = 'overview' | 'trends' | 'insights'

export function AnalyticsView() {
  const [tab, setTab] = useState<AnalyticsTab>('overview')

  // Build last 112 days (16 weeks) of data
  const days = useMemo<DayData[]>(() => {
    const result: DayData[] = []
    for (let i = 111; i >= 0; i--) {
      const ds = format(subDays(new Date(), i), 'yyyy-MM-dd')
      result.push(buildDayData(ds))
    }
    return result
  }, [])

  const daysWithData = days.filter(d => d.blocks.length > 0)
  const scoredDays = daysWithData.filter(d => d.score >= 0)
  const avgScore = scoredDays.length > 0
    ? Math.round(scoredDays.reduce((s, d) => s + d.score, 0) / scoredDays.length)
    : 0

  // Last 8 weeks of study/gym data
  const last8Weeks = useMemo(() => {
    const weeks = []
    for (let w = 7; w >= 0; w--) {
      const start = startOfWeek(subDays(new Date(), w * 7), { weekStartsOn: 1 })
      const weekDays = Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'))
      const wDays = days.filter(d => weekDays.includes(d.dateStr))
      weeks.push({
        label: format(start, 'MMM d'),
        studyHrs: Math.round(wDays.reduce((s, d) => s + d.studyMins, 0) / 60 * 10) / 10,
        workouts: wDays.reduce((s, d) => s + d.gymCount, 0),
        meals: wDays.reduce((s, d) => s + d.mealCount, 0),
        avgScore: (() => { const sd = wDays.filter(d => d.score >= 0); return sd.length ? Math.round(sd.reduce((s, d) => s + d.score, 0) / sd.length) : 0 })(),
      })
    }
    return weeks
  }, [days])

  // Category breakdown (total hours last 30 days)
  const last30 = days.slice(-30)
  const catTotals = {
    study: last30.reduce((s, d) => s + d.studyMins, 0),
    class: last30.reduce((s, d) => s + d.classMins, 0),
    gym: last30.reduce((s, d) => s + d.gymCount * 60, 0), // approx 1h per session
    work: last30.reduce((s, d) => s + d.workMins, 0),
  }
  const totalMins = Object.values(catTotals).reduce((a, b) => a + b, 0) || 1

  // Insights
  const dayOfWeekScores: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  scoredDays.forEach(d => dayOfWeekScores[d.date.getDay()].push(d.score))
  const avgByDow = Object.entries(dayOfWeekScores).map(([dow, scores]) => ({
    dow: parseInt(dow),
    avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    count: scores.length,
  })).filter(d => d.count > 0)

  const DOW_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const bestDow = avgByDow.reduce((best, d) => d.avg > best.avg ? d : best, { dow: 0, avg: 0, count: 0 })
  const worstDow = avgByDow.reduce((worst, d) => d.avg < worst.avg ? d : worst, { dow: 0, avg: 100, count: 0 })

  const recentScores = scoredDays.slice(-14).map(d => d.score)
  const trend = recentScores.length >= 4
    ? recentScores.slice(-7).reduce((a, b) => a + b, 0) / 7 - recentScores.slice(-14, -7).reduce((a, b) => a + b, 0) / 7
    : 0

  const streak = (() => {
    try { return JSON.parse(localStorage.getItem('daycal_streak') ?? '{}')?.currentStreak ?? 0 } catch { return 0 }
  })()

  const tabs: { id: AnalyticsTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'trends', label: 'Trends' },
    { id: 'insights', label: 'Insights' },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="shrink-0 bg-white dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-[#38383A] flex px-4 gap-1 pt-2">
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={['px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors',
              tab === id ? 'text-blue-600 dark:text-blue-400 border-blue-500' : 'text-gray-400 dark:text-gray-500 border-transparent hover:text-gray-600',
            ].join(' ')}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Avg Score" value={`${avgScore}%`} sub={`${scoredDays.length} days tracked`} trend={trend > 3 ? 'up' : trend < -3 ? 'down' : 'flat'} />
              <StatCard label="Current Streak" value={`${streak}d`} sub="days in a row" trend={streak >= 7 ? 'up' : 'flat'} />
              <StatCard label="Study (30d)" value={`${Math.round(last30.reduce((s, d) => s + d.studyMins, 0) / 60)}h`} sub="total hours" />
              <StatCard label="Workouts (30d)" value={`${last30.reduce((s, d) => s + d.gymCount, 0)}`} sub="sessions completed" />
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Daily score — last 16 weeks</p>
              <HeatmapGrid days={days} />
            </div>

            {/* Category breakdown */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Time breakdown (last 30 days)</p>
              <div className="space-y-3">
                {[
                  { label: 'Study', mins: catTotals.study, color: '#8B5CF6', icon: BookOpen },
                  { label: 'Class', mins: catTotals.class, color: '#3B82F6', icon: GraduationCap },
                  { label: 'Gym', mins: catTotals.gym, color: '#F59E0B', icon: Dumbbell },
                  { label: 'Work', mins: catTotals.work, color: '#10B981', icon: Briefcase },
                ].map(({ label, mins, color, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon size={13} style={{ color }} className="shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-300 w-12 shrink-0">{label}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-[#2C2C2E] rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(mins / totalMins) * 100}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 w-10 text-right shrink-0">{Math.round(mins / 60)}h</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── TRENDS ── */}
        {tab === 'trends' && (
          <>
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4">
              <BarChart
                label="Study hours per week"
                data={last8Weeks.map(w => ({ label: w.label, value: w.studyHrs }))}
                color="#8B5CF6"
                unit="hours"
              />
            </div>
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4">
              <BarChart
                label="Workouts per week"
                data={last8Weeks.map(w => ({ label: w.label, value: w.workouts }))}
                color="#F59E0B"
                unit="sessions"
              />
            </div>
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4">
              <BarChart
                label="Avg daily score per week"
                data={last8Weeks.map(w => ({ label: w.label, value: w.avgScore }))}
                color="#3B82F6"
                unit="out of 100"
              />
            </div>
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4">
              <BarChart
                label="Meals tracked per week"
                data={last8Weeks.map(w => ({ label: w.label, value: w.meals }))}
                color="#10B981"
                unit="meals"
              />
            </div>
          </>
        )}

        {/* ── INSIGHTS ── */}
        {tab === 'insights' && (
          <div className="space-y-3">
            {daysWithData.length === 0 ? (
              <div className="text-center py-16">
                <Zap size={32} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No data yet — start tracking your days to see insights</p>
              </div>
            ) : (
              <>
                {/* Score trend */}
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4 flex items-start gap-3">
                  {trend > 3 ? <TrendingUp size={18} className="text-green-500 shrink-0 mt-0.5" />
                    : trend < -3 ? <TrendingDown size={18} className="text-red-400 shrink-0 mt-0.5" />
                    : <Minus size={18} className="text-gray-400 shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {trend > 3 ? 'You\'re on an upward trend' : trend < -3 ? 'Your scores have been slipping' : 'Your scores are steady'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {Math.abs(Math.round(trend))}% {trend > 0 ? 'higher' : 'lower'} this week vs last week
                    </p>
                  </div>
                </div>

                {/* Best day of week */}
                {bestDow.count >= 2 && (
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4 flex items-start gap-3">
                    <Trophy size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                        You perform best on {DOW_LABELS[bestDow.dow]}s
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Average score of {bestDow.avg}% on {DOW_LABELS[bestDow.dow]}s
                      </p>
                    </div>
                  </div>
                )}

                {/* Worst day of week */}
                {worstDow.count >= 2 && worstDow.dow !== bestDow.dow && (
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4 flex items-start gap-3">
                    <TrendingDown size={18} className="text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                        {DOW_LABELS[worstDow.dow]}s tend to be tougher
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Average score of {worstDow.avg}% — try protecting your {DOW_LABELS[worstDow.dow]} schedule
                      </p>
                    </div>
                  </div>
                )}

                {/* Study insight */}
                {catTotals.study > 0 && (
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4 flex items-start gap-3">
                    <BookOpen size={18} className="text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                        {Math.round(catTotals.study / 60)}h of study in the last 30 days
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        That's ~{Math.round(catTotals.study / 60 / 4.3)}h per week on average
                      </p>
                    </div>
                  </div>
                )}

                {/* Gym insight */}
                {last30.reduce((s, d) => s + d.gymCount, 0) > 0 && (
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4 flex items-start gap-3">
                    <Dumbbell size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                        {last30.reduce((s, d) => s + d.gymCount, 0)} workouts in the last 30 days
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        ~{Math.round(last30.reduce((s, d) => s + d.gymCount, 0) / 4.3 * 10) / 10} sessions per week
                      </p>
                    </div>
                  </div>
                )}

                {/* Hydration insight */}
                {last30.reduce((s, d) => s + d.hydration, 0) > 0 && (
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4 flex items-start gap-3">
                    <Droplets size={18} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                        Avg {Math.round(last30.reduce((s, d) => s + d.hydration, 0) / Math.max(1, last30.filter(d => d.hydration > 0).length) * 10) / 10} glasses/day
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {last30.reduce((s, d) => s + d.hydration, 0) >= last30.filter(d => d.hydration > 0).length * 8
                          ? 'Great hydration habit! Keep it up.' : 'Try to hit 8 glasses daily for best results.'}
                      </p>
                    </div>
                  </div>
                )}

                {daysWithData.length < 7 && (
                  <p className="text-center text-xs text-gray-300 dark:text-gray-600 pt-2">
                    Track more days to unlock deeper insights
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
