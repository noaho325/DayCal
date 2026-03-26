'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Target, Zap, Check, GraduationCap, Briefcase, Sun } from 'lucide-react'
import type { OnboardingGoals } from '@/types'
import {
  UNIVERSITY_DAY_TEMPLATE,
  WORK_DAY_TEMPLATE,
  CHILL_DAY_TEMPLATE,
} from '@/utils/constants'
import { Button } from '@/components/shared/Button'
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
        enabled ? 'bg-blue-500' : 'bg-gray-200',
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
        ? 'border-gray-200 bg-white'
        : 'border-gray-100 bg-gray-50 opacity-60',
    ].join(' ')}
  >
    <div className="flex items-center justify-between mb-3">
      <div>
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        {sublabel && (
          <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {enabled && (
          <span className="text-sm font-bold text-blue-600">
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
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>
            {min} {unit}
          </span>
          <span>
            {max} {unit}
          </span>
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
    color: 'border-indigo-200 bg-indigo-50',
    activeColor: 'border-indigo-500 bg-indigo-100',
    data: UNIVERSITY_DAY_TEMPLATE,
  },
  {
    id: 'work' as const,
    name: 'Work Day',
    description: 'Deep work, meetings, and personal time',
    Icon: Briefcase,
    iconColor: '#3B82F6',
    color: 'border-blue-200 bg-blue-50',
    activeColor: 'border-blue-500 bg-blue-100',
    data: WORK_DAY_TEMPLATE,
  },
  {
    id: 'chill' as const,
    name: 'Chill Day',
    description: 'Light tasks and intentional downtime',
    Icon: Sun,
    iconColor: '#F59E0B',
    color: 'border-amber-200 bg-amber-50',
    activeColor: 'border-amber-500 bg-amber-100',
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-5 py-8">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Welcome to DayCal</p>
          <h1 className="text-2xl font-black text-gray-900">Let&apos;s set you up</h1>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={[
                'h-1 flex-1 rounded-full transition-colors duration-300',
                i < step ? 'bg-blue-500' : 'bg-gray-200',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Step 1: Goals */}
        {step === 1 && (
          <div className="flex-1 space-y-4 overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target size={20} className="text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">Set Your Goals</h2>
              </div>
              <p className="text-gray-500 text-sm">
                Toggle off any goals that don&apos;t apply to you.
              </p>
            </div>

            <div className="space-y-3">
              <SliderField
                label="Study hours / week"
                value={goals.studyHoursPerWeek}
                min={0}
                max={40}
                step={2}
                unit="hrs"
                enabled={eg.study}
                onChange={(v) => setGoals((g) => ({ ...g, studyHoursPerWeek: v }))}
                onToggle={(v) => setEnabled('study', v)}
              />
              <SliderField
                label="Workouts / week"
                value={goals.workoutsPerWeek}
                min={0}
                max={7}
                unit="×"
                enabled={eg.workouts}
                onChange={(v) => setGoals((g) => ({ ...g, workoutsPerWeek: v }))}
                onToggle={(v) => setEnabled('workouts', v)}
              />
              <SliderField
                label="Meals / day"
                value={goals.mealsPerDay}
                min={1}
                max={5}
                unit="meals"
                enabled={eg.meals}
                onChange={(v) => setGoals((g) => ({ ...g, mealsPerDay: v }))}
                onToggle={(v) => setEnabled('meals', v)}
              />
              <SliderField
                label="Sleep target"
                value={goals.sleepHours}
                min={4}
                max={12}
                unit="hrs"
                enabled={eg.sleep}
                onChange={(v) => setGoals((g) => ({ ...g, sleepHours: v }))}
                onToggle={(v) => setEnabled('sleep', v)}
              />
              <SliderField
                label="Work hours / week"
                sublabel="Sick days and called-off shifts won't count against you"
                value={goals.workHoursPerWeek}
                min={0}
                max={40}
                step={2}
                unit="hrs"
                enabled={eg.work}
                onChange={(v) => setGoals((g) => ({ ...g, workHoursPerWeek: v }))}
                onToggle={(v) => setEnabled('work', v)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="primary" onClick={() => setStep(2)} className="flex-1">
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Template */}
        {step === 2 && (
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={20} className="text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">Quick Start</h2>
              </div>
              <p className="text-gray-500 text-sm">
                Apply a starter template to today&apos;s schedule, or start blank.
              </p>
            </div>

            <div className="space-y-3">
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
                      <div className="font-semibold text-gray-900">{t.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {t.description}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {t.data.length} blocks pre-set
                      </div>
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
                    ? 'border-gray-400 bg-gray-100'
                    : 'border-gray-200 hover:border-gray-300',
                ].join(' ')}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gray-100 border border-gray-200" />
                <div className="flex-1">
                  <div className="font-semibold text-gray-700">Start Blank</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Add blocks manually
                  </div>
                </div>
                {!goals.templateChoice && (
                  <div className="shrink-0 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </button>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button variant="primary" onClick={() => setStep(3)} className="flex-1">
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Ready */}
        {step === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
            <div>
              <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                <Check size={40} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                You&apos;re all set!
              </h2>
              <p className="text-gray-500 leading-relaxed">
                {goals.templateChoice
                  ? `Your ${TEMPLATES.find((t) => t.id === goals.templateChoice)?.name} template has been loaded for today.`
                  : 'Your schedule is ready. Tap the + button to add your first block.'}
              </p>
            </div>

            <div className="w-full space-y-2 text-left">
              {[
                eg.study && {
                  label: 'Study',
                  value: `${goals.studyHoursPerWeek} hrs/wk`,
                },
                eg.workouts && {
                  label: 'Workouts',
                  value: `${goals.workoutsPerWeek}×/wk`,
                },
                eg.sleep && {
                  label: 'Sleep',
                  value: `${goals.sleepHours} hrs/night`,
                },
              ]
                .filter(Boolean)
                .map((g) => {
                  const goal = g as { label: string; value: string }
                  return (
                    <div
                      key={goal.label}
                      className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-gray-100 shadow-sm"
                    >
                      <span className="text-sm text-gray-600">{goal.label}</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {goal.value}
                      </span>
                    </div>
                  )
                })}
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleFinish}
              className="w-full"
            >
              Open My Schedule
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
