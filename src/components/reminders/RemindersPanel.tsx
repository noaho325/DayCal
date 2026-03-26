'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Plus, X, ChevronRight, CheckCircle2, Circle, StickyNote, Pin } from 'lucide-react'

interface Reminder {
  id: string
  text: string
  done: boolean
  type: 'daily' | 'pinned'
  createdDate: string // yyyy-MM-dd — daily reminders reset each day
}

const STORAGE_KEY = 'daycal_reminders_v2'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function loadReminders(): Reminder[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Reminder[]
    // Reset done state on daily reminders from previous days
    const today = todayStr()
    return raw.map((r) =>
      r.type === 'daily' && r.createdDate !== today ? { ...r, done: false, createdDate: today } : r
    )
  } catch {
    return []
  }
}

function saveReminders(reminders: Reminder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders))
}

type Tab = 'daily' | 'pinned'

interface Props {
  open: boolean
  onToggle: () => void
}

export const RemindersPanel: React.FC<Props> = ({ open, onToggle }) => {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [tab, setTab] = useState<Tab>('daily')
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loaded = loadReminders()
    setReminders(loaded)
    saveReminders(loaded) // persist any date resets
  }, [])

  const update = (next: Reminder[]) => {
    setReminders(next)
    saveReminders(next)
  }

  const addReminder = () => {
    const text = draft.trim()
    if (!text) return
    update([
      ...reminders,
      { id: Date.now().toString(), text, done: false, type: tab, createdDate: todayStr() },
    ])
    setDraft('')
    inputRef.current?.focus()
  }

  const toggleDone = (id: string) => {
    update(reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)))
  }

  const deleteReminder = (id: string) => {
    update(reminders.filter((r) => r.id !== id))
  }

  const current = reminders.filter((r) => r.type === tab)
  const active = current.filter((r) => !r.done)
  const done = current.filter((r) => r.done)

  return (
    <div className={[
      'hidden lg:flex flex-col bg-white dark:bg-[#1C1C1E] border-l border-gray-100 dark:border-[#38383A] shrink-0 transition-all duration-300 overflow-hidden',
      open ? 'w-72' : 'w-10',
    ].join(' ')}>

      {/* Collapse / expand tab */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-14 w-full shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors border-b border-gray-100 dark:border-[#38383A]"
        title={open ? 'Collapse reminders' : 'Open reminders'}
      >
        {open ? <ChevronRight size={16} /> : <StickyNote size={15} />}
      </button>

      {open && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-3 pb-0">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Reminders</h2>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-3 pt-2 pb-2">
            {(['daily', 'pinned'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  tab === t
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300',
                ].join(' ')}
              >
                {t === 'pinned' && <Pin size={10} />}
                {t === 'daily' ? 'Daily' : 'Pinned'}
              </button>
            ))}
          </div>

          {tab === 'daily' && (
            <p className="px-4 pb-2 text-[10px] text-gray-400 dark:text-gray-500">Resets each morning</p>
          )}
          {tab === 'pinned' && (
            <p className="px-4 pb-2 text-[10px] text-gray-400 dark:text-gray-500">Stay until you remove them</p>
          )}

          {/* Add input */}
          <div className="px-3 pb-2 border-b border-gray-100 dark:border-[#38383A]">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl px-3 py-2 border border-gray-200 dark:border-[#38383A] focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addReminder() }}
                placeholder={tab === 'daily' ? "Add for today…" : "Add a pinned reminder…"}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 outline-none min-w-0"
              />
              <button
                onClick={addReminder}
                disabled={!draft.trim()}
                className="shrink-0 text-blue-500 hover:text-blue-600 disabled:text-gray-300 dark:disabled:text-gray-600 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {active.length === 0 && done.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-6 px-2">
                {tab === 'daily' ? "Nothing for today yet." : "No pinned reminders."}
              </p>
            )}

            {active.map((r) => (
              <div key={r.id} className="group flex items-start gap-2 rounded-xl px-2.5 py-2 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors">
                <button onClick={() => toggleDone(r.id)} className="mt-0.5 shrink-0 text-gray-300 dark:text-gray-600 hover:text-blue-500 transition-colors">
                  <Circle size={15} />
                </button>
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 leading-snug break-words min-w-0">{r.text}</span>
                <button onClick={() => deleteReminder(r.id)} className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-all">
                  <X size={13} />
                </button>
              </div>
            ))}

            {done.length > 0 && (
              <>
                <div className="pt-2 pb-1 px-2.5">
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Done</span>
                </div>
                {done.map((r) => (
                  <div key={r.id} className="group flex items-start gap-2 rounded-xl px-2.5 py-2 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors opacity-50">
                    <button onClick={() => toggleDone(r.id)} className="mt-0.5 shrink-0 text-green-500 hover:text-gray-400 transition-colors">
                      <CheckCircle2 size={15} />
                    </button>
                    <span className="flex-1 text-sm text-gray-400 dark:text-gray-500 line-through leading-snug break-words min-w-0">{r.text}</span>
                    <button onClick={() => deleteReminder(r.id)} className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-all">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
