'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { haptics } from '@/lib/haptics'

const SORENESS_AREAS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Quads', 'Hamstrings', 'Calves', 'Lower Back', 'Neck']

export default function CheckInPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ recoveryScore: number; recommendation: string; status: string } | null>(null)

  const [sleepHours, setSleepHours] = useState(7)
  const [sleepQuality, setSleepQuality] = useState(7)
  const [energyLevel, setEnergyLevel] = useState(7)
  const [sorenessLevel, setSorenessLevel] = useState(3)
  const [sorenessAreas, setSorenessAreas] = useState<string[]>([])
  const [stressLevel, setStressLevel] = useState(3)
  const [notes, setNotes] = useState('')

  const steps = [
    { label: 'Sleep', question: 'How many hours did you sleep?' },
    { label: 'Sleep Quality', question: 'How was your sleep quality?' },
    { label: 'Energy', question: 'How is your energy right now?' },
    { label: 'Soreness', question: 'How sore are you?' },
    { label: 'Stress', question: 'How stressed are you?' },
    { label: 'Notes', question: 'Anything else to note?' },
  ]

  function toggleSorenessArea(area: string) {
    haptics.selection()
    setSorenessAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])
  }

  async function submit() {
    setLoading(true)
    haptics.medium()
    try {
      const res = await fetch('/api/coach/morning-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sleepHours, sleepQuality, energyLevel, sorenessLevel, sorenessAreas, stressLevel, notes }),
      })
      const data = await res.json()
      if (data.recoveryScore !== undefined) {
        haptics.success()
        setResult({ recoveryScore: data.recoveryScore, recommendation: data.recommendation || data.coachResponse || '', status: data.status || '' })
      } else {
        router.push('/dashboard')
      }
    } catch {
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  function next() {
    haptics.light()
    if (step < steps.length - 1) setStep(step + 1)
    else submit()
  }

  function RatingSelector({ value, onChange, max = 10 }: { value: number; onChange: (v: number) => void; max?: number }) {
    return (
      <div className="flex gap-2 flex-wrap justify-center mt-6">
        {Array.from({ length: max }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => { haptics.selection(); onChange(n) }}
            className={`w-12 h-12 rounded-2xl font-bold text-lg transition-all active:scale-90 ${
              n === value ? 'bg-green-500 text-black scale-110' : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    )
  }

  if (result) {
    const scoreColor = result.recoveryScore >= 75 ? 'text-green-400' : result.recoveryScore >= 50 ? 'text-yellow-400' : 'text-red-400'
    return (
      <div className="min-h-dvh bg-black text-white flex flex-col items-center justify-center px-6" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Recovery Score</p>
          <p className={`text-8xl font-black ${scoreColor}`}>{result.recoveryScore}</p>
          <p className="text-gray-400 mt-4 text-lg max-w-sm leading-relaxed">{result.recommendation}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-10 bg-green-500 text-black font-bold px-8 py-4 rounded-2xl active:scale-95 transition-transform"
          >
            View Today&apos;s Workout
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Progress */}
      <div className="px-6 pt-6">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-green-500' : 'bg-gray-800'}`} />
          ))}
        </div>
        <p className="text-gray-500 text-xs mt-3">{step + 1} of {steps.length}</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div key={step} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full max-w-sm text-center">
          <h2 className="text-2xl font-black mb-2">{steps[step].question}</h2>

          {step === 0 && (
            <div className="mt-6">
              <p className="text-6xl font-black text-green-400">{sleepHours}h</p>
              <input
                type="range" min={3} max={12} step={0.5} value={sleepHours}
                onChange={e => { setSleepHours(parseFloat(e.target.value)); haptics.selection() }}
                className="w-full mt-6 accent-green-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1"><span>3h</span><span>12h</span></div>
            </div>
          )}
          {step === 1 && <RatingSelector value={sleepQuality} onChange={setSleepQuality} />}
          {step === 2 && <RatingSelector value={energyLevel} onChange={setEnergyLevel} />}
          {step === 3 && (
            <>
              <RatingSelector value={sorenessLevel} onChange={setSorenessLevel} />
              <p className="text-gray-500 text-sm mt-6 mb-3">Where?</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SORENESS_AREAS.map(area => (
                  <button
                    key={area}
                    onClick={() => toggleSorenessArea(area)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                      sorenessAreas.includes(area) ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-gray-900 text-gray-400 border border-gray-800'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 4 && <RatingSelector value={stressLevel} onChange={setStressLevel} />}
          {step === 5 && (
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="How are you feeling today? (optional)"
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-4 text-white placeholder-gray-600 mt-6 min-h-[120px] focus:outline-none focus:border-green-500/50 resize-none"
            />
          )}
        </motion.div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-8" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}>
        <button
          onClick={next}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-4 rounded-2xl active:scale-95 transition-all"
        >
          {loading ? 'Analyzing...' : step < steps.length - 1 ? 'Next' : 'Submit Check-In'}
        </button>
        {step > 0 && (
          <button onClick={() => { haptics.light(); setStep(step - 1) }} className="w-full text-gray-500 py-3 mt-2 text-sm">
            Back
          </button>
        )}
      </div>
    </div>
  )
}
