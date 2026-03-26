'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  GraduationCap,
  BookOpen,
  Utensils,
  Dumbbell,
  Briefcase,
  Lock,
  Unlock,
  RefreshCw,
  AlignLeft,
  Bookmark,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
} from 'lucide-react'
import type { TimeBlock, BlockCategory, BlockPriority, RecurringPattern, SavedTask, UserCategory } from '@/types'
import { CATEGORY_META, BUILTIN_CATEGORY_ORDER, PRIORITY_META, getCategoryMeta, loadUserCategories } from '@/utils/constants'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'
import { timeToMinutes, addMinutesToTime } from '@/utils/formatters'

const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap,
  BookOpen,
  Utensils,
  Dumbbell,
  Briefcase,
}

// ─── Custom Time Picker ────────────────────────────────────────────────────────

interface TimePickerProps {
  label: string
  value: string
  onChange: (v: string) => void
}

function TimePicker({ label, value, onChange }: TimePickerProps) {
  const parts = value.split(':')
  const h = parseInt(parts[0] ?? '9', 10)
  const m = parseInt(parts[1] ?? '0', 10)

  const handleHour = (newH: number) =>
    onChange(`${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  const handleMin = (newM: number) =>
    onChange(`${String(h).padStart(2, '0')}:${String(newM).padStart(2, '0')}`)

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const mins = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

  function fmtHour(hour: number) {
    if (hour === 0) return '12 AM'
    if (hour === 12) return '12 PM'
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
  }

  return (
    <div className="flex-1">
      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block font-medium">{label}</label>
      <div className="flex items-center border border-gray-200 dark:border-[#48484A] rounded-xl overflow-hidden bg-white dark:bg-[#1C1C1E] focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 transition-all">
        <select
          value={h}
          onChange={(e) => handleHour(Number(e.target.value))}
          className="flex-1 py-2.5 px-1 text-sm text-gray-900 dark:text-gray-50 focus:outline-none bg-transparent text-center cursor-pointer"
        >
          {hours.map((hour) => (
            <option key={hour} value={hour}>
              {fmtHour(hour)}
            </option>
          ))}
        </select>
        <span className="text-gray-300 text-xs select-none px-0.5">:</span>
        <select
          value={m}
          onChange={(e) => handleMin(Number(e.target.value))}
          className="flex-1 py-2.5 px-1 text-sm text-gray-900 dark:text-gray-50 focus:outline-none bg-transparent text-center cursor-pointer"
        >
          {mins.map((min) => (
            <option key={min} value={min}>
              {String(min).padStart(2, '0')}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface AddBlockModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (block: Omit<TimeBlock, 'id'>) => void
  initialTime?: string
  initialCategory?: BlockCategory
  editBlock?: TimeBlock | null
  onAddNewCategory?: () => void
}

const EMPTY_FORM = {
  title: '',
  category: null as BlockCategory | null,
  startTime: '09:00',
  endTime: '10:00',
  priority: 'should' as BlockPriority,
  isLocked: false,
  isFlexible: false,
  isRecurring: false,
  recurringPattern: null as RecurringPattern,
  notes: '',
  location: '',
  mealName: '',
  color: '',
  saveAsTemplate: false,
}

export const AddBlockModal: React.FC<AddBlockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTime,
  initialCategory,
  editBlock,
  onAddNewCategory,
}) => {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<{ title?: string; endTime?: string }>({})
  const [savedTasks, setSavedTasks] = useState<SavedTask[]>([])
  const [userCats, setUserCats] = useState<UserCategory[]>([])
  const [optionsOpen, setOptionsOpen] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      try {
        const raw = localStorage.getItem('daycal_saved_tasks')
        setSavedTasks(raw ? (JSON.parse(raw) as SavedTask[]) : [])
      } catch {
        setSavedTasks([])
      }
      setUserCats(loadUserCategories())
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    setErrors({})
    setOptionsOpen(false)
    if (editBlock) {
      setForm({
        title: editBlock.title,
        category: editBlock.category,
        startTime: editBlock.startTime,
        endTime: editBlock.endTime,
        priority: editBlock.priority,
        isLocked: editBlock.isLocked,
        isFlexible: editBlock.isFlexible,
        isRecurring: editBlock.isRecurring,
        recurringPattern: editBlock.recurringPattern ?? null,
        notes: editBlock.notes ?? '',
        location: editBlock.location ?? '',
        mealName: editBlock.mealName ?? '',
        color: editBlock.color ?? '',
        saveAsTemplate: false,
      })
    } else {
      const start = initialTime ?? '09:00'
      setForm({
        ...EMPTY_FORM,
        startTime: start,
        endTime: addMinutesToTime(start, 60),
        category: initialCategory ?? null,
      })
    }
  }, [isOpen, initialTime, initialCategory, editBlock])

  // Auto-focus title once the rest of the form expands
  const expanded = form.category !== null
  useEffect(() => {
    if (expanded && !editBlock) {
      const t = setTimeout(() => titleRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [expanded, editBlock])

  const handleLoadSaved = (task: SavedTask) => {
    const end = addMinutesToTime(form.startTime, task.estimatedDuration)
    setForm((f) => ({
      ...f,
      title: task.title,
      category: task.category,
      priority: task.priority,
      color: task.color ?? '',
      notes: task.notes ?? '',
      mealName: task.mealName ?? '',
      isLocked: task.isLocked ?? false,
      endTime: end,
    }))
  }

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = savedTasks.filter((t) => t.id !== id)
    setSavedTasks(updated)
    localStorage.setItem('daycal_saved_tasks', JSON.stringify(updated))
  }

  const handleSave = () => {
    const errs: { title?: string; endTime?: string } = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.category) return
    if (timeToMinutes(form.endTime) <= timeToMinutes(form.startTime)) {
      errs.endTime = 'End time must be after start time'
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const duration = timeToMinutes(form.endTime) - timeToMinutes(form.startTime)

    if (form.saveAsTemplate && form.title && form.category) {
      const newTask: SavedTask = {
        id: Date.now().toString(),
        title: form.title.trim(),
        category: form.category,
        estimatedDuration: duration,
        priority: form.priority,
        color: form.color || undefined,
        notes: form.notes.trim() || undefined,
        location: form.location.trim() || undefined,
        mealName: form.category === 'meal' ? form.mealName.trim() || undefined : undefined,
        isLocked: form.isLocked,
      }
      const updated = [...savedTasks, newTask]
      localStorage.setItem('daycal_saved_tasks', JSON.stringify(updated))
    }

    onSave({
      title: form.title.trim(),
      category: form.category!,
      startTime: form.startTime,
      endTime: form.endTime,
      estimatedDuration: duration,
      priority: form.priority,
      isLocked: form.isLocked,
      isFlexible: form.isFlexible,
      isRecurring: form.isRecurring,
      recurringPattern: form.isRecurring ? form.recurringPattern : null,
      notes: form.notes.trim() || undefined,
      location: form.location.trim() || undefined,
      mealName: form.category === 'meal' ? form.mealName.trim() || undefined : undefined,
      color: form.color || undefined,
      status: editBlock?.status ?? 'upcoming',
      isExcused: editBlock?.isExcused ?? false,
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editBlock ? 'Edit Block' : 'New Block'}
    >
      <div className="space-y-4">

        {/* Quick-add saved tasks */}
        {savedTasks.length > 0 && !editBlock && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
              Quick Add
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {savedTasks.map((task) => {
                const meta = getCategoryMeta(task.category, userCats)
                const Ic = meta.iconName ? (ICON_MAP[meta.iconName] ?? null) : null
                return (
                  <button
                    key={task.id}
                    onClick={() => handleLoadSaved(task)}
                    className="flex items-center gap-1.5 shrink-0 pl-2.5 pr-1.5 py-1.5 rounded-full border border-gray-200 dark:border-[#48484A] bg-white dark:bg-[#1C1C1E] hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-colors group"
                    style={task.color ? { borderColor: task.color + '60' } : undefined}
                  >
                    {Ic ? (
                      <Ic size={11} style={{ color: task.color || meta.color }} />
                    ) : (
                      <span className="text-[10px] leading-none">{meta.emoji}</span>
                    )}
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      {task.title}
                    </span>
                    <span
                      className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      onClick={(e) => handleDeleteSaved(task.id, e)}
                    >
                      <X size={9} />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Category */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
            Category
          </p>
          <div className="grid grid-cols-3 gap-2">
            {BUILTIN_CATEGORY_ORDER.map((cat) => {
              const m = getCategoryMeta(cat, userCats)
              const Ic = m.iconName ? (ICON_MAP[m.iconName] ?? null) : null
              const active = form.category === cat
              return (
                <button
                  key={cat}
                  onClick={() => setForm((f) => ({ ...f, category: cat, color: m.color }))}
                  className={[
                    'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all',
                    active
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-100 dark:border-[#38383A] hover:border-gray-200 dark:hover:border-[#48484A] bg-white dark:bg-[#1C1C1E]',
                  ].join(' ')}
                >
                  <div
                    className="rounded-lg p-1.5"
                    style={{ backgroundColor: active ? m.color : m.bgColor }}
                  >
                    {Ic ? (
                      <Ic size={15} style={{ color: active ? '#fff' : m.color }} />
                    ) : (
                      <span className="text-base leading-none">{m.emoji}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>
                    {m.label}
                  </span>
                </button>
              )
            })}
            {userCats.map((cat) => {
              const m = getCategoryMeta(cat.id, userCats)
              const active = form.category === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setForm((f) => ({ ...f, category: cat.id, color: m.color }))}
                  className={[
                    'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all',
                    active
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-100 dark:border-[#38383A] hover:border-gray-200 dark:hover:border-[#48484A] bg-white dark:bg-[#1C1C1E]',
                  ].join(' ')}
                >
                  <div
                    className="rounded-lg p-1.5 text-base leading-none"
                    style={{ backgroundColor: active ? m.color : m.bgColor }}
                  >
                    {m.emoji}
                  </div>
                  <span className={`text-xs font-medium truncate max-w-full ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>
                    {m.label}
                  </span>
                </button>
              )
            })}
            {/* Add new category */}
            <button
              onClick={() => { onClose(); onAddNewCategory?.() }}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#48484A] hover:border-blue-300 bg-white dark:bg-[#1C1C1E] hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
            >
              <div className="rounded-lg p-1.5 bg-gray-100 dark:bg-[#3A3A3C]">
                <Plus size={15} className="text-gray-400 dark:text-gray-500" />
              </div>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Add new</span>
            </button>
          </div>
        </div>

        {/* Accordion: rest of form reveals after category is chosen */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            expanded ? 'opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="space-y-4">

            {/* Title */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">
                Title
              </label>
              <input
                ref={titleRef}
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={
                  form.category
                    ? `e.g. ${getCategoryMeta(form.category, userCats).label} Session`
                    : 'Block title'
                }
                className={[
                  'w-full border rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all',
                  errors.title ? 'border-red-400' : 'border-gray-200 dark:border-[#48484A]',
                ].join(' ')}
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            {/* Time */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
                Time
              </p>
              <div className="flex items-start gap-3">
                <TimePicker
                  label="Start"
                  value={form.startTime}
                  onChange={(v) => setForm((f) => ({ ...f, startTime: v }))}
                />
                <TimePicker
                  label="End"
                  value={form.endTime}
                  onChange={(v) => setForm((f) => ({ ...f, endTime: v }))}
                />
              </div>
              {errors.endTime && (
                <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>
              )}
            </div>


            {/* Priority */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                Priority
              </p>
              <div className="flex gap-2">
                {(['must', 'should', 'nice'] as BlockPriority[]).map((p) => {
                  const pm = PRIORITY_META[p]
                  const active = form.priority === p
                  return (
                    <button
                      key={p}
                      onClick={() => setForm((f) => ({ ...f, priority: p }))}
                      className={[
                        'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all',
                        active
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-100 dark:border-[#38383A] hover:border-gray-200 dark:hover:border-[#48484A]',
                      ].join(' ')}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: pm.color }}
                      />
                      <span
                        className={`text-xs font-medium ${
                          active ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {pm.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Meal details */}
            {form.category === 'meal' && (
              <div>
                <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">
                  Meal Name
                </label>
                <input
                  type="text"
                  value={form.mealName}
                  onChange={(e) => setForm((f) => ({ ...f, mealName: e.target.value }))}
                  placeholder="e.g. Grilled chicken & rice"
                  className="w-full border border-gray-200 dark:border-[#48484A] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-50 bg-white dark:bg-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            )}

            {/* Options accordion */}
            <div className="border border-gray-100 dark:border-[#38383A] rounded-xl overflow-hidden">
              <button
                onClick={() => setOptionsOpen((v) => !v)}
                className="flex items-center justify-between w-full px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors"
              >
                <span>More options</span>
                {optionsOpen ? (
                  <ChevronUp size={14} className="text-gray-400" />
                ) : (
                  <ChevronDown size={14} className="text-gray-400" />
                )}
              </button>

              {optionsOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-[#38383A]">
                  {/* Location */}
                  <div className="pt-3">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">Location</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="e.g. Room 204, Library..."
                      className="w-full border border-gray-200 dark:border-[#48484A] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-50 bg-white dark:bg-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Add any notes..."
                      rows={2}
                      className="w-full border border-gray-200 dark:border-[#48484A] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-50 bg-white dark:bg-[#1C1C1E] resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  {/* Locked */}
                  <button
                    onClick={() => setForm((f) => ({ ...f, isLocked: !f.isLocked }))}
                    className={[
                      'flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all',
                      form.isLocked
                        ? 'border-gray-700 dark:border-gray-400 bg-gray-50 dark:bg-[#2C2C2E]'
                        : 'border-gray-100 dark:border-[#38383A] hover:border-gray-200 dark:hover:border-[#48484A]',
                    ].join(' ')}
                  >
                    {form.isLocked ? (
                      <Lock size={15} className="text-gray-700" />
                    ) : (
                      <Unlock size={15} className="text-gray-400" />
                    )}
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-100">Locked time</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Prevent auto-rescheduling</div>
                    </div>
                  </button>

                  {/* Flexible */}
                  <button
                    onClick={() => setForm((f) => ({ ...f, isFlexible: !f.isFlexible }))}
                    className={[
                      'flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all',
                      form.isFlexible
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-100 dark:border-[#38383A] hover:border-gray-200 dark:hover:border-[#48484A]',
                    ].join(' ')}
                  >
                    <AlignLeft
                      size={15}
                      className={form.isFlexible ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}
                    />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-100">Flexible block</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">No fixed time slot needed</div>
                    </div>
                  </button>

                  {/* Recurring */}
                  <button
                    onClick={() => setForm((f) => ({ ...f, isRecurring: !f.isRecurring }))}
                    className={[
                      'flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all',
                      form.isRecurring
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-100 dark:border-[#38383A] hover:border-gray-200 dark:hover:border-[#48484A]',
                    ].join(' ')}
                  >
                    <RefreshCw
                      size={15}
                      className={form.isRecurring ? 'text-purple-600' : 'text-gray-400 dark:text-gray-500'}
                    />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-100">Recurring</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Repeat this block</div>
                    </div>
                  </button>

                  {form.isRecurring && (
                    <div className="flex gap-2">
                      {(['daily', 'weekdays', 'weekly'] as RecurringPattern[]).map((p) => {
                        if (!p) return null
                        return (
                          <button
                            key={p}
                            onClick={() =>
                              setForm((f) => ({ ...f, recurringPattern: p }))
                            }
                            className={[
                              'flex-1 text-xs font-medium py-2 rounded-lg border-2 capitalize transition-colors',
                              form.recurringPattern === p
                                ? 'border-purple-500 bg-purple-100 text-purple-700'
                                : 'border-gray-100 dark:border-[#38383A] text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-[#48484A]',
                            ].join(' ')}
                          >
                            {p}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save as quick-add task */}
            {!editBlock && (
              <label className="flex items-center gap-2.5 cursor-pointer group py-1">
                <input
                  type="checkbox"
                  checked={form.saveAsTemplate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, saveAsTemplate: e.target.checked }))
                  }
                  className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                />
                <Bookmark
                  size={13}
                  className="text-gray-400 group-hover:text-blue-500 transition-colors"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors">
                  Save as quick-add task
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Save button */}
        <Button variant="primary" onClick={handleSave} className="w-full">
          {editBlock ? 'Save Changes' : 'Add Block'}
        </Button>
      </div>
    </Modal>
  )
}
