import type { TimeBlock, BlockPriority } from '@/types'

const PRIORITY_WEIGHTS: Record<BlockPriority, number> = {
  must: 0.5,
  should: 0.3,
  nice: 0.2,
}

/**
 * Calculate point value for completing a single block
 */
export function getBlockPoints(block: TimeBlock): number {
  const basePoints: Record<BlockPriority, number> = {
    must: 50,
    should: 30,
    nice: 15,
  }
  return basePoints[block.priority]
}

/**
 * Calculate daily score from 0–100 based on completed blocks
 */
export function calculateDailyScore(blocks: TimeBlock[]): number {
  if (blocks.length === 0) return 0

  const weightedBlocks = blocks.filter(
    (b) => b.status !== 'upcoming' && b.status !== 'in-progress'
  )

  if (weightedBlocks.length === 0) return 0

  let totalWeight = 0
  let earnedWeight = 0

  for (const block of blocks) {
    const weight = PRIORITY_WEIGHTS[block.priority]
    totalWeight += weight

    const isCompleted = block.status === 'completed'
    const isExcusedSkip = block.status === 'skipped' && block.isExcused
    const isExcused = block.status === 'excused'

    if (isCompleted) {
      earnedWeight += weight
    } else if (isExcusedSkip || isExcused) {
      // Excused blocks don't count against score — exclude from denominator
      totalWeight -= weight
    }
  }

  if (totalWeight <= 0) return 100

  return Math.round((earnedWeight / totalWeight) * 100)
}

/**
 * Get score color based on score value
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#22C55E'
  if (score >= 50) return '#EAB308'
  return '#EF4444'
}

/**
 * Get score label
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Outstanding'
  if (score >= 75) return 'Great Day'
  if (score >= 60) return 'Solid Progress'
  if (score >= 40) return 'Getting There'
  if (score >= 20) return 'Rough Day'
  return 'Keep Going'
}
