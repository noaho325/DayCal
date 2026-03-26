'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Eye, EyeOff, ChevronRight, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

type AuthMode = 'signin' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signUp, user, loading } = useAuth()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!loading && user) {
      localStorage.setItem('daycal_logged_in', 'true')
      router.replace(localStorage.getItem('daycal_onboarded') ? '/' : '/onboarding')
    }
  }, [user, loading, router])

  const set = (k: keyof typeof form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setError('') }

  const proceed = async () => {
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        if (form.password !== form.confirm) { setError('Passwords do not match'); setSubmitting(false); return }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); setSubmitting(false); return }
        await signUp(form.email.trim(), form.password, form.name.trim() || form.email.trim())
      } else {
        await signIn(form.email.trim(), form.password)
      }
      router.replace(localStorage.getItem('daycal_onboarded') ? '/' : '/onboarding')
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password')
      } else if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists')
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = form.email.trim().length > 0 && form.password.length >= 1

  if (!mounted || loading) return null

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0F0F10] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl flex rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#38383A]">

        {/* Left panel — branding */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex-col justify-between p-10 text-white relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
                <CalendarDays size={22} className="text-white" />
              </div>
              <span className="text-xl font-black">DayCal</span>
            </div>
            <h2 className="text-3xl font-black leading-tight mb-3">Your day,<br />in sync.</h2>
            <p className="text-blue-200 text-sm leading-relaxed">Plan your day, track your goals, and stay on top of what matters most.</p>
          </div>
          <div className="relative z-10 space-y-3">
            {['Smart timeline', 'Weekly goals', 'Streak tracking'].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                <span className="text-sm text-blue-100 font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 p-8 md:p-10">
          <div className="flex items-center gap-2.5 mb-8 md:hidden">
            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
              <CalendarDays size={16} className="text-white" />
            </div>
            <span className="text-lg font-black text-gray-900 dark:text-gray-50">DayCal</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">
            {mode === 'signin' ? 'Sign in to your account to continue.' : 'Get started — it only takes a minute.'}
          </p>

          {/* Mode toggle */}
          <div className="flex bg-gray-100 dark:bg-[#2C2C2E] rounded-xl p-1 mb-6">
            {(['signin', 'signup'] as AuthMode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={['flex-1 py-2 rounded-lg text-sm font-semibold transition-all', mode === m ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-gray-50 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'].join(' ')}>
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Name</label>
                <input type="text" placeholder="Your name" value={form.name} onChange={(e) => set('name', e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#48484A] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Email</label>
              <input type="email" placeholder="you@email.com" value={form.email} onChange={(e) => set('email', e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#48484A] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
                  value={form.password} onChange={(e) => set('password', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canSubmit && proceed()}
                  className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#48484A] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition pr-12" />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Confirm password</label>
                <input type={showPw ? 'text' : 'password'} placeholder="Confirm password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#48484A] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</span>
            </div>
          )}

          <button onClick={proceed} disabled={!canSubmit || submitting}
            className={['mt-5 w-full rounded-xl py-3 text-sm font-semibold transition flex items-center justify-center gap-2',
              canSubmit && !submitting ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm' : 'bg-blue-300 text-white cursor-not-allowed'].join(' ')}>
            {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            {!submitting && <ChevronRight size={15} />}
          </button>

          {mode === 'signin' && (
            <p className="text-center text-xs text-blue-500 hover:text-blue-700 mt-3 cursor-pointer font-medium transition">Forgot password?</p>
          )}
        </div>
      </div>
    </div>
  )
}
