'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronDown, ChevronUp, Utensils, Coffee, Sun, Moon } from 'lucide-react'
import { format, subDays } from 'date-fns'
import type { TimeBlock, UserCategory } from '@/types'
import {
  getCategoryMeta,
  loadUserCategories,
  loadCategoryOverrides,
  saveCategoryOverrides,
} from '@/utils/constants'
import type { CategoryOverride } from '@/utils/constants'
import { LogMealModal } from './LogMealModal'

interface Props {
  onLogMeal: (block: Omit<TimeBlock, 'id'>, dateStr: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadMealsForDate(dateStr: string): TimeBlock[] {
  try {
    const raw = localStorage.getItem(`daycal_schedule_${dateStr}`)
    if (!raw) return []
    const blocks: TimeBlock[] = JSON.parse(raw)
    return blocks.filter((b) => b.category === 'meal')
  } catch { return [] }
}

// Bucket a meal into breakfast / lunch / dinner based on startTime
function getMealSlot(startTime: string): 0 | 1 | 2 {
  const h = parseInt(startTime.split(':')[0], 10)
  if (h < 11) return 0   // breakfast
  if (h < 16) return 1   // lunch
  return 2               // dinner
}

const SLOT_LABELS = ['Breakfast', 'Lunch', 'Dinner']
const SLOT_DEFAULT_HOURS = [8, 12, 18]
const SLOT_ICONS = [
  <Coffee key="breakfast" size={24} className="text-gray-300" />,
  <Sun key="lunch" size={24} className="text-gray-300" />,
  <Moon key="dinner" size={24} className="text-gray-300" />,
]

const CAT_COLORS = [
  '#93C5FD', '#A5B4FC', '#C4B5FD', '#F9A8D4',
  '#FCA5A5', '#FDB97D', '#FDE68A', '#86EFAC',
  '#6EE7B7', '#67E8F9', '#CBD5E1',
]
const CAT_EMOJIS: string[] = []

// ─── Main Component ───────────────────────────────────────────────────────────

export function MealsView({ onLogMeal }: Props) {
  const [history, setHistory] = useState<{ dateStr: string; meals: TimeBlock[] }[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalHour, setModalHour] = useState<number | undefined>()
  const [modalDate, setModalDate] = useState<string | undefined>()
  const [catExpanded, setCatExpanded] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, CategoryOverride>>(() => loadCategoryOverrides())
  const [userCats] = useState<UserCategory[]>(() => loadUserCategories())

  const loadHistory = useCallback(() => {
    const result: { dateStr: string; meals: TimeBlock[] }[] = []
    for (let i = 0; i < 30; i++) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd')
      const meals = loadMealsForDate(dateStr)
      // Always show today even if empty
      if (meals.length > 0 || i === 0) {
        result.push({ dateStr, meals })
      }
    }
    setHistory(result)
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const handleSave = (block: Omit<TimeBlock, 'id'>, dateStr: string) => {
    onLogMeal(block, dateStr)
    // Small delay to let localStorage settle before re-reading
    setTimeout(loadHistory, 100)
  }

  const openModal = (hour?: number, dateStr?: string) => {
    setModalHour(hour)
    setModalDate(dateStr)
    setModalOpen(true)
  }

  const meta = getCategoryMeta('meal', userCats)
  const override = overrides['meal'] ?? {}

  const updateOverride = (changes: Partial<CategoryOverride>) => {
    const updated = { ...overrides, meal: { ...override, ...changes } }
    setOverrides(updated)
    saveCategoryOverrides(updated)
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: meta.bgColor }}>
              {meta.emoji
                ? <span className="text-lg">{meta.emoji}</span>
                : <Utensils size={18} style={{ color: meta.color }} />
              }
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 leading-tight">Meals</h1>
              <p className="text-xs text-gray-400">Track what you eat</p>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: meta.color }}
          >
            <Plus size={15} />
            Log meal
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Meal history */}
        {history.map(({ dateStr, meals }) => {
          const isToday = dateStr === today
          const isYesterday = dateStr === yesterday
          const dateLabel = isToday ? 'Today' : isYesterday ? 'Yesterday' : format(new Date(dateStr + 'T12:00:00'), 'EEE, MMM d')

          // Map meals to their slot (0/1/2), first meal per slot wins
          const slotMap: Record<number, TimeBlock> = {}
          for (const meal of meals) {
            const slot = getMealSlot(meal.startTime)
            if (!slotMap[slot]) slotMap[slot] = meal
          }

          return (
            <div key={dateStr}>
              <p className={['text-xs font-bold mb-2.5', isToday ? 'text-blue-500' : 'text-gray-400'].join(' ')}>
                {dateLabel}
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {[0, 1, 2].map((slot) => {
                  const meal = slotMap[slot]
                  if (meal) {
                    return (
                      <MealCard key={slot} meal={meal} label={SLOT_LABELS[slot]} slotIcon={SLOT_ICONS[slot]} catColor={meta.color} />
                    )
                  }
                  // Empty slot — only show "+" for today
                  return (
                    <EmptySlot
                      key={slot}
                      label={SLOT_LABELS[slot]}
                      slotIcon={SLOT_ICONS[slot]}
                      showAdd={isToday}
                      onAdd={() => openModal(SLOT_DEFAULT_HOURS[slot], dateStr)}
                    />
                  )
                })}
              </div>
              {/* Extra meals beyond 3 slots */}
              {meals.length > Object.keys(slotMap).length && (
                <p className="text-[10px] text-gray-400 mt-1.5 pl-1">
                  +{meals.length - Object.keys(slotMap).length} more meals this day
                </p>
              )}
            </div>
          )
        })}

        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Utensils size={40} className="text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">No meals logged yet</p>
            <p className="text-xs text-gray-400">Tap "Log meal" to start tracking what you eat</p>
          </div>
        )}

        {/* Category Customisation */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setCatExpanded((e) => !e)}
            className="w-full flex items-center gap-3 px-4 py-3.5"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bgColor }}>
              {meta.emoji
                ? <span className="text-base">{meta.emoji}</span>
                : <Utensils size={15} style={{ color: meta.color }} />
              }
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-800 text-left">Meal category style</span>
            <div className="w-4 h-4 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: meta.color }} />
            {catExpanded
              ? <ChevronUp size={15} className="text-gray-400 shrink-0" />
              : <ChevronDown size={15} className="text-gray-400 shrink-0" />
            }
          </button>

          {catExpanded && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Color</p>
                <div className="flex flex-wrap gap-2">
                  {CAT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateOverride({ color: c })}
                      className={['w-7 h-7 rounded-full border-2 transition-all', meta.color === c ? 'border-gray-800 scale-110 shadow-sm' : 'border-transparent hover:scale-105'].join(' ')}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Emoji</p>
                  {override.emoji && (
                    <button onClick={() => updateOverride({ emoji: undefined })} className="text-[10px] text-blue-500 hover:text-blue-700 font-medium">
                      Reset to default
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {CAT_EMOJIS.map((em) => (
                    <button
                      key={em}
                      onClick={() => updateOverride({ emoji: em })}
                      className={['w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all', meta.emoji === em ? 'ring-2 ring-amber-400 bg-amber-50' : 'hover:bg-gray-100'].join(' ')}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* bottom padding */}
        <div className="h-4" />
      </div>

      <LogMealModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        defaultHour={modalHour}
        defaultDate={modalDate}
      />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MealCard({ meal, label, slotIcon, catColor }: { meal: TimeBlock; label: string; slotIcon: React.ReactNode; catColor: string }) {
  const [expanded, setExpanded] = useState(false)
  const pad = (n: number) => String(n).padStart(2, '0')
  const [h, m] = meal.startTime.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  const timeStr = `${h12}:${pad(m)}${ampm}`

  return (
    <button
      onClick={() => setExpanded((e) => !e)}
      className="relative rounded-2xl overflow-hidden border border-gray-100 flex flex-col text-left transition-all hover:shadow-sm active:scale-[0.97]"
      style={{ borderTop: `3px solid ${catColor}` }}
    >
      {/* Photo or placeholder */}
      {meal.mealPhotoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meal.mealPhotoURL} alt={meal.mealName ?? meal.title} className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square flex items-center justify-center" style={{ backgroundColor: catColor + '18' }}>
          {slotIcon}
        </div>
      )}

      {/* Info */}
      <div className="px-2 py-2 bg-white">
        <p className="text-[10px] font-semibold text-gray-400">{label}</p>
        <p className="text-xs font-bold text-gray-800 leading-tight truncate">{meal.mealName ?? meal.title}</p>
        <p className="text-[10px] text-gray-400">{timeStr}</p>
        {expanded && meal.notes && (
          <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{meal.notes}</p>
        )}
      </div>
    </button>
  )
}

function EmptySlot({ label, slotIcon, showAdd, onAdd }: { label: string; slotIcon: React.ReactNode; showAdd: boolean; onAdd: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 flex flex-col overflow-hidden">
      <div className="w-full aspect-square flex items-center justify-center text-gray-300">
        {slotIcon}
      </div>
      <div className="px-2 py-2">
        <p className="text-[10px] font-semibold text-gray-300">{label}</p>
        {showAdd ? (
          <button
            onClick={onAdd}
            className="flex items-center gap-0.5 text-[10px] font-medium text-blue-400 hover:text-blue-600 mt-0.5 transition-colors"
          >
            <Plus size={10} /> Add
          </button>
        ) : (
          <p className="text-[10px] text-gray-200">—</p>
        )}
      </div>
    </div>
  )
}
