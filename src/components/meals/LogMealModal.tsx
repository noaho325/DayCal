'use client'

import React, { useState, useRef } from 'react'
import { X, Camera, Trash2 } from 'lucide-react'
import type { TimeBlock } from '@/types'
import { getTodayString } from '@/utils/formatters'

interface Props {
  isOpen: boolean
  onClose: () => void
  /** dateStr is the date to log the meal on */
  onSave: (block: Omit<TimeBlock, 'id'>, dateStr: string) => void
  defaultHour?: number   // pre-fill hour (e.g. 8=breakfast, 12=lunch, 18=dinner)
  defaultDate?: string   // pre-fill date (defaults to today)
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

function resizeImage(file: File, maxPx = 500): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function LogMealModal({ isOpen, onClose, onSave, defaultHour, defaultDate }: Props) {
  const now = new Date()
  const initHour = defaultHour ?? now.getHours()
  const initMinute = Math.floor(now.getMinutes() / 5) * 5

  const [mealName, setMealName] = useState('')
  const [hour, setHour] = useState(initHour)
  const [minute, setMinute] = useState(initMinute)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const resized = await resizeImage(file)
    setPhotoDataUrl(resized)
  }

  const handleSave = () => {
    if (!mealName.trim()) return
    const pad = (n: number) => String(n).padStart(2, '0')
    const startTime = `${pad(hour)}:${pad(minute)}`
    // End time = start + 30 min
    const endTotalMins = hour * 60 + minute + 30
    const endTime = `${pad(Math.min(Math.floor(endTotalMins / 60), 23))}:${pad(endTotalMins % 60)}`

    onSave(
      {
        title: mealName.trim(),
        category: 'meal',
        mealName: mealName.trim(),
        mealPhotoURL: photoDataUrl ?? undefined,
        startTime,
        endTime,
        estimatedDuration: 30,
        priority: 'should',
        isLocked: false,
        isFlexible: false,
        status: 'upcoming',
        isExcused: false,
        isRecurring: false,
        notes: notes.trim() || undefined,
      },
      defaultDate ?? getTodayString()
    )

    // Reset
    setMealName('')
    setHour(initHour)
    setMinute(initMinute)
    setPhotoDataUrl(null)
    setNotes('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-lg font-bold text-gray-900">Log a Meal</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-4">
          {/* Photo */}
          <div>
            {photoDataUrl ? (
              <div className="relative w-full h-44 rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoDataUrl} alt="Meal" className="w-full h-full object-cover" />
                <button
                  onClick={() => setPhotoDataUrl(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-28 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-amber-400 hover:bg-amber-50 transition-all text-gray-400 hover:text-amber-500"
              >
                <Camera size={22} />
                <span className="text-sm font-medium">Add a photo</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhoto}
            />
          </div>

          {/* Meal name */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1.5">What did you eat?</label>
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="e.g. Grilled chicken & rice"
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>

          {/* Time */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1.5">Time</label>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 w-fit">
              <select value={hour} onChange={(e) => setHour(+e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-800 focus:outline-none">
                {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
              </select>
              <span className="text-gray-400 font-bold">:</span>
              <select value={minute} onChange={(e) => setMinute(+e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-800 focus:outline-none">
                {MINUTES.map((m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it taste? Any thoughts..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!mealName.trim()}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Log Meal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
