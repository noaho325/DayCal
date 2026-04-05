'use client'

import React, { useState, useEffect } from 'react'
import { Plus, X, GraduationCap, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import type { TimeBlock, ExamSubject } from '@/types'
import { differenceInCalendarDays, parse, format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns'

const SUBJECT_COLORS = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#14B8A6', '#F97316',
]

const STORAGE_KEY = 'daycal_exams'

export function loadExams(): ExamSubject[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ExamSubject[]) : []
  } catch { return [] }
}

function saveExams(exams: ExamSubject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exams))
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = parse(dateStr, 'yyyy-MM-dd', new Date())
  return differenceInCalendarDays(exam, today)
}

function countdown(days: number): { text: string; color: string } {
  if (days < 0)  return { text: 'Done', color: '#9CA3AF' }
  if (days === 0) return { text: 'Today!', color: '#EF4444' }
  if (days === 1) return { text: 'Tomorrow', color: '#F97316' }
  if (days <= 3)  return { text: `${days} days`, color: '#F97316' }
  if (days <= 7)  return { text: `${days} days`, color: '#3B82F6' }
  return { text: `${days} days`, color: '#6B7280' }
}

interface ExamPlannerProps {
  blocks: TimeBlock[]
}

export function ExamPlanner({ blocks }: ExamPlannerProps) {
  const [exams, setExams] = useState<ExamSubject[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')

  useEffect(() => { setExams(loadExams()) }, [])

  const nextColor = SUBJECT_COLORS[exams.length % SUBJECT_COLORS.length]

  const handleAdd = () => {
    if (!newName.trim() || !newDate) return
    const updated = [...exams, { id: Date.now().toString(), name: newName.trim(), examDate: newDate, color: nextColor }]
    setExams(updated)
    saveExams(updated)
    setNewName('')
    setNewDate('')
    setAdding(false)
  }

  const handleDelete = (id: string) => {
    const updated = exams.filter((e) => e.id !== id)
    setExams(updated)
    saveExams(updated)
  }

  // hours studied today per subject (completed or in-progress tagged study blocks)
  const hoursById: Record<string, number> = {}
  for (const b of blocks) {
    if (b.category === 'study' && b.examSubjectId && (b.status === 'completed' || b.status === 'in-progress')) {
      hoursById[b.examSubjectId] = (hoursById[b.examSubjectId] ?? 0) + b.estimatedDuration / 60
    }
  }

  // Empty state — subtle prompt
  if (exams.length === 0 && !adding) {
    return (
      <div className="mx-3 mb-2">
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-200 dark:border-[#38383A] text-xs text-gray-400 dark:text-gray-500 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-500 transition-colors"
        >
          <GraduationCap size={13} />
          Track your exam subjects
        </button>
      </div>
    )
  }

  if (exams.length === 0 && adding) {
    return (
      <div className="mx-3 mb-2 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] px-4 py-4 space-y-2">
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Add Exam</p>
        <AddForm
          newName={newName} setNewName={setNewName}
          newDate={newDate} setNewDate={setNewDate}
          onAdd={handleAdd}
          onCancel={() => { setAdding(false); setNewName(''); setNewDate('') }}
        />
      </div>
    )
  }

  return (
    <div className="mx-3 mb-2 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-[#38383A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 min-w-0"
        >
          <GraduationCap size={14} className="text-purple-500 shrink-0" />
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Exams</span>
          {collapsed
            ? <ChevronDown size={12} className="text-gray-300 dark:text-gray-600 ml-0.5" />
            : <ChevronUp size={12} className="text-gray-300 dark:text-gray-600 ml-0.5" />}
        </button>
        {!collapsed && (
          <button
            onClick={() => setAdding((v) => !v)}
            className="w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
            aria-label="Add exam"
          >
            <Plus size={12} className="text-purple-500" />
          </button>
        )}
      </div>

      {!collapsed && (
        <>
          {/* Subject rows */}
          {exams.length > 0 && (
            <div className="px-4 pb-3 space-y-2.5">
              {exams.map((exam) => {
                const days = daysUntil(exam.examDate)
                const { text, color } = countdown(days)
                const hrs = hoursById[exam.id]
                return (
                  <div key={exam.id} className="flex items-center gap-2.5 group">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: exam.color }} />
                    <span
                      className={[
                        'flex-1 text-sm font-medium text-gray-800 dark:text-gray-100 truncate',
                        days < 0 ? 'line-through text-gray-400 dark:text-gray-600' : '',
                      ].join(' ')}
                    >
                      {exam.name}
                    </span>
                    {hrs !== undefined && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                        {hrs % 1 === 0 ? hrs : hrs.toFixed(1)}h today
                      </span>
                    )}
                    <span className="text-xs font-semibold shrink-0" style={{ color }}>{text}</span>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      aria-label={`Remove ${exam.name}`}
                    >
                      <X size={12} className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add form */}
          {adding && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-[#38383A] space-y-2">
              <AddForm
                newName={newName} setNewName={setNewName}
                newDate={newDate} setNewDate={setNewDate}
                onAdd={handleAdd}
                onCancel={() => { setAdding(false); setNewName(''); setNewDate('') }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface AddFormProps {
  newName: string
  setNewName: (v: string) => void
  newDate: string
  setNewDate: (v: string) => void
  onAdd: () => void
  onCancel: () => void
}

function MiniCalendar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : null
  const [viewMonth, setViewMonth] = useState(() => {
    const base = selected ?? new Date()
    return startOfMonth(base)
  })

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })

  const days: Date[] = []
  let cur = gridStart
  while (cur <= monthEnd || days.length % 7 !== 0) {
    days.push(cur)
    cur = addDays(cur, 1)
    if (days.length > 42) break
  }

  return (
    <div className="border border-gray-200 dark:border-[#48484A] rounded-xl overflow-hidden bg-white dark:bg-[#2C2C2E]">
      {/* Month nav */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-[#38383A]">
        <button onClick={() => setViewMonth((m) => subMonths(m, 1))} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3A3A3C] transition-colors">
          <ChevronLeft size={14} className="text-gray-500" />
        </button>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{format(viewMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setViewMonth((m) => addMonths(m, 1))} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3A3A3C] transition-colors">
          <ChevronRight size={14} className="text-gray-500" />
        </button>
      </div>
      {/* Day labels */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 pb-1">{d}</div>
        ))}
      </div>
      {/* Day grid */}
      <div className="grid grid-cols-7 px-2 pb-2 gap-y-0.5">
        {days.map((day, i) => {
          const isSelected = selected ? isSameDay(day, selected) : false
          const inMonth = isSameMonth(day, viewMonth)
          const past = day < new Date(new Date().setHours(0, 0, 0, 0))
          return (
            <button
              key={i}
              onClick={() => !past && onChange(format(day, 'yyyy-MM-dd'))}
              disabled={past}
              className={[
                'h-7 w-full flex items-center justify-center rounded-lg text-xs transition-colors',
                isSelected ? 'bg-purple-500 text-white font-bold' : '',
                !isSelected && isToday(day) ? 'text-purple-500 font-semibold' : '',
                !isSelected && inMonth && !past ? 'text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30' : '',
                !inMonth || past ? 'text-gray-300 dark:text-gray-600 cursor-default' : '',
              ].join(' ')}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AddForm({ newName, setNewName, newDate, setNewDate, onAdd, onCancel }: AddFormProps) {
  return (
    <>
      <input
        autoFocus
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Subject (e.g. Calculus)"
        className="w-full text-sm border border-gray-200 dark:border-[#48484A] rounded-xl px-3 py-2 bg-white dark:bg-[#2C2C2E] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400 dark:placeholder-gray-500"
        onKeyDown={(e) => e.key === 'Enter' && newDate && onAdd()}
      />
      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest pt-1">Exam Date</p>
      <MiniCalendar value={newDate} onChange={setNewDate} />
      {newDate && (
        <p className="text-xs text-center text-purple-500 font-medium">
          {format(parse(newDate, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM d')}
        </p>
      )}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onAdd}
          disabled={!newName.trim() || !newDate}
          className="flex-1 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Add Exam
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#48484A] text-gray-500 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors"
        >
          Cancel
        </button>
      </div>
    </>
  )
}
