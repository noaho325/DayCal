export type BlockCategory = string  // built-in IDs or custom UUID
export type BuiltinCategory = 'class' | 'study' | 'meal' | 'gym' | 'work'
export type BlockPriority = 'must' | 'should' | 'nice'
export type BlockStatus = 'upcoming' | 'in-progress' | 'completed' | 'skipped' | 'excused'
export type SkipReason = 'sick' | 'lazy' | 'emergency' | 'rescheduled' | 'other'
export type RecurringPattern = 'daily' | 'weekdays' | 'weekly' | null

export interface TimeBlock {
  id: string
  title: string
  category: BlockCategory
  startTime: string   // "HH:MM" format
  endTime: string     // "HH:MM" format
  estimatedDuration: number  // minutes
  actualDuration?: number
  priority: BlockPriority
  isLocked: boolean
  isFlexible: boolean
  status: BlockStatus
  skipReason?: SkipReason
  skipReasonText?: string
  isExcused: boolean
  mealName?: string
  mealPhotoURL?: string
  isRecurring: boolean
  recurringPattern?: RecurringPattern
  color?: string
  notes?: string
  location?: string
}

export interface DaySchedule {
  date: string  // YYYY-MM-DD
  blocks: TimeBlock[]
  dailyScore?: number
  hydration: number
}

export interface UndoAction {
  type: 'add' | 'remove' | 'update' | 'reorder'
  previousBlocks: TimeBlock[]
}

export interface OnboardingGoals {
  studyHoursPerWeek: number
  workoutsPerWeek: number
  mealsPerDay: number
  sleepHours: number
  workHoursPerWeek: number
  enabledGoals?: {
    study: boolean
    workouts: boolean
    meals: boolean
    sleep: boolean
    work: boolean
  }
  templateChoice?: 'university' | 'work' | 'chill' | null
}

export interface CategoryMeta {
  label: string
  iconName?: string  // Lucide icon name for built-in categories
  emoji?: string     // emoji for custom categories
  color: string
  bgColor: string
}

export interface PriorityMeta {
  label: string
  description: string
  color: string
  weight: number
}

export interface SavedTask {
  id: string
  title: string
  category: BlockCategory
  estimatedDuration: number
  priority: BlockPriority
  color?: string
  notes?: string
  location?: string
  mealName?: string
  isLocked?: boolean
}

export interface UserCategory {
  id: string
  name: string
  emoji: string
  color: string
}

// ─── Social / Phase 3 Types ───────────────────────────────────────────────────

export interface UserProfile {
  username: string
  displayName: string
  bio: string
  photoURL?: string
  privacySettings: {
    class: boolean
    study: boolean
    gym: boolean
    meal: boolean
    work: boolean
    mealPhotos: boolean
  }
}

export type FriendStatus = 'accepted' | 'pending_sent' | 'pending_received'

export interface Friend {
  id: string
  username: string
  displayName: string
  photoURL?: string
  streak: number
  weeklyPoints: number
  status: FriendStatus
}

export type FeedItemType = 'completed' | 'streak' | 'goal' | 'meal_photo'

export interface FeedItem {
  id: string
  userId: string
  username: string
  displayName: string
  photoURL?: string
  type: FeedItemType
  content: string
  timestamp: Date
  mealPhotoURL?: string
  mealName?: string
  liked?: boolean
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  displayName: string
  photoURL?: string
  weeklyPoints: number
  streak: number
  isCurrentUser?: boolean
}
