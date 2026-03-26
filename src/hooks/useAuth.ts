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
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(user, { displayName })
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

  return { ...state, signUp, signIn, signOut }
}
