import { format, parse, addMinutes } from 'date-fns'

/**
 * Parse "HH:MM" string into total minutes from midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert total minutes from midnight to "HH:MM"
 */
export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(totalMinutes, 24 * 60 - 1))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Format "HH:MM" to "h:mm AM/PM"
 */
export function formatTime(time: string): string {
  try {
    const parsed = parse(time, 'HH:mm', new Date())
    return format(parsed, 'h:mm a')
  } catch {
    return time
  }
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * Add minutes to a "HH:MM" time string
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const base = parse(time, 'HH:mm', new Date())
  const result = addMinutes(base, minutes)
  return format(result, 'HH:mm')
}

/**
 * Get current time as "HH:MM"
 */
export function getCurrentTime(): string {
  return format(new Date(), 'HH:mm')
}

/**
 * Get today as "YYYY-MM-DD"
 */
export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/**
 * Format a date string "YYYY-MM-DD" to display format
 */
export function formatDate(dateStr: string): string {
  try {
    const d = parse(dateStr, 'yyyy-MM-dd', new Date())
    return format(d, 'EEEE, MMMM d')
  } catch {
    return dateStr
  }
}

/**
 * Check if a time string is currently in-progress
 */
export function isCurrentlyActive(startTime: string, endTime: string): boolean {
  const now = timeToMinutes(getCurrentTime())
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  return now >= start && now < end
}

/**
 * Check if block has passed
 */
export function hasPassed(endTime: string): boolean {
  const now = timeToMinutes(getCurrentTime())
  const end = timeToMinutes(endTime)
  return now > end
}

/**
 * Get pixel position for a time on the timeline
 */
export function getTimelinePosition(time: string, startHour: number, pixelsPerMinute: number): number {
  const totalMinutes = timeToMinutes(time) - startHour * 60
  return Math.max(0, totalMinutes * pixelsPerMinute)
}

/**
 * Get block height in pixels
 */
export function getBlockHeight(startTime: string, endTime: string, pixelsPerMinute: number): number {
  const duration = timeToMinutes(endTime) - timeToMinutes(startTime)
  return Math.max(duration * pixelsPerMinute, 40)
}
