'use client'

import { useState, useEffect } from 'react'
import type { User } from 'firebase/auth'
import { isFirebaseConfigured, auth } from '@/lib/firebase'

interface AuthState {
  user: User | null
  loading: boolean
}

interface UseAuthReturn extends AuthState {
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<void>
  deactivateAccount: () => Promise<void>
  sendVerificationEmail: () => Promise<void>
  sendPasswordResetEmail: (email: string) => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setState({ user: null, loading: false })
      return
    }

    const loadAuth = async () => {
      const { onAuthStateChanged } = await import('firebase/auth')
      const unsubscribe = onAuthStateChanged(auth!, (user) => {
        setState({ user, loading: false })
      })
      return unsubscribe
    }

    let unsubscribe: (() => void) | undefined
    loadAuth().then((fn) => { unsubscribe = fn })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured.')
    }
    const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = await import('firebase/auth')
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(user, { displayName })
    await sendEmailVerification(user).catch((e) => console.warn('Verification email failed:', e))
    // Initialize Firestore profile so friends can find this user
    try {
      const { db: firestoreDb, isFirebaseConfigured: ifc } = await import('@/lib/firebase')
      if (ifc && firestoreDb) {
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
        await setDoc(doc(firestoreDb, 'users', user.uid, 'profile', 'data'), {
          displayName,
          username: '',
          bio: '',
          photoURL: null,
          weeklyPoints: 0,
          streak: { current: 0, longest: 0, lastActiveDate: null },
          createdAt: serverTimestamp(),
        })
      }
    } catch (e) {
      console.warn('Profile init failed:', e)
    }
    setState((prev) => ({ ...prev, user }))
  }

  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured.')
    }
    const { signInWithEmailAndPassword } = await import('firebase/auth')
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signOut = async () => {
    if (!isFirebaseConfigured || !auth) return
    const { signOut: firebaseSignOut } = await import('firebase/auth')
    await firebaseSignOut(auth)
    setState({ user: null, loading: false })
  }

  const deleteAccount = async () => {
    if (!isFirebaseConfigured || !auth?.currentUser) throw new Error('Not signed in')
    const { deleteUser } = await import('firebase/auth')
    // Delete Firestore data
    if (auth.currentUser) {
      try {
        const { isFirebaseConfigured: ifc, db } = await import('@/lib/firebase')
        if (ifc && db) {
          const { doc, deleteDoc, collection, getDocs } = await import('firebase/firestore')
          const uid = auth.currentUser.uid
          // Delete schedules
          const schedSnap = await getDocs(collection(db, 'users', uid, 'schedules'))
          await Promise.all(schedSnap.docs.map((d) => deleteDoc(d.ref)))
          // Delete profile
          await deleteDoc(doc(db, 'users', uid, 'profile', 'data')).catch(() => {})
          // Delete username index entry
          const username = localStorage.getItem('daycal_profile_username')
          if (username) await deleteDoc(doc(db, 'usernames', username)).catch(() => {})
        }
      } catch {}
    }
    await deleteUser(auth.currentUser)
    // Clear localStorage
    Object.keys(localStorage).filter((k) => k.startsWith('daycal')).forEach((k) => localStorage.removeItem(k))
    setState({ user: null, loading: false })
  }

  const deactivateAccount = async () => {
    if (!isFirebaseConfigured || !auth?.currentUser) throw new Error('Not signed in')
    try {
      const { isFirebaseConfigured: ifc, db } = await import('@/lib/firebase')
      if (ifc && db) {
        const { doc, setDoc } = await import('firebase/firestore')
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'profile', 'data'), { deactivated: true }, { merge: true })
      }
    } catch {}
    const { signOut: firebaseSignOut } = await import('firebase/auth')
    await firebaseSignOut(auth!)
    Object.keys(localStorage).filter((k) => k.startsWith('daycal')).forEach((k) => localStorage.removeItem(k))
    setState({ user: null, loading: false })
  }

  const sendVerificationEmail = async () => {
    if (!isFirebaseConfigured || !auth?.currentUser) return
    const { sendEmailVerification } = await import('firebase/auth')
    await sendEmailVerification(auth.currentUser)
  }

  const sendPasswordResetEmail = async (email: string) => {
    if (!isFirebaseConfigured || !auth) throw new Error('Firebase not configured')
    const { sendPasswordResetEmail: firebaseSendReset } = await import('firebase/auth')
    await firebaseSendReset(auth, email)
  }

  return { ...state, signUp, signIn, signOut, deleteAccount, deactivateAccount, sendVerificationEmail, sendPasswordResetEmail }
}
