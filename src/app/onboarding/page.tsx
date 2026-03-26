'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useCloudSync } from '@/hooks/useCloudSync'
import { Target, Zap, Check, GraduationCap, Briefcase, Sun, CalendarDays } from 'lucide-react'
import type { OnboardingGoals } from '@/types'
import {
  UNIVERSITY_DAY_TEMPLATE,
  WORK_DAY_TEMPLATE,
  CHILL_DAY_TEMPLATE,
} from '@/utils/constants'
import { getTodayString } from '@/utils/formatters'

const TOTAL_STEPS = 3

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
        enabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-[#48484A]',
      ].join(' ')}
      aria-checked={enabled}
      role="switch"
    >
      <span
        className={[
          'inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200',
          enabled ? 'translate-x-6' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  )
}

// ─── Slider Field with Toggle ─────────────────────────────────────────────────

interface SliderFieldProps {
  label: string
  sublabel?: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  enabled: boolean
  onChange: (v: number) => void
  onToggle: (v: boolean) => void
}

const SliderField: React.FC<SliderFieldProps> = ({
  label,
  sublabel,
  value,
  min,
  max,
  step = 1,
  unit,
  enabled,
  onChange,
  onToggle,
}) => (
  <div
    className={[
      'rounded-xl border p-4 transition-all duration-200',
      enabled
        ? 'border-gray-200 dark:border-[#38383A] bg-white dark:bg-[#2C2C2E]'
        : 'border-gray-100 dark:border-[#2C2C2E] bg-gray-50 dark:bg-[#1C1C1E] opacity-50',
    ].join(' ')}
  >
    <div className="flex items-center justify-between mb-3">
      <div>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</span>
        {sublabel && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sublabel}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {enabled && (
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {value} {unit}
          </span>
        )}
        <Toggle enabled={enabled} onChange={onToggle} />
      </div>
    </div>

    {enabled && (
      <>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-[#48484A] rounded-full appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
          <span>{min} {unit}</span>
          <span>{max} {unit}</span>
        </div>
      </>
    )}
  </div>
)

// ─── Templates ────────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: 'university' as const,
    name: 'University Day',
    description: 'Classes, study sessions, and campus life',
    Icon: GraduationCap,
    iconColor: '#6366F1',
    color: 'border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40',
    activeColor: 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900/50',
    data: UNIVERSITY_DAY_TEMPLATE,
  },
  {
    id: 'work' as const,
    name: 'Work Day',
    description: 'Deep work, meetings, and personal time',
    Icon: Briefcase,
    iconColor: '#3B82F6',
    color: 'border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40',
    activeColor: 'border-blue-500 bg-blue-100 dark:bg-blue-900/50',
    data: WORK_DAY_TEMPLATE,
  },
  {
    id: 'chill' as const,
    name: 'Chill Day',
    description: 'Light tasks and intentional downtime',
    Icon: Sun,
    iconColor: '#F59E0B',
    color: 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40',
    activeColor: 'border-amber-500 bg-amber-100 dark:bg-amber-900/50',
    data: CHILL_DAY_TEMPLATE,
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

type EnabledGoals = NonNullable<OnboardingGoals['enabledGoals']>

const DEFAULT_ENABLED: EnabledGoals = {
  study: true,
  workouts: true,
  meals: true,
  sleep: true,
  work: false,
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { saveGoals } = useCloudSync(user?.uid)
  const [step, setStep] = useState(1)
  const [goals, setGoals] = useState<OnboardingGoals>({
    studyHoursPerWeek: 20,
    workoutsPerWeek: 3,
    mealsPerDay: 3,
    sleepHours: 8,
    workHoursPerWeek: 0,
    enabledGoals: DEFAULT_ENABLED,
    templateChoice: null,
  })

  const eg = goals.enabledGoals ?? DEFAULT_ENABLED
  const setEnabled = (key: keyof EnabledGoals, v: boolean) =>
    setGoals((g) => ({
      ...g,
      enabledGoals: { ...(g.enabledGoals ?? DEFAULT_ENABLED), [key]: v },
    }))

  const handleFinish = () => {
    localStorage.setItem('daycal_onboarded', 'true')
    localStorage.setItem('daycal_goals', JSON.stringify(goals))
    saveGoals(goals)

    if (goals.templateChoice) {
      const template = TEMPLATES.find((t) => t.id === goals.templateChoice)
      if (template) {
        const today = getTodayString()
        const blocks = template.data.map((b, i) => ({
          ...b,
          id: `${Date.now()}-${i}`,
          recurringPattern: b.recurringPattern ?? null,
          status: 'upcoming' as const,
        }))
        localStorage.setItem(
          `daycal_schedule_${today}`,
          JSON.stringify(blocks)
        )
      }
    }

    router.push('/')
  }

  const STEP_LABELS = ['Goals', 'Template', 'Ready']

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0F0F10] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl flex rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#38383A]">

        {/* Left panel — branding + progress */}
        <div className="hidden md:flex md:w-64 lg:w-72 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex-col justify-between p-8 text-white relative overflow-hidden shrink-0">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
                <CalendarDays size={18} className="text-white" />
              </div>
              <span className="text-lg font-black">DayCal</span>
            </div>
            <h2 className="text-2xl font-black leading-tight mb-2">Set up your<br />schedule.</h2>
            <p className="text-blue-200 text-sm leading-relaxed">Personalize goals and choose a starter template to hit the ground running.</p>
          </div>

          {/* Step indicators */}
          <div className="relative z-10 space-y-2">
            {STEP_LABELS.map((label, i) => {
              const num = i + 1
              const done = step > num
              const active = step === num
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className={[
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                    done ? 'bg-white text-blue-600' : active ? 'bg-white/30 text-white border-2 border-white' : 'bg-white/10 text-blue-300',
                  ].join(' ')}>
                    {done ? <Check size={13} /> : num}
                  </div>
                  <span className={['text-sm font-medium transition-colors', active ? 'text-white' : done ? 'text-blue-100' : 'text-blue-300'].join(' ')}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right panel — content */}
        <div className="flex-1 flex flex-col p-8 md:p-10 overflow-y-auto max-h-[90vh]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-6 md:hidden">
            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
              <CalendarDays size={16} className="text-white" />
            </div>
            <span className="text-lg font-black text-gray-900 dark:text-gray-50">DayCal</span>
          </div>

          {/* Mobile progress */}
          <div className="flex gap-1.5 mb-6 md:hidden">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={[
                  'h-1 flex-1 rounded-full transition-colors duration-300',
                  i < step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-[#38383A]',
                ].join(' ')}
              />
            ))}
          </div>

          {/* Step 1: Goals */}
          {step === 1 && (
            <div className="flex-1 flex flex-col">
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <Target size={20} className="text-blue-500" />
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">Set Your Goals</h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Toggle off any goals that don&apos;t apply to you.
                </p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pb-2">
                <SliderField
                  label="Study hours / week"
                  value={goals.studyHoursPerWeek}
                  min={0} max={40} step={2} unit="hrs"
                  enabled={eg.study}
                  onChange={(v) => setGoals((g) => ({ ...g, studyHoursPerWeek: v }))}
                  onToggle={(v) => setEnabled('study', v)}
                />
                <SliderField
                  label="Workouts / week"
                  value={goals.workoutsPerWeek}
                  min={0} max={7} unit="×"
                  enabled={eg.workouts}
                  onChange={(v) => setGoals((g) => ({ ...g, workoutsPerWeek: v }))}
                  onToggle={(v) => setEnabled('workouts', v)}
                />
                <SliderField
                  label="Meals / day"
                  value={goals.mealsPerDay}
                  min={1} max={5} unit="meals"
                  enabled={eg.meals}
                  onChange={(v) => setGoals((g) => ({ ...g, mealsPerDay: v }))}
                  onToggle={(v) => setEnabled('meals', v)}
                />
                <SliderField
                  label="Sleep target"
                  value={goals.sleepHours}
                  min={4} max={12} unit="hrs"
                  enabled={eg.sleep}
                  onChange={(v) => setGoals((g) => ({ ...g, sleepHours: v }))}
                  onToggle={(v) => setEnabled('sleep', v)}
                />
                <SliderField
                  label="Work hours / week"
                  sublabel="Sick days and called-off shifts won't count against you"
                  value={goals.workHoursPerWeek}
                  min={0} max={40} step={2} unit="hrs"
                  enabled={eg.work}
                  onChange={(v) => setGoals((g) => ({ ...g, workHoursPerWeek: v }))}
                  onToggle={(v) => setEnabled('work', v)}
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold transition shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Template */}
          {step === 2 && (
            <div className="flex-1 flex flex-col">
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={20} className="text-blue-500" />
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">Quick Start</h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Apply a starter template to today&apos;s schedule, or start blank.
                </p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pb-2">
                {TEMPLATES.map((t) => {
                  const isActive = goals.templateChoice === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() =>
                        setGoals((g) => ({
                          ...g,
                          templateChoice: isActive ? null : t.id,
                        }))
                      }
                      className={[
                        'w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 text-left transition-all',
                        isActive ? t.activeColor : t.color,
                      ].join(' ')}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: t.iconColor + '20' }}>
                        <t.Icon size={22} style={{ color: t.iconColor }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-50">{t.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.description}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.data.length} blocks pre-set</div>
                      </div>
                      {isActive && (
                        <div className="shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}

                <button
                  onClick={() => setGoals((g) => ({ ...g, templateChoice: null }))}
                  className={[
                    'w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 text-left transition-all',
                    !goals.templateChoice
                      ? 'border-gray-400 bg-gray-100 dark:bg-[#2C2C2E] dark:border-gray-500'
                      : 'border-gray-200 dark:border-[#38383A] hover:border-gray-300',
                  ].join(' ')}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gray-100 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#48484A]" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-700 dark:text-gray-200">Start Blank</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Add blocks manually</div>
                  </div>
                  {!goals.templateChoice && (
                    <div className="shrink-0 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 dark:bg-[#2C2C2E] hover:bg-gray-200 dark:hover:bg-[#3A3A3C] text-gray-700 dark:text-gray-200 rounded-xl py-3 text-sm font-semibold transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold transition shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div>
                <div className="w-16 h-16 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-200 dark:shadow-green-900/30">
                  <Check size={32} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                  You&apos;re all set!
                </h1>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm max-w-xs mx-auto">
                  {goals.templateChoice
                    ? `Your ${TEMPLATES.find((t) => t.id === goals.templateChoice)?.name} template has been loaded for today.`
                    : 'Your schedule is ready. Tap the + button to add your first block.'}
                </p>
              </div>

              <div className="w-full max-w-sm space-y-2 text-left">
                {[
                  eg.study && { label: 'Study', value: `${goals.studyHoursPerWeek} hrs/wk` },
                  eg.workouts && { label: 'Workouts', value: `${goals.workoutsPerWeek}×/wk` },
                  eg.sleep && { label: 'Sleep', value: `${goals.sleepHours} hrs/night` },
                ]
                  .filter(Boolean)
                  .map((g) => {
                    const goal = g as { label: string; value: string }
                    return (
                      <div
                        key={goal.label}
                        className="flex items-center justify-between bg-gray-50 dark:bg-[#2C2C2E] rounded-xl px-4 py-2.5 border border-gray-100 dark:border-[#38383A]"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-300">{goal.label}</span>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{goal.value}</span>
                      </div>
                    )
                  })}
              </div>

              <button
                onClick={handleFinish}
                className="w-full max-w-sm bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold transition shadow-sm"
              >
                Open My Schedule
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
