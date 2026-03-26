'use client'

import { useEffect, useCallback } from 'react'
import { isFirebaseConfigured, db } from '@/lib/firebase'
import type { OnboardingGoals } from '@/types'
import type { StreakData } from './useStreak'

interface UserProfile {
  displayName?: string
  username?: string
  bio?: string
  photoURL?: string
  privacy?: Record<string, boolean>
  weeklyPoints?: number
}

/**
 * Syncs user goals, streak, and profile between Firestore and localStorage.
 * On mount: loads from Firestore and writes into localStorage so existing hooks pick it up.
 * Provides save functions that write to both.
 */
export function useCloudSync(userId: string | undefined) {
  // On mount: pull data from Firestore into localStorage
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !userId) return

    const sync = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore')
        const ref = doc(db!, 'users', userId, 'profile', 'data')
        const snap = await getDoc(ref)
        if (!snap.exists()) return

        const data = snap.data()

        if (data.goals) {
          localStorage.setItem('daycal_goals', JSON.stringify(data.goals))
        }
        if (data.streak) {
          localStorage.setItem('daycal_streak', JSON.stringify(data.streak))
        }
        if (data.displayName !== undefined) {
          localStorage.setItem('daycal_profile_name', data.displayName)
        }
        if (data.username !== undefined) {
          localStorage.setItem('daycal_profile_username', data.username)
        }
        if (data.bio !== undefined) {
          localStorage.setItem('daycal_profile_bio', data.bio)
        }
        if (data.photoURL !== undefined) {
          localStorage.setItem('daycal_profile_photo', data.photoURL)
        }
        if (data.privacy) {
          localStorage.setItem('daycal_privacy', JSON.stringify(data.privacy))
        }
        if (data.userCats) {
          localStorage.setItem('daycal_user_cats', JSON.stringify(data.userCats))
        }
        if (data.catOverrides) {
          localStorage.setItem('daycal_cat_overrides', JSON.stringify(data.catOverrides))
        }
      } catch (err) {
        console.warn('Cloud sync load failed', err)
      }
    }

    sync()
  }, [userId])

  const saveGoals = useCallback(async (goals: OnboardingGoals) => {
    localStorage.setItem('daycal_goals', JSON.stringify(goals))
    if (!isFirebaseConfigured || !db || !userId) return
    try {
      const { doc, setDoc } = await import('firebase/firestore')
      await setDoc(doc(db!, 'users', userId, 'profile', 'data'), { goals }, { merge: true })
    } catch (err) {
      console.warn('Failed to save goals to Firestore', err)
    }
  }, [userId])

  const saveStreak = useCallback(async (streak: StreakData) => {
    localStorage.setItem('daycal_streak', JSON.stringify(streak))
    if (!isFirebaseConfigured || !db || !userId) return
    try {
      const { doc, setDoc } = await import('firebase/firestore')
      await setDoc(doc(db!, 'users', userId, 'profile', 'data'), { streak }, { merge: true })
    } catch (err) {
      console.warn('Failed to save streak to Firestore', err)
    }
  }, [userId])

  const saveProfile = useCallback(async (profile: Partial<UserProfile>) => {
    if (profile.displayName !== undefined) localStorage.setItem('daycal_profile_name', profile.displayName)
    if (profile.username !== undefined) localStorage.setItem('daycal_profile_username', profile.username)
    if (profile.bio !== undefined) localStorage.setItem('daycal_profile_bio', profile.bio)
    if (profile.photoURL !== undefined) localStorage.setItem('daycal_profile_photo', profile.photoURL)
    if (profile.privacy !== undefined) localStorage.setItem('daycal_privacy', JSON.stringify(profile.privacy))
    if (!isFirebaseConfigured || !db || !userId) return
    try {
      const { doc, setDoc } = await import('firebase/firestore')
      await setDoc(doc(db!, 'users', userId, 'profile', 'data'), profile, { merge: true })
    } catch (err) {
      console.warn('Failed to save profile to Firestore', err)
    }
  }, [userId])

  const saveWeeklyPoints = useCallback(async (points: number) => {
    if (!isFirebaseConfigured || !db || !userId) return
    try {
      const { doc, setDoc } = await import('firebase/firestore')
      await setDoc(doc(db!, 'users', userId, 'profile', 'data'), { weeklyPoints: points }, { merge: true })
    } catch {}
  }, [userId])

  return { saveGoals, saveStreak, saveProfile, saveWeeklyPoints }
}
