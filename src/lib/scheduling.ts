import type { TimeBlock, BlockCategory } from '@/types'
import { timeToMinutes, minutesToTime } from '@/utils/formatters'

/**
 * Find free time slots in a schedule for a given category
 */
export function getSlotsForCategory(
  blocks: TimeBlock[],
  _category: BlockCategory
): string[] {
  const sorted = [...blocks].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  )
  const slots: string[] = []

  const dayStart = 6 * 60  // 6 AM
  const dayEnd = 22 * 60   // 10 PM

  let cursor = dayStart

  for (const block of sorted) {
    const blockStart = timeToMinutes(block.startTime)
    const blockEnd = timeToMinutes(block.endTime)

    if (blockStart > cursor + 29) {
      // At least 30-minute gap
      const slotDuration = blockStart - cursor
      slots.push(
        `${minutesToTime(cursor)} – ${minutesToTime(blockStart)} (${slotDuration}m free)`
      )
    }

    cursor = Math.max(cursor, blockEnd)
  }

  if (cursor < dayEnd - 29) {
    const slotDuration = dayEnd - cursor
    slots.push(
      `${minutesToTime(cursor)} – ${minutesToTime(dayEnd)} (${slotDuration}m free)`
    )
  }

  return slots
}

/**
 * Get smart suggestions for rescheduling
 */
export function getSmartSuggestions(blocks: TimeBlock[]): string[] {
  const suggestions: string[] = []

  const mustBlocks = blocks.filter((b) => b.priority === 'must' && b.status === 'upcoming')
  const niceBlocks = blocks.filter((b) => b.priority === 'nice' && b.status === 'upcoming')
  const behindBlocks = blocks.filter((b) => {
    const now = timeToMinutes(new Date().toTimeString().slice(0, 5))
    return timeToMinutes(b.startTime) < now && b.status === 'upcoming'
  })

  if (behindBlocks.length > 0) {
    const behind = behindBlocks[0]
    suggestions.push(
      `You're running behind on "${behind.title}" — consider skipping or delaying it.`
    )
  }

  for (const niceBlock of niceBlocks) {
    for (const mustBlock of mustBlocks) {
      const niceEnd = timeToMinutes(niceBlock.endTime)
      const mustStart = timeToMinutes(mustBlock.startTime)
      if (niceEnd > mustStart - 15 && niceEnd < mustStart + 60) {
        suggestions.push(
          `Consider cutting "${niceBlock.title}" to protect "${mustBlock.title}".`
        )
      }
    }
  }

  const overlaps = findOverlaps(blocks)
  for (const overlap of overlaps) {
    suggestions.push(
      `"${overlap[0].title}" and "${overlap[1].title}" overlap — you may need to reschedule.`
    )
  }

  if (suggestions.length === 0) {
    suggestions.push("Your schedule looks good! Stay focused.")
  }

  return suggestions
}

/**
 * Find overlapping blocks
 */
export function findOverlaps(blocks: TimeBlock[]): [TimeBlock, TimeBlock][] {
  const sorted = [...blocks]
    .filter((b) => b.status === 'upcoming' || b.status === 'in-progress')
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

  const overlaps: [TimeBlock, TimeBlock][] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (timeToMinutes(a.endTime) > timeToMinutes(b.startTime)) {
      overlaps.push([a, b])
    }
  }

  return overlaps
}
