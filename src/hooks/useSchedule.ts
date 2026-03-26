'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TimeBlock, UndoAction, SkipReason } from '@/types'
import { timeToMinutes, addMinutesToTime } from '@/utils/formatters'
import { isFirebaseConfigured, db } from '@/lib/firebase'

// Polyfill crypto.randomUUID for older environments
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const MAX_UNDO_STACK = 20
const STORAGE_PREFIX = 'daycal_schedule_'

function getLocalKey(date: string) {
  return `${STORAGE_PREFIX}${date}`
}

function loadFromLocalStorage(date: string): TimeBlock[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(getLocalKey(date))
    return raw ? (JSON.parse(raw) as TimeBlock[]) : []
  } catch {
    return []
  }
}

function saveToLocalStorage(date: string, blocks: TimeBlock[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getLocalKey(date), JSON.stringify(blocks))
  } catch {
    // ignore storage errors
  }
}

function sortBlocks(blocks: TimeBlock[]): TimeBlock[] {
  return [...blocks].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  )
}

interface UseScheduleReturn {
  blocks: TimeBlock[]
  loading: boolean
  addBlock: (block: Omit<TimeBlock, 'id'>) => void
  updateBlock: (id: string, changes: Partial<TimeBlock>) => void
  deleteBlock: (id: string) => void
  delayBlock: (id: string, minutes: number) => void
  pushAllBack: (fromTime: string, minutes: number) => void
  skipBlock: (id: string, reason: SkipReason, reasonText?: string) => void
  excuseBlock: (id: string) => void
  completeBlock: (id: string) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  undoStack: UndoAction[]
  redoStack: UndoAction[]
  hydration: number
  setHydration: (n: number) => void
}

export function useSchedule(date: string, userId?: string): UseScheduleReturn {
  const [blocks, setBlocksRaw] = useState<TimeBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [undoStack, setUndoStack] = useState<UndoAction[]>([])
  const [redoStack, setRedoStack] = useState<UndoAction[]>([])
  const [hydration, setHydration] = useState(0)

  // Load schedule
  useEffect(() => {
    let cancelled = false

    const loadSchedule = async () => {
      setLoading(true)

      if (isFirebaseConfigured && db && userId) {
        try {
          const { doc, getDoc } = await import('firebase/firestore')
          const ref = doc(db, 'users', userId, 'schedules', date)
          const snap = await getDoc(ref)
          if (!cancelled) {
            if (snap.exists()) {
              const data = snap.data() as { blocks: TimeBlock[]; hydration: number }
              setBlocksRaw(sortBlocks(data.blocks ?? []))
              setHydration(data.hydration ?? 0)
            } else {
              setBlocksRaw([])
            }
            setLoading(false)
          }
          return
        } catch (error) {
          console.warn('Firestore load failed, falling back to localStorage', error)
        }
      }

      if (!cancelled) {
        setBlocksRaw(sortBlocks(loadFromLocalStorage(date)))
        setLoading(false)
      }
    }

    loadSchedule()
    return () => { cancelled = true }
  }, [date, userId])

  // Persist whenever blocks change
  const setBlocks = useCallback(
    (updater: (prev: TimeBlock[]) => TimeBlock[]) => {
      setBlocksRaw((prev) => {
        const next = sortBlocks(updater(prev))

        // Persist
        if (isFirebaseConfigured && db && userId) {
          import('firebase/firestore').then(({ doc, setDoc }) => {
            // Firestore rejects undefined values — strip them out
            const clean = JSON.parse(JSON.stringify(next))
            setDoc(
              doc(db!, 'users', userId, 'schedules', date),
              { blocks: clean, hydration, date },
              { merge: true }
            ).catch((err) => {
              console.warn('Firestore save failed', err)
              saveToLocalStorage(date, next)
            })
          })
        } else {
          saveToLocalStorage(date, next)
        }

        return next
      })
    },
    [date, userId, hydration]
  )

  const pushUndo = useCallback(
    (type: UndoAction['type'], previousBlocks: TimeBlock[]) => {
      setUndoStack((prev) => {
        const next = [{ type, previousBlocks }, ...prev].slice(0, MAX_UNDO_STACK)
        return next
      })
      setRedoStack([])
    },
    []
  )

  const addBlock = useCallback(
    (block: Omit<TimeBlock, 'id'>) => {
      setBlocks((prev) => {
        pushUndo('add', prev)
        return [...prev, { ...block, id: generateId() }]
      })
    },
    [setBlocks, pushUndo]
  )

  const updateBlock = useCallback(
    (id: string, changes: Partial<TimeBlock>) => {
      setBlocks((prev) => {
        pushUndo('update', prev)
        return prev.map((b) => (b.id === id ? { ...b, ...changes } : b))
      })
    },
    [setBlocks, pushUndo]
  )

  const deleteBlock = useCallback(
    (id: string) => {
      setBlocks((prev) => {
        pushUndo('remove', prev)
        return prev.filter((b) => b.id !== id)
      })
    },
    [setBlocks, pushUndo]
  )

  const delayBlock = useCallback(
    (id: string, minutes: number) => {
      setBlocks((prev) => {
        pushUndo('update', prev)
        return prev.map((b) => {
          if (b.id !== id) return b
          return {
            ...b,
            startTime: addMinutesToTime(b.startTime, minutes),
            endTime: addMinutesToTime(b.endTime, minutes),
          }
        })
      })
    },
    [setBlocks, pushUndo]
  )

  const pushAllBack = useCallback(
    (fromTime: string, minutes: number) => {
      const fromMinutes = timeToMinutes(fromTime)
      setBlocks((prev) => {
        pushUndo('reorder', prev)
        return prev.map((b) => {
          if (timeToMinutes(b.startTime) < fromMinutes) return b
          return {
            ...b,
            startTime: addMinutesToTime(b.startTime, minutes),
            endTime: addMinutesToTime(b.endTime, minutes),
          }
        })
      })
    },
    [setBlocks, pushUndo]
  )

  const skipBlock = useCallback(
    (id: string, reason: SkipReason, reasonText?: string) => {
      setBlocks((prev) => {
        pushUndo('update', prev)
        return prev.map((b) =>
          b.id === id
            ? b.status === 'skipped'
              ? { ...b, status: 'upcoming', skipReason: undefined, skipReasonText: undefined }
              : { ...b, status: 'skipped', skipReason: reason, skipReasonText: reasonText }
            : b
        )
      })
    },
    [setBlocks, pushUndo]
  )

  const excuseBlock = useCallback(
    (id: string) => {
      setBlocks((prev) => {
        pushUndo('update', prev)
        return prev.map((b) =>
          b.id === id ? { ...b, status: 'excused', isExcused: true } : b
        )
      })
    },
    [setBlocks, pushUndo]
  )

  const completeBlock = useCallback(
    (id: string) => {
      setBlocks((prev) => {
        pushUndo('update', prev)
        return prev.map((b) =>
          b.id === id
            ? { ...b, status: b.status === 'completed' ? 'upcoming' : 'completed' }
            : b
        )
      })
    },
    [setBlocks, pushUndo]
  )

  // Auto-complete blocks whose end time has passed (today only, upcoming/in-progress only)
  useEffect(() => {
    if (loading) return
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    if (date !== todayStr) return

    const autoComplete = () => {
      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      setBlocksRaw((prev) => {
        const updated = prev.map((b) => {
          if (b.status !== 'upcoming' && b.status !== 'in-progress') return b
          const [endH, endM] = b.endTime.split(':').map(Number)
          if (nowMinutes >= endH * 60 + endM) return { ...b, status: 'completed' as const }
          return b
        })
        if (updated.some((b, i) => b.status !== prev[i].status)) {
          saveToLocalStorage(date, updated)
          return updated
        }
        return prev
      })
    }

    autoComplete()
    const interval = setInterval(autoComplete, 60_000)
    return () => clearInterval(interval)
  }, [date, loading])

  const undo = useCallback(() => {
    setUndoStack((prevUndo) => {
      if (prevUndo.length === 0) return prevUndo
      const [last, ...rest] = prevUndo
      setRedoStack((prevRedo) => [{ type: last.type, previousBlocks: blocks }, ...prevRedo])
      setBlocksRaw(sortBlocks(last.previousBlocks))
      saveToLocalStorage(date, last.previousBlocks)
      return rest
    })
  }, [blocks, date])

  const redo = useCallback(() => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo
      const [last, ...rest] = prevRedo
      setUndoStack((prevUndo) => [{ type: last.type, previousBlocks: blocks }, ...prevUndo])
      setBlocksRaw(sortBlocks(last.previousBlocks))
      saveToLocalStorage(date, last.previousBlocks)
      return rest
    })
  }, [blocks, date])

  const handleSetHydration = useCallback(
    (n: number) => {
      setHydration(n)
      if (isFirebaseConfigured && db && userId) {
        import('firebase/firestore').then(({ doc, setDoc }) => {
          setDoc(
            doc(db!, 'users', userId, 'schedules', date),
            { hydration: n },
            { merge: true }
          ).catch(console.warn)
        })
      }
    },
    [date, userId]
  )

  return {
    blocks,
    loading,
    addBlock,
    updateBlock,
    deleteBlock,
    delayBlock,
    pushAllBack,
    skipBlock,
    excuseBlock,
    completeBlock,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoStack,
    redoStack,
    hydration,
    setHydration: handleSetHydration,
  }
}
