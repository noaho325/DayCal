'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Eye, EyeOff, ChevronRight } from 'lucide-react'

type AuthMode = 'signin' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (localStorage.getItem('daycal_logged_in')) {
      router.replace(localStorage.getItem('daycal_onboarded') ? '/' : '/onboarding')
    }
  }, [router])

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const proceed = () => {
    localStorage.setItem('daycal_logged_in', 'true')
    router.replace(localStorage.getItem('daycal_onboarded') ? '/' : '/onboarding')
  }

  const canSubmit = form.email.trim().length > 0 && form.password.length >= 1

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col max-w-md mx-auto">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 px-6 pt-16 pb-14 text-white text-center relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-400/30 border border-white/20">
            <CalendarDays size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-1">DayCal</h1>
          <p className="text-blue-200 text-sm font-medium">Your day, in sync.</p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {['Smart timeline', 'Weekly goals', 'Streak tracking'].map((f) => (
              <span key={f} className="bg-white/15 border border-white/20 rounded-full px-3 py-1 text-[11px] font-medium text-blue-100">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 -mt-6 rounded-t-3xl bg-[#FAFAFA] px-5 pt-7 pb-10">
        {/* Mode tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          {(['signin', 'signup'] as AuthMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={[
                'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
                mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5 ml-1">Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5 ml-1">Email</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canSubmit && proceed()}
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5 ml-1">Confirm password</label>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Confirm password"
                value={form.confirm}
                onChange={(e) => set('confirm', e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
          )}
        </div>

        {/* Primary CTA */}
        <button
          onClick={proceed}
          className={[
            'mt-5 w-full rounded-2xl py-4 text-sm font-semibold transition flex items-center justify-center gap-2',
            canSubmit
              ? 'bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white shadow-md shadow-blue-200'
              : 'bg-blue-300 text-white cursor-not-allowed',
          ].join(' ')}
        >
          {mode === 'signin' ? 'Sign in' : 'Create account'}
          <ChevronRight size={16} />
        </button>

        {mode === 'signin' && (
          <p className="text-center text-xs text-blue-500 hover:text-blue-700 mt-3 cursor-pointer font-medium transition">
            Forgot password?
          </p>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social logins — visual only */}
        <div className="space-y-2.5">
          <button
            className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 flex items-center justify-center gap-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition opacity-60 cursor-not-allowed"
            disabled
          >
            {/* Google G */}
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>
          <button
            className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 flex items-center justify-center gap-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition opacity-60 cursor-not-allowed"
            disabled
          >
            {/* Apple */}
            <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor" className="text-gray-800">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 389.4 31 211.6 31 136.8c0-148.4 97.1-226.8 192.3-226.8 49.2 0 90.3 32.8 121.1 32.8 29.5 0 75.4-34.6 132.8-34.6 28.2 0 114.3 2.9 172.4 97.1l-32.5 20.4zM437.9 68.3c-10.4-52.2 23.4-104.4 55.5-137.4 40.8-43.4 103.7-74.9 157.2-74.9 3.2 52.2-15.6 103.1-55.2 141.8-36.2 36.2-97.1 63.5-157.5 70.5z"/>
            </svg>
            Continue with Apple
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={proceed}
          className="mt-6 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition font-medium py-2"
        >
          Skip for now →
        </button>
      </div>
    </div>
  )
}
