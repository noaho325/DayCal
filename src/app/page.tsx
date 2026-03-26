'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  BarChart2,
  Target,
  User,
  Settings,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  GraduationCap,
  BookOpen,
  Utensils,
  Dumbbell,
  Briefcase,
  ClipboardList,
  Star,
  Menu,
  Moon,
  Sun,
  Users,
  Camera,
  Shield,
  Droplets,
  Flame,
  Trophy,
  Zap,
  CheckCircle,
  Lock,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react'
import { format, parse, addDays, subDays, startOfWeek } from 'date-fns'
import { useSchedule } from '@/hooks/useSchedule'
import { useGoals } from '@/hooks/useGoals'
import { useStreak } from '@/hooks/useStreak'
import { Timeline } from '@/components/schedule/Timeline'
import { GoalProgressPanel } from '@/components/goals/GoalProgressPanel'
import { MorningBriefing } from '@/components/goals/MorningBriefing'
import { EndOfDayReview } from '@/components/goals/EndOfDayReview'
import { WeeklySummaryReport } from '@/components/goals/WeeklySummaryReport'
import { MealsView } from '@/components/meals/MealsView'
import { SocialView } from '@/components/social/SocialView'
import { AnalyticsView } from '@/components/analytics/AnalyticsView'
import { getTodayString } from '@/utils/formatters'
import { calculateDailyScore, getScoreColor } from '@/lib/scoring'
import type { OnboardingGoals, UserCategory, TimeBlock, BlockPriority } from '@/types'
import {
  loadUserCategories,
  saveUserCategories,
  loadCategoryOverrides,
  saveCategoryOverrides,
  getCategoryMeta,
  BUILTIN_CATEGORY_ORDER,
  CATEGORY_META,
} from '@/utils/constants'
import type { CategoryOverride } from '@/utils/constants'

const PREF_ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap, BookOpen, Utensils, Dumbbell, Briefcase,
}

type ViewMode = 'day' | 'week' | 'month'
type NavTab = 'today' | 'points' | 'meals' | 'social' | 'analytics' | 'preferences' | 'profile'

function formatDisplayDate(dateStr: string): { weekday: string; date: string } {
  const d = parse(dateStr, 'yyyy-MM-dd', new Date())
  const today = getTodayString()
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  let weekday: string
  if (dateStr === today) weekday = 'Today'
  else if (dateStr === yesterday) weekday = 'Yesterday'
  else if (dateStr === tomorrow) weekday = 'Tomorrow'
  else weekday = format(d, 'EEEE')

  return { weekday, date: format(d, 'MMM d') }
}

function navigateDate(dateStr: string, delta: number): string {
  const d = parse(dateStr, 'yyyy-MM-dd', new Date())
  const next = delta > 0 ? addDays(d, 1) : subDays(d, 1)
  return format(next, 'yyyy-MM-dd')
}

// ─── App Sidebar ──────────────────────────────────────────────────────────────

function AppSidebar({
  activeTab,
  onNavigate,
  mealsEnabled,
  mobile = false,
}: {
  activeTab: NavTab
  onNavigate: (tab: NavTab) => void
  mealsEnabled: boolean
  mobile?: boolean
}) {
  const sections = [
    {
      label: 'Views',
      items: [
        { id: 'today' as NavTab, icon: CalendarDays, label: 'Calendar' },
        { id: 'points' as NavTab, icon: Star, label: 'Points' },
        { id: 'analytics' as NavTab, icon: BarChart2, label: 'Analytics' },
        { id: 'social' as NavTab, icon: Users, label: 'Social' },
        ...(mealsEnabled ? [{ id: 'meals' as NavTab, icon: Utensils, label: 'Meals' }] : []),
      ],
    },
    {
      label: 'Settings',
      items: [
        { id: 'preferences' as NavTab, icon: Settings, label: 'Preferences' },
        { id: 'profile' as NavTab, icon: User, label: 'Profile' },
      ],
    },
  ]

  const showLabel = (always: boolean) => always ? '' : 'hidden lg:block'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-gray-100 dark:border-[#38383A] shrink-0">
        <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
          <CalendarDays size={16} className="text-white" />
        </div>
        <span className={['font-bold text-gray-900 dark:text-gray-50 text-sm', showLabel(mobile)].join(' ')}>
          DayCal
        </span>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {sections.map((section, si) => (
          <div key={section.label}>
            {si > 0 && <div className="h-px bg-gray-100 dark:bg-[#38383A] my-2 mx-1" />}
            <p className={[
              'text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2 pb-1 pt-1',
              showLabel(mobile),
            ].join(' ')}>
              {section.label}
            </p>
            {section.items.map(({ id, icon: Icon, label }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  title={label}
                  className={[
                    'w-full flex items-center gap-3 rounded-xl py-2.5 transition-colors',
                    mobile
                      ? 'px-3 justify-start'
                      : 'px-3 justify-start md:max-lg:justify-center md:max-lg:px-0 md:max-lg:py-3',
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] hover:text-gray-700 dark:hover:text-gray-200',
                  ].join(' ')}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} className="shrink-0" />
                  <span className={['text-sm font-medium', showLabel(mobile)].join(' ')}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(getTodayString)
  const [activeTab, setActiveTab] = useState<NavTab>('today')
  const prefCatRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [hydration, setHydration] = useState(0)

  useEffect(() => {
    setMounted(true)
    setDarkMode(document.documentElement.classList.contains('dark'))
    setHydration(parseInt(localStorage.getItem(`daycal_hydration_${new Date().toISOString().slice(0,10)}`) ?? '0', 10))
    const loggedIn = localStorage.getItem('daycal_logged_in')
    const onboarded = localStorage.getItem('daycal_onboarded')
    if (!loggedIn) {
      router.replace('/login')
    } else if (!onboarded) {
      router.replace('/onboarding')
    }
  }, [router])

  const toggleDarkMode = () => {
    const isDark = !darkMode
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('daycal_theme', isDark ? 'dark' : 'light')
  }

  const {
    blocks,
    loading,
    addBlock,
    updateBlock,
    deleteBlock,
    delayBlock,
    pushAllBack,
    skipBlock,
    excuseBlock,
    completeBlock,
    undo,
    canUndo,
  } = useSchedule(currentDate)

  const today = getTodayString()

  // Always compute goals/streak for TODAY regardless of which date is being viewed
  const todayBlocksForGoals = useMemo(() => {
    if (currentDate === today) return blocks
    try {
      const raw = localStorage.getItem(`daycal_schedule_${today}`)
      return raw ? (JSON.parse(raw) as TimeBlock[]) : []
    } catch { return [] }
  }, [currentDate, blocks, today])
  const { goals, weekProgress } = useGoals(todayBlocksForGoals, today)
  const streak = useStreak(today, todayBlocksForGoals)

  // Morning briefing — show once per morning (5am–1pm)
  const [showMorning, setShowMorning] = useState(false)
  // End-of-day review
  const [showEod, setShowEod] = useState(false)
  // Weekly summary — show Sunday evening or Monday morning
  const [showWeeklySummary, setShowWeeklySummary] = useState(false)

  useEffect(() => {
    if (!mounted) return
    const today = getTodayString()
    const now = new Date()
    const h = now.getHours()
    if (
      currentDate === today &&
      h >= 5 && h < 13 &&
      !localStorage.getItem(`daycal_morning_${today}`)
    ) {
      setShowMorning(true)
    }
  }, [mounted, currentDate])

  useEffect(() => {
    if (!mounted) return
    const today = getTodayString()
    const h = new Date().getHours()
    if (
      currentDate === today &&
      h >= 21 &&
      !localStorage.getItem(`daycal_eod_${today}`)
    ) {
      setShowEod(true)
    }
  }, [mounted, currentDate, blocks])

  useEffect(() => {
    if (!mounted) return
    const now = new Date()
    const dow = now.getDay() // 0=Sun, 1=Mon
    const h = now.getHours()
    // Show on Sunday 7pm+ or Monday before noon
    const isSundayEvening = dow === 0 && h >= 19
    const isMondayMorning = dow === 1 && h < 12
    if ((isSundayEvening || isMondayMorning) && !localStorage.getItem(`daycal_weekly_${format(now, 'yyyy-ww')}`)) {
      setShowWeeklySummary(true)
    }
  }, [mounted])

  const [mealsEnabled, setMealsEnabled] = useState(false)
  useEffect(() => {
    if (!mounted) return
    setMealsEnabled(localStorage.getItem('daycal_meals_enabled') === 'true')
  }, [mounted])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const logMealToDate = useCallback(
    (meal: Omit<TimeBlock, 'id'>, dateStr: string) => {
      if (dateStr === currentDate) {
        addBlock(meal)
      } else {
        try {
          const key = `daycal_schedule_${dateStr}`
          const existing: TimeBlock[] = JSON.parse(localStorage.getItem(key) ?? '[]')
          const block: TimeBlock = {
            ...meal,
            id: `meal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          }
          localStorage.setItem(key, JSON.stringify([...existing, block]))
        } catch {}
      }
    },
    [currentDate, addBlock]
  )

  const dismissMorning = () => {
    localStorage.setItem(`daycal_morning_${currentDate}`, '1')
    setShowMorning(false)
  }

  const dismissEod = () => setShowEod(false)

  const dismissWeeklySummary = () => {
    localStorage.setItem(`daycal_weekly_${format(new Date(), 'yyyy-ww')}`, '1')
    setShowWeeklySummary(false)
  }

  const { weekday, date } = formatDisplayDate(currentDate)

  // Yesterday's score for morning briefing
  const yesterdayDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const yesterdayScore = weekProgress.dailyScores[yesterdayDate] ?? null

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0F0F10]">
        <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  const tabTitles: Record<NavTab, string> = {
    today: 'Calendar', points: 'Points', meals: 'Meals', social: 'Social', analytics: 'Analytics', preferences: 'Preferences', profile: 'Profile',
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-[#0F0F10] overflow-hidden">

      {/* ── Mobile sidebar overlay (sm only) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 flex md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="w-64 h-full bg-white dark:bg-[#1C1C1E] border-r border-gray-100 dark:border-[#38383A] shadow-2xl shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <AppSidebar
              activeTab={activeTab}
              onNavigate={(t) => { setActiveTab(t); setSidebarOpen(false) }}
              mealsEnabled={mealsEnabled}
              mobile
            />
          </div>
          <div className="flex-1 bg-black/30" />
        </div>
      )}

      {/* ── Desktop sidebar (md icon-rail, lg full) ── */}
      <div className="hidden md:flex md:w-16 lg:w-60 flex-col bg-white dark:bg-[#1C1C1E] border-r border-gray-100 dark:border-[#38383A] shrink-0">
        <AppSidebar
          activeTab={activeTab}
          onNavigate={setActiveTab}
          mealsEnabled={mealsEnabled}
        />
      </div>

      {/* ── Main content ── */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">

        {/* Header */}
        <header className="bg-white dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-[#38383A] shrink-0">
          <div className="flex items-center gap-3 px-4 h-14">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-colors md:hidden shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {activeTab === 'today' && (
              <>
                {/* Today button */}
                <button
                  onClick={() => setCurrentDate(today)}
                  className="text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-[#38383A] rounded-full px-3.5 py-1.5 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors shrink-0"
                >
                  Today
                </button>

                {/* Chevrons */}
                <div className="flex items-center">
                  <button
                    onClick={() => setCurrentDate((d) => {
                      if (viewMode === 'month') {
                        const p = parse(d, 'yyyy-MM-dd', new Date())
                        return format(new Date(p.getFullYear(), p.getMonth() - 1, 1), 'yyyy-MM-dd')
                      }
                      if (viewMode === 'week') {
                        const p = parse(d, 'yyyy-MM-dd', new Date())
                        return format(subDays(p, 7), 'yyyy-MM-dd')
                      }
                      return navigateDate(d, -1)
                    })}
                    className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-colors"
                    aria-label="Previous"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentDate((d) => {
                      if (viewMode === 'month') {
                        const p = parse(d, 'yyyy-MM-dd', new Date())
                        return format(new Date(p.getFullYear(), p.getMonth() + 1, 1), 'yyyy-MM-dd')
                      }
                      if (viewMode === 'week') {
                        const p = parse(d, 'yyyy-MM-dd', new Date())
                        return format(addDays(p, 7), 'yyyy-MM-dd')
                      }
                      return navigateDate(d, 1)
                    })}
                    className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-colors"
                    aria-label="Next"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Date label */}
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {viewMode === 'day'
                    ? format(parse(currentDate, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')
                    : viewMode === 'week'
                    ? (() => {
                        const ws = startOfWeek(parse(currentDate, 'yyyy-MM-dd', new Date()), { weekStartsOn: 1 })
                        const we = addDays(ws, 6)
                        return ws.getMonth() === we.getMonth()
                          ? format(ws, 'MMMM yyyy')
                          : `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`
                      })()
                    : format(parse(currentDate, 'yyyy-MM-dd', new Date()), 'MMMM yyyy')}
                </span>
              </>
            )}

            {activeTab !== 'today' && (
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{tabTitles[activeTab]}</h1>
            )}

            <div className="flex-1" />

            {/* View mode toggle — calendar only, inline in header */}
            {activeTab === 'today' && (
              <div className="hidden sm:flex bg-gray-100 dark:bg-[#2C2C2E] rounded-full p-0.5 mr-2">
                {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setViewMode(v)}
                    className={[
                      'px-3 py-1 text-xs font-medium rounded-full capitalize transition-all',
                      viewMode === v ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-gray-50 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                    ].join(' ')}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-colors shrink-0 mr-1"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Profile icon + dropdown */}
            <div className="relative shrink-0" ref={profileRef}>
              <button
                onClick={() => setProfileDropdownOpen((v) => !v)}
                className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors"
                aria-label="Profile"
              >
                <User size={16} />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1C1C1E] rounded-xl shadow-lg border border-gray-100 dark:border-[#38383A] py-1 z-50">
                  <button
                    onClick={() => { setActiveTab('profile'); setProfileDropdownOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] flex items-center gap-2.5 transition-colors"
                  >
                    <User size={14} className="text-gray-400" />
                    Profile
                  </button>
                  <button
                    onClick={() => { setActiveTab('preferences'); setProfileDropdownOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] flex items-center gap-2.5 transition-colors"
                  >
                    <Settings size={14} className="text-gray-400" />
                    Preferences
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-[#38383A] my-1" />
                  <button
                    onClick={() => { localStorage.removeItem('daycal_logged_in'); router.replace('/login') }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors"
                  >
                    <ChevronLeft size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* View mode toggle — mobile only (below header) */}
          {activeTab === 'today' && (
            <div className="flex sm:hidden items-center px-4 pb-2.5">
              <div className="flex bg-gray-100 dark:bg-[#2C2C2E] rounded-full p-0.5">
                {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setViewMode(v)}
                    className={[
                      'px-4 py-1.5 text-xs font-medium rounded-full capitalize transition-all',
                      viewMode === v ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-gray-50 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                    ].join(' ')}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Loading schedule...</p>
              </div>
            </div>
          ) : activeTab === 'today' ? (
            viewMode === 'day' ? (
              <div className="h-full flex flex-col overflow-hidden">
                <GoalProgressPanel
                  weekProgress={weekProgress}
                  goals={goals}
                  streak={streak}
                  currentDate={currentDate}
                />
                {/* Hydration tracker */}
                {currentDate === today && (
                  <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-[#38383A] bg-white dark:bg-[#1C1C1E]">
                    <Droplets size={14} className="text-blue-400 shrink-0" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Hydration</span>
                    <div className="flex items-center gap-1 ml-1">
                      {Array.from({ length: 8 }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const next = i < hydration ? i : i + 1
                            setHydration(next)
                            localStorage.setItem(`daycal_hydration_${today}`, String(next))
                          }}
                          className={`w-4 h-4 rounded-full transition-colors ${i < hydration ? 'bg-blue-400' : 'bg-gray-200 dark:bg-[#3A3A3C] hover:bg-blue-200'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{hydration}/8</span>
                    {hydration > 0 && (
                      <button
                        onClick={() => { setHydration(0); localStorage.setItem(`daycal_hydration_${today}`, '0') }}
                        className="ml-auto text-[10px] text-gray-300 dark:text-gray-600 hover:text-gray-400 transition-colors"
                      >
                        reset
                      </button>
                    )}
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <Timeline
                    blocks={blocks}
                    onAddBlock={addBlock}
                    onUpdateBlock={updateBlock}
                    onDeleteBlock={deleteBlock}
                    onDelayBlock={delayBlock}
                    onPushAllBack={pushAllBack}
                    onSkipBlock={skipBlock}
                    onExcuseBlock={excuseBlock}
                    onCompleteBlock={completeBlock}
                    onUndo={undo}
                    canUndo={canUndo}
                    onAddNewCategory={() => {
                      setActiveTab('preferences')
                      setTimeout(() => prefCatRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
                    }}
                  />
                </div>
                {currentDate === today && new Date().getHours() >= 18 && (
                  <div className="shrink-0 px-4 pb-2 pt-1">
                    <button
                      onClick={() => setShowEod(true)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#2C2C2E] hover:bg-gray-200 dark:hover:bg-[#3A3A3C] rounded-xl transition-colors"
                    >
                      <ClipboardList size={14} />
                      End-of-Day Review
                    </button>
                  </div>
                )}
              </div>
            ) : viewMode === 'week' ? (
              <WeekCalendarView
                currentDate={currentDate}
                weekProgress={weekProgress}
                goals={goals}
                streak={streak}
                onSelectDate={(d) => { setCurrentDate(d); setViewMode('day') }}
              />
            ) : (
              <MonthCalendarView
                currentDate={currentDate}
                onSelectDate={(d) => { setCurrentDate(d); setViewMode('day') }}
              />
            )
          ) : activeTab === 'points' ? (
            <PointsView weekProgress={weekProgress} streak={streak} />
          ) : activeTab === 'meals' ? (
            <MealsView onLogMeal={logMealToDate} />
          ) : activeTab === 'social' ? (
            <SocialView />
          ) : activeTab === 'analytics' ? (
            <AnalyticsView />
          ) : activeTab === 'preferences' ? (
            <PreferencesView catSectionRef={prefCatRef} mealsEnabled={mealsEnabled} onMealsToggle={(v) => { setMealsEnabled(v); localStorage.setItem('daycal_meals_enabled', String(v)) }} />
          ) : (
            <ProfileView />
          )}
        </main>
      </div>

      {/* Phase 2 modals */}
      {showMorning && (
        <MorningBriefing
          goals={goals}
          weekProgress={weekProgress}
          todayBlocks={blocks}
          streak={streak}
          yesterdayScore={yesterdayScore}
          onDismiss={dismissMorning}
        />
      )}
      {showEod && (
        <EndOfDayReview
          todayBlocks={blocks}
          weekProgress={weekProgress}
          goals={goals}
          todayDate={currentDate}
          onDismiss={dismissEod}
        />
      )}
      {showWeeklySummary && (
        <WeeklySummaryReport
          weekProgress={weekProgress}
          goals={goals}
          streak={streak}
          currentDate={currentDate}
          onDismiss={dismissWeeklySummary}
        />
      )}
    </div>
  )
}

// ─── Shared calendar helpers ──────────────────────────────────────────────────

function loadBlocksForDate(dateStr: string): TimeBlock[] {
  try {
    const raw = localStorage.getItem(`daycal_schedule_${dateStr}`)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function formatShortTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, '0')}${ampm}`
}

// ─── Week View ────────────────────────────────────────────────────────────────

interface WeekViewProps {
  currentDate: string
  weekProgress: import('@/hooks/useGoals').WeekProgress
  goals: OnboardingGoals
  streak: import('@/hooks/useStreak').StreakData
  onSelectDate: (d: string) => void
}

function WeekCalendarView({ currentDate, weekProgress, goals, streak, onSelectDate }: WeekViewProps) {
  const today = getTodayString()
  const weekStart = startOfWeek(parse(currentDate, 'yyyy-MM-dd', new Date()), { weekStartsOn: 1 })
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i)
    const dateStr = format(d, 'yyyy-MM-dd')
    return { dateStr, label: format(d, 'EEE'), num: format(d, 'd'), isToday: dateStr === today }
  })

  const [allBlocks, setAllBlocks] = useState<Record<string, TimeBlock[]>>({})

  useEffect(() => {
    const result: Record<string, TimeBlock[]> = {}
    for (let i = 0; i < 7; i++) {
      const d = addDays(parse(weekStartStr, 'yyyy-MM-dd', new Date()), i)
      const dateStr = format(d, 'yyyy-MM-dd')
      result[dateStr] = loadBlocksForDate(dateStr)
    }
    setAllBlocks(result)
  }, [weekStartStr])

  const userCats = loadUserCategories()

  const enabled = goals.enabledGoals ?? { study: true, workouts: true, meals: true, sleep: false, work: false }
  const bars = [
    { key: 'study', label: 'Study', icon: <BookOpen size={16} className="text-purple-500" />, actual: weekProgress.studyHours, target: goals.studyHoursPerWeek, unit: 'h', enabled: enabled.study },
    { key: 'workouts', label: 'Workouts', icon: <Dumbbell size={16} className="text-green-500" />, actual: weekProgress.workouts, target: goals.workoutsPerWeek, unit: '', enabled: enabled.workouts },
    { key: 'meals', label: 'Meals/day', icon: <Utensils size={16} className="text-amber-500" />, actual: weekProgress.avgMealsPerDay, target: goals.mealsPerDay, unit: '', enabled: enabled.meals },
    { key: 'work', label: 'Work', icon: <Briefcase size={16} className="text-blue-500" />, actual: weekProgress.workHours, target: goals.workHoursPerWeek, unit: 'h', enabled: enabled.work ?? false },
  ].filter((b) => b.enabled && b.target > 0)

  // Weekly summary stats
  const scoreValues = Object.values(weekProgress.dailyScores)
  const avgScore = scoreValues.length > 0 ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : null
  const bestScore = scoreValues.length > 0 ? Math.max(...scoreValues) : null
  const worstScore = scoreValues.length > 0 ? Math.min(...scoreValues) : null

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Week grid — fills available width, responsive height */}
      <div className="shrink-0 overflow-x-auto bg-white dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-[#38383A]" style={{ height: 'clamp(200px, 38vh, 480px)' }}>
        <div className="grid h-full" style={{ gridTemplateColumns: 'repeat(7, minmax(88px, 1fr))' }}>
          {days.map((day) => {
            const dayBlocks = (allBlocks[day.dateStr] || [])
              .filter((b) => !b.isFlexible)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
            const dayScore = weekProgress.dailyScores[day.dateStr]

            return (
              <div
                key={day.dateStr}
                className={['flex flex-col border-r border-gray-100 dark:border-[#38383A] last:border-r-0 min-w-0', day.isToday ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''].join(' ')}
              >
                {/* Day header — tap to go to day */}
                <button
                  onClick={() => onSelectDate(day.dateStr)}
                  className="shrink-0 flex flex-col items-center py-2 border-b border-gray-100 dark:border-[#38383A] w-full"
                >
                  <span className={`text-[10px] font-medium ${day.isToday ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`}>{day.label}</span>
                  <div className={['w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold mt-0.5', day.isToday ? 'bg-blue-500 text-white' : 'text-gray-800 dark:text-gray-100'].join(' ')}>
                    {day.num}
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full mt-0.5" style={{ backgroundColor: dayScore !== undefined ? getScoreColor(dayScore) : 'transparent' }} />
                </button>

                {/* Mini event list */}
                <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
                  {dayBlocks.length === 0 ? (
                    <p className="text-center text-gray-200 dark:text-gray-700 text-xl pt-3">·</p>
                  ) : dayBlocks.map((block) => {
                    const meta = getCategoryMeta(block.category, userCats)
                    const bgColor = block.status === 'completed' ? '#F0FDF4'
                      : block.status === 'skipped' ? '#FEF2F2'
                      : meta.color + '22'
                    const borderColor = block.status === 'completed' ? '#22C55E'
                      : block.status === 'skipped' ? '#EF4444'
                      : meta.color
                    return (
                      <div key={block.id} className="rounded overflow-hidden" style={{ backgroundColor: bgColor, borderLeft: `2.5px solid ${borderColor}` }}>
                        <div className="px-1 py-0.5">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-none">{formatShortTime(block.startTime)}</p>
                          <p className="text-[10px] font-medium text-gray-800 dark:text-gray-100 leading-tight truncate">{block.title}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats section */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Streak + points */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4 text-center">
            <div className="flex justify-center mb-1"><Flame size={28} className="text-orange-400" /></div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-50">{streak.current}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">day streak</p>
            {streak.longest > streak.current && <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">best: {streak.longest}</p>}
          </div>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4 text-center">
            <div className="flex justify-center mb-1"><Trophy size={28} className="text-amber-400" /></div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-50">{weekProgress.weeklyPoints}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">pts this week</p>
          </div>
        </div>

        {/* Weekly score summary */}
        {avgScore !== null && (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">This Week</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-gray-50">{avgScore}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">avg score</p>
              </div>
              <div>
                <p className="text-xl font-black" style={{ color: getScoreColor(bestScore!) }}>{bestScore}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">best day</p>
              </div>
              <div>
                <p className="text-xl font-black" style={{ color: getScoreColor(worstScore!) }}>{worstScore}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">toughest day</p>
              </div>
            </div>
          </div>
        )}

        {/* Goal bars */}
        {bars.length > 0 && (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Week Goals</p>
            <div className="space-y-4">
              {bars.map((bar) => {
                const pct = bar.target > 0 ? Math.min(bar.actual / bar.target, 1) : 0
                const color = pct >= 0.8 ? '#22C55E' : pct >= 0.45 ? '#EAB308' : '#EF4444'
                const actualStr = bar.unit === 'h' ? bar.actual.toFixed(1) : Math.round(bar.actual).toString()
                const targetStr = bar.unit === 'h' ? bar.target.toFixed(0) : bar.target.toString()
                return (
                  <div key={bar.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {bar.icon}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{bar.label}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {actualStr}{bar.unit} / {targetStr}{bar.unit}
                        <span className="ml-1.5 font-semibold" style={{ color }}>{Math.round(pct * 100)}%</span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-[#2C2C2E] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Score legend */}
        <div className="flex items-center justify-center gap-5 pb-2">
          {[['#22C55E', 'Great'], ['#EAB308', 'OK'], ['#EF4444', 'Rough']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface MonthViewProps {
  currentDate: string
  onSelectDate: (d: string) => void
}

function MonthCalendarView({ currentDate, onSelectDate }: MonthViewProps) {
  const today = getTodayString()
  const [viewDate, setViewDate] = useState(() => {
    const d = parse(currentDate, 'yyyy-MM-dd', new Date())
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  useEffect(() => {
    const d = parse(currentDate, 'yyyy-MM-dd', new Date())
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1))
  }, [currentDate])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = new Date(year, month, 1).getDay() // 0 = Sunday
  const numWeeks = Math.ceil((startOffset + daysInMonth) / 7)

  // Build per-day event data: { color, label }[] per dateStr
  const [dayEvents, setDayEvents] = useState<Record<string, { color: string; label: string }[]>>({})

  useEffect(() => {
    const userCats = loadUserCategories()
    const result: Record<string, { color: string; label: string }[]> = {}
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd')
      const blocks = loadBlocksForDate(dateStr).filter((b) => !b.isFlexible)
      const seen = new Set<string>()
      const events: { color: string; label: string }[] = []
      for (const block of blocks) {
        if (!seen.has(block.category) && events.length < 4) {
          seen.add(block.category)
          const meta = getCategoryMeta(block.category, userCats)
          events.push({ color: meta.color, label: meta.label })
        }
      }
      result[dateStr] = events
    }
    setDayEvents(result)
  }, [year, month, daysInMonth])

  // Flat array of all cells (nulls = offset padding, numbers = day of month)
  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full grid
  while (cells.length < numWeeks * 7) cells.push(null)

  const weeks: (number | null)[][] = []
  for (let i = 0; i < numWeeks; i++) weeks.push(cells.slice(i * 7, (i + 1) * 7))

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1C1C1E] overflow-hidden">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-[#38383A] shrink-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center py-2.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid — fills remaining height */}
      <div className="flex-1 grid overflow-hidden" style={{ gridTemplateRows: `repeat(${numWeeks}, 1fr)` }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-gray-100 dark:border-[#38383A] last:border-b-0">
            {week.map((day, di) => {
              if (day === null) {
                return <div key={`empty-${di}`} className="border-r border-gray-100 dark:border-[#38383A] last:border-r-0 bg-gray-50/50 dark:bg-[#0F0F10]/50" />
              }
              const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd')
              const isToday = dateStr === today
              const events = dayEvents[dateStr] ?? []

              return (
                <button
                  key={day}
                  onClick={() => onSelectDate(dateStr)}
                  className="border-r border-gray-100 dark:border-[#38383A] last:border-r-0 p-1.5 flex flex-col items-start text-left hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors min-h-0 overflow-hidden"
                >
                  {/* Date number */}
                  <div className={[
                    'w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1 shrink-0',
                    isToday ? 'bg-blue-500 text-white' : 'text-gray-800 dark:text-gray-100',
                  ].join(' ')}>
                    {day}
                  </div>

                  {/* Event color bars */}
                  <div className="w-full space-y-0.5 overflow-hidden">
                    {events.slice(0, 3).map((ev, ei) => (
                      <div
                        key={ei}
                        className="h-1.5 rounded-full w-full"
                        style={{ backgroundColor: ev.color }}
                        title={ev.label}
                      />
                    ))}
                    {events.length > 3 && (
                      <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-none pl-0.5">+{events.length - 3}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Schedule Templates ───────────────────────────────────────────────────────

interface TimeRange {
  startHour: number; startMinute: number
  endHour: number; endMinute: number
}

interface ScheduleSlot {
  days: number[]
  times: TimeRange[]
}

interface ScheduleTemplate {
  id: string
  title: string
  category: string
  priority: BlockPriority
  startDate: string
  endDate: string
  isRecurring: boolean
  slots: ScheduleSlot[]
  blocksCreated: number
}

function loadScheduleTemplates(): ScheduleTemplate[] {
  try {
    const raw = localStorage.getItem('daycal_schedule_templates')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveScheduleTemplates(templates: ScheduleTemplate[]) {
  localStorage.setItem('daycal_schedule_templates', JSON.stringify(templates))
}

function bulkCreateBlocks(template: ScheduleTemplate): number {
  let count = 0
  let cur = parse(template.startDate, 'yyyy-MM-dd', new Date())
  const end = parse(template.endDate, 'yyyy-MM-dd', new Date())

  while (cur <= end) {
    const dow = cur.getDay()
    for (const slot of template.slots) {
      if (!slot.days.includes(dow)) continue
      for (const time of slot.times) {
        const startTime = `${String(time.startHour).padStart(2,'0')}:${String(time.startMinute).padStart(2,'0')}`
        const endTime = `${String(time.endHour).padStart(2,'0')}:${String(time.endMinute).padStart(2,'0')}`
        const dur = (time.endHour * 60 + time.endMinute) - (time.startHour * 60 + time.startMinute)
        const dateStr = format(cur, 'yyyy-MM-dd')
        const key = `daycal_schedule_${dateStr}`
        let blocks: TimeBlock[] = []
        try { const raw = localStorage.getItem(key); if (raw) blocks = JSON.parse(raw) } catch {}
        blocks.push({
          id: `sched_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
          title: template.title, category: template.category,
          startTime, endTime, estimatedDuration: Math.max(dur, 15),
          priority: template.priority, isLocked: false, isFlexible: false,
          status: 'upcoming', isExcused: false, isRecurring: template.isRecurring, recurringPattern: 'weekly',
        })
        localStorage.setItem(key, JSON.stringify(blocks))
        count++
      }
    }
    cur = addDays(cur, 1)
  }
  return count
}

const SCHED_HOURS = Array.from({ length: 24 }, (_, i) => i)
const SCHED_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function TimeSelects({ hour, minute, onHour, onMinute }: { hour: number; minute: number; onHour: (v: number) => void; onMinute: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <select value={hour} onChange={(e) => onHour(+e.target.value)}
        className="border border-gray-200 dark:border-[#38383A] rounded-lg px-1.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-gray-50">
        {SCHED_HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2,'0')}</option>)}
      </select>
      <span className="text-gray-400 font-bold text-sm">:</span>
      <select value={minute} onChange={(e) => onMinute(+e.target.value)}
        className="border border-gray-200 dark:border-[#38383A] rounded-lg px-1.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-gray-50">
        {SCHED_MINUTES.map((m) => <option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
      </select>
    </div>
  )
}

const EMPTY_TIME: TimeRange = { startHour: 9, startMinute: 0, endHour: 10, endMinute: 0 }
const EMPTY_SLOT: ScheduleSlot = { days: [], times: [{ ...EMPTY_TIME }] }

function ScheduleCreatorView({ onBack, onSaved }: { onBack: () => void; onSaved: () => void }) {
  const [userCats] = useState<UserCategory[]>(() => loadUserCategories())
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<BlockPriority>('should')
  const [isRecurring, setIsRecurring] = useState(false)
  const [startDate, setStartDate] = useState(getTodayString())
  const [endDate, setEndDate] = useState('')
  const [slots, setSlots] = useState<ScheduleSlot[]>([{ ...EMPTY_SLOT, times: [{ ...EMPTY_TIME }] }])
  const [done, setDone] = useState<number | null>(null)

  const toggleSlotDay = (si: number, d: number) =>
    setSlots((s) => s.map((sl, i) => i !== si ? sl : {
      ...sl, days: sl.days.includes(d) ? sl.days.filter((x) => x !== d) : [...sl.days, d],
    }))

  const updateSlotTime = (si: number, ti: number, changes: Partial<TimeRange>) =>
    setSlots((s) => s.map((sl, i) => i !== si ? sl : {
      ...sl, times: sl.times.map((t, j) => j !== ti ? t : { ...t, ...changes }),
    }))

  const addSlotTime = (si: number) =>
    setSlots((s) => s.map((sl, i) => i !== si ? sl : { ...sl, times: [...sl.times, { ...EMPTY_TIME }] }))

  const removeSlotTime = (si: number, ti: number) =>
    setSlots((s) => s.map((sl, i) => i !== si ? sl : { ...sl, times: sl.times.filter((_, j) => j !== ti) }))

  const addSlot = () => setSlots((s) => [...s, { days: [], times: [{ ...EMPTY_TIME }] }])
  const removeSlot = (si: number) => setSlots((s) => s.filter((_, i) => i !== si))

  const canGenerate = !!(
    title.trim() && category &&
    slots.every((s) => s.days.length > 0 && s.times.length > 0) &&
    (!isRecurring || endDate)
  )

  const generate = () => {
    if (!canGenerate) return
    const today = getTodayString()
    const resolvedStart = isRecurring ? startDate : today
    const resolvedEnd = isRecurring ? endDate : format(addDays(parse(today, 'yyyy-MM-dd', new Date()), 6), 'yyyy-MM-dd')
    const template: ScheduleTemplate = {
      id: Date.now().toString(),
      title: title.trim(), category, priority, isRecurring,
      startDate: resolvedStart, endDate: resolvedEnd, slots,
      blocksCreated: 0,
    }
    const count = bulkCreateBlocks(template)
    template.blocksCreated = count
    saveScheduleTemplates([...loadScheduleTemplates(), template])
    setDone(count)
  }

  const allCats = [
    ...BUILTIN_CATEGORY_ORDER.map((id) => ({ id, meta: getCategoryMeta(id) })),
    ...userCats.map((c) => ({ id: c.id, meta: getCategoryMeta(c.id, userCats) })),
  ]
  const priorityColors: Record<BlockPriority, string> = { must: '#EF4444', should: '#F59E0B', nice: '#94A3B8' }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2C2C2E] text-gray-500 dark:text-gray-400 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50 leading-tight">Create Schedule</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">Different days, different times</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-5">
        {/* Title */}
        <div>
          <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. MATH101 Lecture"
            className="w-full border border-gray-200 dark:border-[#38383A] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-[#2C2C2E]" />
        </div>

        {/* Category */}
        <div>
          <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">Category</label>
          <div className="flex flex-wrap gap-2">
            {allCats.map(({ id, meta }) => {
              const active = category === id
              const Ic = meta.iconName ? (PREF_ICON_MAP[meta.iconName] ?? null) : null
              return (
                <button key={id} onClick={() => setCategory(id)}
                  className={['flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    active ? 'text-white border-transparent' : 'bg-white dark:bg-[#2C2C2E] border-gray-200 dark:border-[#38383A] text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-[#48484A]'].join(' ')}
                  style={active ? { backgroundColor: meta.color } : {}}>
                  {meta.emoji ? <span className="text-sm leading-none">{meta.emoji}</span>
                    : Ic ? <Ic size={12} style={{ color: active ? '#fff' : meta.color }} /> : null}
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Slots */}
        <div>
          <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Day &amp; Time Slots</label>
          <div className="space-y-3">
            {slots.map((slot, si) => (
              <div key={si} className="bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#38383A] rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Slot {si + 1}</span>
                  {slots.length > 1 && (
                    <button onClick={() => removeSlot(si)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {/* Days */}
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((label, d) => (
                    <button key={d} onClick={() => toggleSlotDay(si, d)}
                      className={['w-8 h-8 rounded-full text-xs font-semibold transition-all',
                        slot.days.includes(d) ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-[#3A3A3C] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#48484A]'].join(' ')}>
                      {label}
                    </button>
                  ))}
                </div>
                {/* Times */}
                <div className="space-y-2">
                  {slot.times.map((time, ti) => (
                    <div key={ti} className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                      <span className="shrink-0 w-8">Start</span>
                      <TimeSelects hour={time.startHour} minute={time.startMinute}
                        onHour={(v) => updateSlotTime(si, ti, { startHour: v })}
                        onMinute={(v) => updateSlotTime(si, ti, { startMinute: v })} />
                      <span className="text-gray-300 dark:text-gray-600">→</span>
                      <span className="shrink-0 w-6">End</span>
                      <TimeSelects hour={time.endHour} minute={time.endMinute}
                        onHour={(v) => updateSlotTime(si, ti, { endHour: v })}
                        onMinute={(v) => updateSlotTime(si, ti, { endMinute: v })} />
                      {slot.times.length > 1 && (
                        <button onClick={() => removeSlotTime(si, ti)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 ml-auto transition-colors">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addSlotTime(si)}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-600 font-medium transition-colors pt-0.5">
                    <Plus size={11} /> Add time
                  </button>
                </div>
              </div>
            ))}
            <button onClick={addSlot}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#38383A] hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-blue-600 transition-all">
              <Plus size={13} /> Add another day group
            </button>
          </div>
        </div>

        {/* Recurring toggle */}
        <div className="bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#38383A] rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Repeat weekly</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {isRecurring ? 'Set a date range below' : 'Creates blocks for this week only'}
            </p>
          </div>
          <PrefToggle enabled={isRecurring} onChange={setIsRecurring} />
        </div>

        {/* Date range — only when recurring */}
        {isRecurring && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">From</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-200 dark:border-[#38383A] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-[#2C2C2E]" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">Until</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-200 dark:border-[#38383A] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-[#2C2C2E]" />
            </div>
          </div>
        )}

        {/* Priority */}
        <div>
          <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">Priority</label>
          <div className="flex gap-2">
            {(['must', 'should', 'nice'] as BlockPriority[]).map((p) => (
              <button key={p} onClick={() => setPriority(p)}
                className={['flex-1 py-2 rounded-xl text-xs font-semibold capitalize border transition-all',
                  priority === p ? 'text-white border-transparent' : 'bg-white dark:bg-[#2C2C2E] border-gray-200 dark:border-[#38383A] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#48484A]'].join(' ')}
                style={priority === p ? { backgroundColor: priorityColors[p] } : {}}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Generate */}
        {done !== null ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-1">
            <p className="text-green-700 font-semibold text-sm">✓ Created {done} block{done !== 1 ? 's' : ''}</p>
            <p className="text-green-500 text-xs">Saved to My Schedules — visible on your Calendar</p>
            <button onClick={() => { setDone(null); onSaved() }}
              className="mt-2 text-xs text-green-600 hover:text-green-800 font-medium underline">
              Back to Preferences
            </button>
          </div>
        ) : (
          <button onClick={generate} disabled={!canGenerate}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Generate Schedule
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Preferences View ────────────────────────────────────────────────────────

const DEFAULT_GOALS: OnboardingGoals = {
  studyHoursPerWeek: 10,
  workoutsPerWeek: 3,
  mealsPerDay: 3,
  sleepHours: 8,
  workHoursPerWeek: 40,
  enabledGoals: { study: true, workouts: true, meals: true, sleep: true, work: false },
}

const CAT_COLORS = [
  '#93C5FD', '#A5B4FC', '#C4B5FD', '#F9A8D4',
  '#FCA5A5', '#FDB97D', '#FDE68A', '#86EFAC',
  '#6EE7B7', '#67E8F9', '#CBD5E1',
]

const CAT_EMOJIS: string[] = []

function PrefToggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
        enabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-[#3A3A3C]',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200',
          enabled ? 'translate-x-6' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  )
}

function CatColorPicker({ current, onChange }: { current: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CAT_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={[
            'w-7 h-7 rounded-full border-2 transition-all',
            current === c ? 'border-gray-800 scale-110 shadow-sm' : 'border-transparent hover:scale-105',
          ].join(' ')}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}

function CatEmojiPicker({ current, onChange }: { current: string | undefined; onChange: (e: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CAT_EMOJIS.map((em) => (
        <button
          key={em}
          onClick={() => onChange(em)}
          className={[
            'w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all',
            current === em ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-[#2C2C2E]',
          ].join(' ')}
        >
          {em}
        </button>
      ))}
    </div>
  )
}

function PreferencesView({ catSectionRef, mealsEnabled, onMealsToggle }: { catSectionRef: React.RefObject<HTMLDivElement | null>; mealsEnabled: boolean; onMealsToggle: (v: boolean) => void }) {
  const [subView, setSubView] = useState<'main' | 'create-schedule'>('main')

  if (subView === 'create-schedule') {
    return <ScheduleCreatorView onBack={() => setSubView('main')} onSaved={() => setSubView('main')} />
  }

  return <PreferencesMainView catSectionRef={catSectionRef} onCreateSchedule={() => setSubView('create-schedule')} mealsEnabled={mealsEnabled} onMealsToggle={onMealsToggle} />
}

function PreferencesMainView({ catSectionRef, onCreateSchedule, mealsEnabled, onMealsToggle }: { catSectionRef: React.RefObject<HTMLDivElement | null>; onCreateSchedule: () => void; mealsEnabled: boolean; onMealsToggle: (v: boolean) => void }) {
  const [scheduleTemplates, setScheduleTemplates] = useState<ScheduleTemplate[]>(() => loadScheduleTemplates())

  const deleteTemplate = (id: string) => {
    const updated = scheduleTemplates.filter((t) => t.id !== id)
    setScheduleTemplates(updated)
    saveScheduleTemplates(updated)
  }

  const [goals, setGoals] = useState<OnboardingGoals>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('daycal_goals') : null
      return raw ? { ...DEFAULT_GOALS, ...JSON.parse(raw) } : DEFAULT_GOALS
    } catch { return DEFAULT_GOALS }
  })
  const [cats, setCats] = useState<UserCategory[]>(() => loadUserCategories())
  const [overrides, setOverrides] = useState<Record<string, CategoryOverride>>(() => loadCategoryOverrides())
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', emoji: '', color: '#93C5FD' })

  const enabled = goals.enabledGoals ?? DEFAULT_GOALS.enabledGoals!

  const updateGoals = (updated: OnboardingGoals) => {
    setGoals(updated)
    localStorage.setItem('daycal_goals', JSON.stringify(updated))
  }

  const setGoalValue = (key: keyof OnboardingGoals, value: number) =>
    updateGoals({ ...goals, [key]: value })

  const toggleGoalKey = (key: keyof typeof enabled, val: boolean) =>
    updateGoals({ ...goals, enabledGoals: { ...enabled, [key]: val } })

  // Update a built-in category override
  const updateOverride = (id: string, changes: Partial<CategoryOverride>) => {
    const updated = { ...overrides, [id]: { ...overrides[id], ...changes } }
    setOverrides(updated)
    saveCategoryOverrides(updated)
  }

  // Update a custom category
  const updateCustomCat = (id: string, changes: Partial<UserCategory>) => {
    const updated = cats.map((c) => (c.id === id ? { ...c, ...changes } : c))
    setCats(updated)
    saveUserCategories(updated)
  }

  const deleteCat = (id: string) => {
    const updated = cats.filter((c) => c.id !== id)
    setCats(updated)
    saveUserCategories(updated)
    if (expandedCat === id) setExpandedCat(null)
  }

  const addCat = () => {
    if (!newCat.name.trim()) return
    const updated: UserCategory[] = [
      ...cats,
      { id: Date.now().toString(), name: newCat.name.trim(), emoji: newCat.emoji, color: newCat.color },
    ]
    setCats(updated)
    saveUserCategories(updated)
    setNewCat({ name: '', emoji: '', color: '#93C5FD' })
    setShowAddCat(false)
  }

  // catId = which category's color to use for this slider (null = no linked category)
  const goalSliders: { key: keyof OnboardingGoals; enabledKey: keyof typeof enabled; label: string; min: number; max: number; step: number; unit: string; catId: string | null }[] = [
    { key: 'studyHoursPerWeek', enabledKey: 'study', label: 'Study', catId: 'study', min: 0, max: 40, step: 1, unit: 'hrs/week' },
    { key: 'workoutsPerWeek', enabledKey: 'workouts', label: 'Workouts', catId: 'gym', min: 0, max: 14, step: 1, unit: '× /week' },
    { key: 'mealsPerDay', enabledKey: 'meals', label: 'Meals', catId: 'meal', min: 1, max: 6, step: 1, unit: '/day' },
    { key: 'sleepHours', enabledKey: 'sleep', label: 'Sleep', catId: null, min: 4, max: 12, step: 0.5, unit: 'hrs/night' },
    { key: 'workHoursPerWeek', enabledKey: 'work', label: 'Work', catId: 'work', min: 0, max: 60, step: 1, unit: 'hrs/week' },
  ]

  // Disabled goals sink to the bottom; order within each group stays stable
  const sortedGoalSliders = [
    ...goalSliders.filter((s) => enabled[s.enabledKey]),
    ...goalSliders.filter((s) => !enabled[s.enabledKey]),
  ]

  // Which built-in category is gated by which goal toggle
  const goalCatMap: Record<string, string> = { study: 'study', workouts: 'gym', meals: 'meal', work: 'work' }
  const visibleBuiltins = BUILTIN_CATEGORY_ORDER.filter((id) => {
    const entry = Object.entries(goalCatMap).find(([, catId]) => catId === id)
    if (!entry) return true // 'class' has no goal — always visible
    return enabled[entry[0] as keyof typeof enabled]
  })

  return (
    <div className="p-5 space-y-6 overflow-y-auto h-full">
      {/* My Schedules */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">My Schedules</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Recurring events on your calendar</p>
        </div>
        <button onClick={onCreateSchedule}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors">
          <Plus size={13} /> New
        </button>
      </div>
      {scheduleTemplates.length === 0 ? (
        <button onClick={onCreateSchedule}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#38383A] hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-blue-600 transition-all">
          <Calendar size={15} /> Create your first schedule
        </button>
      ) : (
        <div className="space-y-2">
          {scheduleTemplates.map((t) => {
            const meta = getCategoryMeta(t.category, loadUserCategories())
            const Ic = meta.iconName ? (PREF_ICON_MAP[meta.iconName] ?? null) : null
            return (
              <div key={t.id} className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-100 dark:border-[#38383A] overflow-hidden"
                style={{ borderLeft: `4px solid ${meta.color}` }}>
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: meta.bgColor }}>
                        {meta.emoji ? <span className="text-sm leading-none">{meta.emoji}</span>
                          : Ic ? <Ic size={14} style={{ color: meta.color }} /> : null}
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{t.title}</span>
                    </div>
                    <button onClick={() => deleteTemplate(t.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors shrink-0 mt-0.5">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-2 space-y-1 pl-9">
                    {t.slots.map((slot, i) => (
                      <div key={i} className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {slot.days.sort((a,b)=>a-b).map((d) => DAY_SHORT[d]).join(', ')}
                        </span>
                        {(slot.times ?? [{ startHour: (slot as any).startHour, startMinute: (slot as any).startMinute, endHour: (slot as any).endHour, endMinute: (slot as any).endMinute }]).map((time, ti) => (
                          <div key={ti} className="pl-2 text-gray-400 dark:text-gray-500">
                            {String(time.startHour).padStart(2,'0')}:{String(time.startMinute).padStart(2,'0')} – {String(time.endHour).padStart(2,'0')}:{String(time.endMinute).padStart(2,'0')}
                          </div>
                        ))}
                      </div>
                    ))}
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 pt-0.5">
                      {format(parse(t.startDate,'yyyy-MM-dd',new Date()),'MMM d')} → {format(parse(t.endDate,'yyyy-MM-dd',new Date()),'MMM d, yyyy')} · {t.blocksCreated} blocks
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Features */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">Features</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Turn features on or off</p>
      </div>
      <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-100 dark:border-[#38383A] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5" style={{ borderLeft: `4px solid ${mealsEnabled ? getCategoryMeta('meal').color : '#E5E7EB'}` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: getCategoryMeta('meal').bgColor }}>
              {getCategoryMeta('meal').emoji
                ? <span className="text-base">{getCategoryMeta('meal').emoji}</span>
                : <Utensils size={16} style={{ color: getCategoryMeta('meal').color }} />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Meal Logging</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Track meals with photos & time</p>
            </div>
          </div>
          <PrefToggle enabled={mealsEnabled} onChange={onMealsToggle} />
        </div>
      </div>

      {/* Goals */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">Goals</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Adjust your weekly targets</p>
      </div>
      <div className="space-y-3">
        {sortedGoalSliders.map(({ key, enabledKey, label, catId, min, max, step, unit }) => {
          const on = enabled[enabledKey]
          const val = goals[key] as number
          const catColor = catId ? getCategoryMeta(catId).color : '#A5B4FC'
          return (
            <div
              key={key}
              className={[
                'rounded-xl border border-gray-100 dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] overflow-hidden transition-all duration-300',
                !on && 'opacity-50',
              ].filter(Boolean).join(' ')}
              style={{ borderLeft: `4px solid ${on ? catColor : '#E5E7EB'}` }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</span>
                  <div className="flex items-center gap-3">
                    {on && (
                      <span className="text-sm font-bold" style={{ color: catColor }}>
                        {val} {unit}
                      </span>
                    )}
                    <PrefToggle enabled={on} onChange={(v) => toggleGoalKey(enabledKey, v)} />
                  </div>
                </div>
                {on && (
                  <input
                    type="range" min={min} max={max} step={step} value={val}
                    onChange={(e) => setGoalValue(key, Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: catColor }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Categories */}
      <div ref={catSectionRef}>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">Categories</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Customise colours and icons</p>
      </div>
      <div className="space-y-2">
        {/* Built-in categories — only show those whose goal is enabled */}
        {visibleBuiltins.map((id) => {
          const meta = getCategoryMeta(id)
          const override = overrides[id] ?? {}
          const isExpanded = expandedCat === id
          const DefaultIcon = PREF_ICON_MAP[CATEGORY_META[id].iconName!] ?? null

          return (
            <div key={id} className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-100 dark:border-[#38383A] overflow-hidden">
              <button
                onClick={() => setExpandedCat(isExpanded ? null : id)}
                className="w-full flex items-center gap-3 px-4 py-3"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: meta.bgColor }}
                >
                  {meta.emoji ? (
                    <span className="text-base leading-none">{meta.emoji}</span>
                  ) : DefaultIcon ? (
                    <DefaultIcon size={16} style={{ color: meta.color }} />
                  ) : null}
                </div>
                <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100 text-left">{meta.label}</span>
                <span className="w-4 h-4 rounded-full border border-white shadow-sm shrink-0" style={{ backgroundColor: meta.color }} />
                {isExpanded ? <ChevronUp size={15} className="text-gray-400 dark:text-gray-500 shrink-0" /> : <ChevronDown size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-[#38383A] space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Color</p>
                    <CatColorPicker current={meta.color} onChange={(c) => updateOverride(id, { color: c })} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Icon / Emoji</p>
                      {override.emoji && (
                        <button
                          onClick={() => updateOverride(id, { emoji: undefined })}
                          className="text-[10px] text-blue-500 hover:text-blue-700 font-medium"
                        >
                          Reset to default icon
                        </button>
                      )}
                    </div>
                    <CatEmojiPicker current={override.emoji} onChange={(e) => updateOverride(id, { emoji: e })} />
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Custom categories */}
        {cats.map((cat) => {
          const isExpanded = expandedCat === cat.id
          return (
            <div key={cat.id} className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-100 dark:border-[#38383A] overflow-hidden">
              <button
                onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                className="w-full flex items-center gap-3 px-4 py-3"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: cat.color + '30' }}
                >
                  {cat.emoji}
                </div>
                <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100 text-left">{cat.name}</span>
                <span className="w-4 h-4 rounded-full border border-white shadow-sm shrink-0" style={{ backgroundColor: cat.color }} />
                {isExpanded ? <ChevronUp size={15} className="text-gray-400 dark:text-gray-500 shrink-0" /> : <ChevronDown size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-[#38383A] space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Color</p>
                    <CatColorPicker current={cat.color} onChange={(c) => updateCustomCat(cat.id, { color: c })} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Emoji</p>
                    <CatEmojiPicker current={cat.emoji} onChange={(e) => updateCustomCat(cat.id, { emoji: e })} />
                  </div>
                  <button
                    onClick={() => deleteCat(cat.id)}
                    className="flex items-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete category
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* Add new custom category */}
        {showAddCat ? (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-blue-200 dark:border-blue-700 p-4 space-y-3">
            <input
              type="text"
              value={newCat.name}
              onChange={(e) => setNewCat((c) => ({ ...c, name: e.target.value }))}
              placeholder="Category name"
              className="w-full border border-gray-200 dark:border-[#38383A] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-50 bg-white dark:bg-[#2C2C2E] placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') addCat() }}
            />
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Emoji</p>
              <CatEmojiPicker current={newCat.emoji} onChange={(e) => setNewCat((c) => ({ ...c, emoji: e }))} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Color</p>
              <CatColorPicker current={newCat.color} onChange={(c) => setNewCat((nc) => ({ ...nc, color: c }))} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addCat}
                disabled={!newCat.name.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-40 rounded-xl py-2.5 transition-colors"
              >
                <Check size={14} />
                Save
              </button>
              <button
                onClick={() => { setShowAddCat(false); setNewCat({ name: '', emoji: '', color: '#93C5FD' }) }}
                className="px-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-[#2C2C2E] hover:bg-gray-200 dark:hover:bg-[#3A3A3C] rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddCat(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#38383A] hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-blue-600 transition-all"
          >
            <Plus size={16} />
            Add new category
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Points View ──────────────────────────────────────────────────────────────

function PointsView({
  weekProgress,
  streak,
}: {
  weekProgress: import('@/hooks/useGoals').WeekProgress
  streak: import('@/hooks/useStreak').StreakData
}) {
  const { weeklyPoints, todayScore } = weekProgress

  const tiers = [
    { min: 0, max: 199, label: 'Getting Started', color: '#94A3B8' },
    { min: 200, max: 499, label: 'Building Momentum', color: '#60A5FA' },
    { min: 500, max: 999, label: 'On a Roll', color: '#F59E0B' },
    { min: 1000, max: 1999, label: 'Locked In', color: '#8B5CF6' },
    { min: 2000, max: Infinity, label: 'Elite', color: '#F43F5E' },
  ]
  const currentTier = tiers.find((t) => weeklyPoints >= t.min && weeklyPoints <= t.max) ?? tiers[0]
  const nextTier = tiers[tiers.indexOf(currentTier) + 1]
  const tierPct = nextTier ? Math.min((weeklyPoints - currentTier.min) / (nextTier.min - currentTier.min), 1) : 1

  const streakMultiplier = streak.current >= 30 ? 2.0
    : streak.current >= 14 ? 1.5
    : streak.current >= 7 ? 1.25
    : streak.current >= 3 ? 1.1
    : 1.0

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">Points</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">How you earn and level up</p>
      </div>

      {/* Current standing */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-5 text-center">
        <div className="flex justify-center mb-2">
          <Trophy size={40} style={{ color: currentTier.color }} />
        </div>
        <p className="text-2xl font-black text-gray-900 dark:text-gray-50">{weeklyPoints}</p>
        <p className="text-sm font-semibold mt-0.5" style={{ color: currentTier.color }}>{currentTier.label}</p>
        {nextTier && (
          <>
            <div className="mt-3 h-2 bg-gray-100 dark:bg-[#2C2C2E] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${tierPct * 100}%`, backgroundColor: currentTier.color }} />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">{nextTier.min - weeklyPoints} pts to {nextTier.label}</p>
          </>
        )}
      </div>

      {/* Streak multiplier */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4 flex items-center gap-4">
        <Flame size={28} className="text-orange-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{streak.current}-day streak</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {streakMultiplier > 1 ? `${streakMultiplier}× multiplier active on all points` : 'Keep going to unlock a multiplier'}
          </p>
        </div>
        {streakMultiplier > 1 && (
          <span className="text-sm font-black text-orange-500">{streakMultiplier}×</span>
        )}
      </div>

      {/* How points work */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">How you earn</p>

        {[
          { dotColor: '#EF4444', label: 'Must-do block completed', pts: '+50 pts' },
          { dotColor: '#EAB308', label: 'Should-do block completed', pts: '+30 pts' },
          { dotColor: '#9CA3AF', label: 'Nice-to-do block completed', pts: '+15 pts' },
        ].map(({ dotColor, label, pts }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
              <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
            </div>
            <span className="text-sm font-bold text-green-600">{pts}</span>
          </div>
        ))}
      </div>

      {/* Streak milestones */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Streak multipliers</p>
        {[
          { days: 3, mult: '1.1×', label: '3-day streak' },
          { days: 7, mult: '1.25×', label: '7-day streak' },
          { days: 14, mult: '1.5×', label: '14-day streak' },
          { days: 30, mult: '2×', label: '30-day streak' },
        ].map(({ days, mult, label }) => {
          const active = streak.current >= days
          return (
            <div key={days} className={['flex items-center justify-between', !active && 'opacity-40'].join(' ')}>
              <div className="flex items-center gap-2.5">
                {active
                  ? <CheckCircle size={16} className="text-green-500 shrink-0" />
                  : <Lock size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
                }
                <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
              </div>
              <span className={['text-sm font-bold', active ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'].join(' ')}>{mult}</span>
            </div>
          )
        })}
      </div>

      {/* Score info */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Daily score (0–100)</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          Your daily score reflects how well you completed your blocks, weighted by priority. Must-dos count the most (50%), should-dos next (30%), and nice-to-dos last (20%). Excused blocks don&apos;t hurt your score.
        </p>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[['#22C55E', '80+', 'Great'], ['#EAB308', '50–79', 'OK'], ['#EF4444', '<50', 'Rough']].map(([color, range, label]) => (
            <div key={label} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: color + '18' }}>
              <p className="text-xs font-bold" style={{ color }}>{range}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Profile View ─────────────────────────────────────────────────────────────

const DEFAULT_PRIVACY = { class: true, study: true, gym: true, meal: true, work: false, mealPhotos: true }

function ProfileView() {
  const router = useRouter()

  const [displayName, setDisplayName] = useState(() => localStorage.getItem('daycal_profile_name') ?? '')
  const [username, setUsername] = useState(() => localStorage.getItem('daycal_profile_username') ?? '')
  const [bio, setBio] = useState(() => localStorage.getItem('daycal_profile_bio') ?? '')
  const [saved, setSaved] = useState(false)
  const [privacy, setPrivacy] = useState<typeof DEFAULT_PRIVACY>(() => {
    try { return JSON.parse(localStorage.getItem('daycal_privacy') ?? 'null') ?? DEFAULT_PRIVACY }
    catch { return DEFAULT_PRIVACY }
  })

  const saveProfile = () => {
    localStorage.setItem('daycal_profile_name', displayName)
    localStorage.setItem('daycal_profile_username', username)
    localStorage.setItem('daycal_profile_bio', bio)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const togglePrivacy = (key: keyof typeof DEFAULT_PRIVACY) => {
    const next = { ...privacy, [key]: !privacy[key] }
    setPrivacy(next)
    localStorage.setItem('daycal_privacy', JSON.stringify(next))
  }

  const handleReset = () => {
    if (confirm('Reset onboarding? This will clear your goals and redirect to the setup screen.')) {
      localStorage.removeItem('daycal_onboarded')
      localStorage.removeItem('daycal_goals')
      router.push('/onboarding')
    }
  }

  const initials = (displayName || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const privacyItems: { key: keyof typeof DEFAULT_PRIVACY; label: string; desc: string }[] = [
    { key: 'class', label: 'Classes', desc: 'Show class blocks to friends' },
    { key: 'study', label: 'Study sessions', desc: 'Show study blocks to friends' },
    { key: 'gym', label: 'Gym & exercise', desc: 'Show gym blocks to friends' },
    { key: 'meal', label: 'Meals', desc: 'Show meal blocks to friends' },
    { key: 'work', label: 'Work', desc: 'Show work blocks to friends' },
    { key: 'mealPhotos', label: 'Meal photos', desc: 'Share meal photos in social feed' },
  ]

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full pb-10">

      {/* Avatar + identity */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-xl font-bold text-blue-600 dark:text-blue-400">
              {initials}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-800 dark:bg-gray-200 rounded-full flex items-center justify-center">
              <Camera size={11} className="text-white dark:text-gray-800" />
            </button>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-50">{displayName || 'Your Name'}</p>
            <p className="text-xs text-gray-400">@{username || 'username'}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Display Name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#38383A] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Username</label>
            <div className="flex items-center bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#38383A] rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 transition-all">
              <span className="text-gray-400 text-sm mr-1">@</span>
              <input
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                placeholder="username"
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="A short bio (optional)"
              rows={2}
              className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#38383A] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none"
            />
          </div>
          <button
            onClick={saveProfile}
            className={['w-full text-sm font-semibold rounded-xl py-2.5 transition-all', saved ? 'bg-green-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'].join(' ')}
          >
            {saved ? 'Saved!' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Privacy controls */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <Shield size={15} className="text-gray-400" />
          <p className="text-sm font-bold text-gray-900 dark:text-gray-50">Privacy</p>
        </div>
        <p className="px-4 pb-3 text-xs text-gray-400 dark:text-gray-500">Choose which block types friends can see on your schedule</p>
        <div className="divide-y divide-gray-100 dark:divide-[#38383A]">
          {privacyItems.map(({ key, label, desc }) => (
            <div key={key} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
              </div>
              <button
                onClick={() => togglePrivacy(key)}
                className={['w-11 h-6 rounded-full transition-colors relative shrink-0', privacy[key] ? 'bg-blue-500' : 'bg-gray-200 dark:bg-[#3A3A3C]'].join(' ')}
              >
                <span className={['absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', privacy[key] ? 'translate-x-5' : 'translate-x-0.5'].join(' ')} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* App info */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] divide-y divide-gray-100 dark:divide-[#38383A]">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">App version</span>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-[#2C2C2E] rounded-full px-2.5 py-1 font-mono">1.0.0-mvp</span>
        </div>
        <div className="px-4 py-3.5 flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">Storage</span>
          <span className="text-xs text-gray-400">Local device only</span>
        </div>
      </div>

      <button
        onClick={handleReset}
        className="w-full text-sm text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl py-3 font-medium transition-colors"
      >
        Redo Onboarding
      </button>
    </div>
  )
}
