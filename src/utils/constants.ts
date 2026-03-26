import type { BlockCategory, BlockPriority, CategoryMeta, PriorityMeta, UserCategory, OnboardingGoals } from '@/types'

const DEFAULT_GOALS: OnboardingGoals = {
  studyHoursPerWeek: 20,
  workoutsPerWeek: 4,
  mealsPerDay: 3,
  sleepHours: 8,
  workHoursPerWeek: 0,
  enabledGoals: { study: true, workouts: true, meals: true, sleep: false, work: false },
}

export function loadGoals(): OnboardingGoals {
  if (typeof window === 'undefined') return DEFAULT_GOALS
  try {
    const raw = localStorage.getItem('daycal_goals')
    return raw ? { ...DEFAULT_GOALS, ...JSON.parse(raw) } : DEFAULT_GOALS
  } catch { return DEFAULT_GOALS }
}

// ─── Category overrides (user-edited built-in colors/emoji) ──────────────────
export interface CategoryOverride {
  color?: string
  emoji?: string
}

// Module-level cache so getCategoryMeta doesn't re-read localStorage on every call
let _overridesCache: Record<string, CategoryOverride> | null = null

export function loadCategoryOverrides(): Record<string, CategoryOverride> {
  if (_overridesCache !== null) return _overridesCache
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem('daycal_cat_overrides')
    _overridesCache = raw ? (JSON.parse(raw) as Record<string, CategoryOverride>) : {}
    return _overridesCache
  } catch { return {} }
}

export function saveCategoryOverrides(overrides: Record<string, CategoryOverride>) {
  _overridesCache = overrides
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('daycal_cat_overrides', JSON.stringify(overrides))
  } catch { /* ignore */ }
}

// Built-in categories — no more 'custom' entry
export const CATEGORY_META: Record<string, CategoryMeta> = {
  class: {
    label: 'Class',
    iconName: 'GraduationCap',
    color: '#6366F1',
    bgColor: '#EEF2FF',
  },
  study: {
    label: 'Study',
    iconName: 'BookOpen',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  meal: {
    label: 'Meal',
    iconName: 'Utensils',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  gym: {
    label: 'Gym',
    iconName: 'Dumbbell',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  work: {
    label: 'Work',
    iconName: 'Briefcase',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
}

export const BUILTIN_CATEGORY_ORDER = ['class', 'study', 'meal', 'gym', 'work'] as const

/** Returns meta for any category ID — applies user overrides for built-ins */
export function getCategoryMeta(id: string, customCats?: UserCategory[]): CategoryMeta {
  const overrides = loadCategoryOverrides()
  const override = overrides[id]

  if (CATEGORY_META[id]) {
    const base = CATEGORY_META[id]
    const color = override?.color ?? base.color
    const bgColor = override?.color ? override.color + '20' : base.bgColor
    // If emoji override is set, drop iconName so rendering uses emoji instead of Lucide icon
    if (override?.emoji) {
      return { label: base.label, emoji: override.emoji, color, bgColor }
    }
    return { ...base, color, bgColor }
  }

  const custom = customCats?.find((c) => c.id === id)
  if (custom) {
    return {
      label: custom.name,
      emoji: custom.emoji,
      color: custom.color,
      bgColor: custom.color + '20',
    }
  }
  return { label: id, color: '#9CA3AF', bgColor: '#F9FAFB' }
}

/** Load user's custom categories from localStorage */
export function loadUserCategories(): UserCategory[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('daycal_user_cats')
    return raw ? (JSON.parse(raw) as UserCategory[]) : []
  } catch {
    return []
  }
}

/** Save user's custom categories to localStorage */
export function saveUserCategories(cats: UserCategory[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('daycal_user_cats', JSON.stringify(cats))
  } catch { /* ignore */ }
}

export const PRIORITY_META: Record<BlockPriority, PriorityMeta> = {
  must: {
    label: 'Must Do',
    description: 'Critical — skipping has real consequences',
    color: '#EF4444',
    weight: 0.5,
  },
  should: {
    label: 'Should Do',
    description: 'Important — try hard to complete',
    color: '#EAB308',
    weight: 0.3,
  },
  nice: {
    label: 'Nice to Do',
    description: 'Optional — do if time allows',
    color: '#9CA3AF',
    weight: 0.2,
  },
}

export const SKIP_REASON_LABELS: Record<string, string> = {
  sick: 'Sick / Unwell',
  lazy: 'Just Not Feeling It',
  emergency: 'Emergency',
  rescheduled: 'Rescheduled',
  other: 'Other',
}

export const TIMELINE_START_HOUR = 6   // 6 AM
export const TIMELINE_END_HOUR = 24    // Midnight
export const PIXELS_PER_MINUTE = 1.5  // Height scale

export const UNIVERSITY_DAY_TEMPLATE = [
  {
    title: 'Morning Routine',
    category: 'meal' as BlockCategory,
    startTime: '07:00',
    endTime: '07:45',
    estimatedDuration: 45,
    priority: 'must' as BlockPriority,
    isLocked: false,
    isFlexible: false,
    isRecurring: true,
    recurringPattern: 'weekdays' as const,
    isExcused: false,
    status: 'upcoming' as const,
    mealName: 'Breakfast',
  },
  {
    title: 'Morning Lecture',
    category: 'class' as BlockCategory,
    startTime: '09:00',
    endTime: '10:30',
    estimatedDuration: 90,
    priority: 'must' as BlockPriority,
    isLocked: true,
    isFlexible: false,
    isRecurring: true,
    recurringPattern: 'weekdays' as const,
    isExcused: false,
    status: 'upcoming' as const,
  },
  {
    title: 'Study Session',
    category: 'study' as BlockCategory,
    startTime: '11:00',
    endTime: '13:00',
    estimatedDuration: 120,
    priority: 'should' as BlockPriority,
    isLocked: false,
    isFlexible: true,
    isRecurring: false,
    isExcused: false,
    status: 'upcoming' as const,
  },
  {
    title: 'Lunch',
    category: 'meal' as BlockCategory,
    startTime: '13:00',
    endTime: '13:45',
    estimatedDuration: 45,
    priority: 'must' as BlockPriority,
    isLocked: false,
    isFlexible: false,
    isRecurring: true,
    recurringPattern: 'daily' as const,
    isExcused: false,
    status: 'upcoming' as const,
    mealName: 'Lunch',
  },
  {
    title: 'Afternoon Lecture',
    category: 'class' as BlockCategory,
    startTime: '14:00',
    endTime: '15:30',
    estimatedDuration: 90,
    priority: 'must' as BlockPriority,
    isLocked: true,
    isFlexible: false,
    isRecurring: true,
    recurringPattern: 'weekdays' as const,
    isExcused: false,
    status: 'upcoming' as const,
  },
  {
    title: 'Gym',
    category: 'gym' as BlockCategory,
    startTime: '17:00',
    endTime: '18:00',
    estimatedDuration: 60,
    priority: 'should' as BlockPriority,
    isLocked: false,
    isFlexible: true,
    isRecurring: true,
    recurringPattern: 'weekdays' as const,
    isExcused: false,
    status: 'upcoming' as const,
  },
  {
    title: 'Dinner',
    category: 'meal' as BlockCategory,
    startTime: '19:00',
    endTime: '19:45',
    estimatedDuration: 45,
    priority: 'must' as BlockPriority,
    isLocked: false,
    isFlexible: false,
    isRecurring: true,
    recurringPattern: 'daily' as const,
    isExcused: false,
    status: 'upcoming' as const,
    mealName: 'Dinner',
  },
  {
    title: 'Evening Study',
    category: 'study' as BlockCategory,
    startTime: '20:00',
    endTime: '22:00',
    estimatedDuration: 120,
    priority: 'nice' as BlockPriority,
    isLocked: false,
    isFlexible: true,
    isRecurring: false,
    isExcused: false,
    status: 'upcoming' as const,
  },
]

export const WORK_DAY_TEMPLATE = [
  {
    title: 'Morning Routine',
    category: 'meal' as BlockCategory,
    startTime: '07:00',
    endTime: '08:00',
    estimatedDuration: 60,
    priority: 'must' as BlockPriority,
    isLocked: false,
    isFlexible: false,
    isRecurring: true,
    recurringPattern: 'weekdays' as const,
    isExcused: false,
    status: 'upcoming' as const,
    mealName: 'Breakfast',
  },
  {
    title: 'Deep Work Block',
    category: 'work' as BlockCategory,
    startTime: '09:00',
    endTime: '12:00',
    estimatedDuration: 180,
    priority: 'must' as BlockPriority,
    isLocked: false,
    isFlexible: false,
    isRecurring: true,
    recurringPattern: 'weekdays' as const,
    isExcused: false,
    status: 'upcoming' as const,
  },
  {
    title: 'Lunch Break',
    category: 'meal' as BlockCategory,
    startTime: '12:00',
    endTime: '13:00',
    estimatedDuration: 60,
    priority: 'must' as BlockPriority,
    isLocked: false,
    isFlexible: false,
    isRecurring: true,
    recurringPattern: 'daily' as const,
    isExcused: false,
    status: 'upcoming' as const,
    mealName: 'Lunch',
  },
  {
    title: 'Meetings & Emails',
    category: 'work' as BlockCategory,
    startTime: '13:00',
    endTime: '15:00',
    estimatedDuration: 120,
    priority: 'should' as BlockPriority,
    isLocked: false,
    isFlexible: true,
    isRecurring: true,
    recurringPattern: 'weekdays' as const,
    isExcused: false,
    status: 'upcoming' as const,
  },
  {
    title: 'Afternoon Work',
    category: 'work' as BlockCategory,
    startTime: '15:00',
    endTime: '17:00',
    estimatedDuration: 120,
    priority: 'should' as BlockPriority,
    isLocked: false,
    isFlexible: false,
    isRecurring: true,
    recurringPattern: 'weekdays' as const,
    isExcused: false,
    status: 'upcoming' as const,
  },
  {
    title: 'Evening Walk / Gym',
    category: 'gym' as BlockCategory,
    startTime: '18:00',
    endTime: '19:00',
    estimatedDuration: 60,
    priority: 'nice' as BlockPriority,
    isLocked: false,
    isFlexible: true,
    isRecurring: false,
    isExcused: false,
    status: 'upcoming' as const,
  },
  {
    title: 'Dinner',
    category: 'meal' as BlockCategory,
    startTime: '19:00',
    endTime: '19:45',
    estimatedDuration: 45,
    priority: 'must' as BlockPriority,
    isLocked: false,
    isFlexible: false,
    isRecurring: true,
    recurringPattern: 'daily' as const,
    isExcused: false,
    status: 'upcoming' as const,
    mealName: 'Dinner',
  },
]

export const CHILL_DAY_TEMPLATE = [
  {
    title: 'Sleep In & Breakfast',
    category: 'meal' as BlockCategory,
    startTime: '09:00',
    endTime: '10:00',
    estimatedDuration: 60,
    priority: 'nice' as BlockPriority,
    isLocked: false,
    isFlexible: true,
    isRecurring: false,
    isExcused: false,
    status: 'upcoming' as const,
    mealName: 'Breakfast',
  },
  {
    title: 'Light Study / Reading',
    category: 'study' as BlockCategory,
    startTime: '11:00',
    endTime: '12:30',
    estimatedDuration: 90,
    priority: 'nice' as BlockPriority,
    isLocked: false,
    isFlexible: true,
    isRecurring: false,
    isExcused: false,
    status: 'upcoming' as const,
  },
  {
    title: 'Lunch',
    category: 'meal' as BlockCategory,
    startTime: '13:00',
    endTime: '13:45',
    estimatedDuration: 45,
    priority: 'must' as BlockPriority,
    isLocked: false,
    isFlexible: false,
    isRecurring: true,
    recurringPattern: 'daily' as const,
    isExcused: false,
    status: 'upcoming' as const,
    mealName: 'Lunch',
  },
  {
    title: 'Walk / Outdoor Time',
    category: 'gym' as BlockCategory,
    startTime: '15:00',
    endTime: '16:00',
    estimatedDuration: 60,
    priority: 'should' as BlockPriority,
    isLocked: false,
    isFlexible: true,
    isRecurring: false,
    isExcused: false,
    status: 'upcoming' as const,
  },
  {
    title: 'Dinner',
    category: 'meal' as BlockCategory,
    startTime: '19:00',
    endTime: '19:45',
    estimatedDuration: 45,
    priority: 'must' as BlockPriority,
    isLocked: false,
    isFlexible: false,
    isRecurring: true,
    recurringPattern: 'daily' as const,
    isExcused: false,
    status: 'upcoming' as const,
    mealName: 'Dinner',
  },
]
