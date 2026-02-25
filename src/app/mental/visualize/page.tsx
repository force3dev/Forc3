'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const VISUALIZATION_SCRIPTS = {
  strength: [
    { duration: 10, text: 'Close your eyes. Take three slow, deep breaths.', phase: 'breathe' },
    { duration: 15, text: 'Feel your feet planted on the floor. You\'re stable. You\'re rooted.', phase: 'ground' },
    { duration: 20, text: 'Picture yourself walking up to the bar. The weight you\'ve been chasing. See the plates.', phase: 'visualize' },
    { duration: 20, text: 'Feel your hands grip the bar. Back tight. Chest up. You\'ve done this a thousand times.', phase: 'visualize' },
    { duration: 20, text: 'See yourself execute the lift perfectly. Smooth. Powerful. Exactly how you\'ve trained.', phase: 'execute' },
    { duration: 15, text: 'That was clean. That\'s yours. Your body already knows how.', phase: 'affirm' },
    { duration: 10, text: 'Open your eyes. You\'re ready. Let\'s get it.', phase: 'activate' },
  ],
  cardio: [
    { duration: 10, text: 'Find a comfortable position. Breathe slowly.', phase: 'breathe' },
    { duration: 15, text: 'Visualize the route. See the terrain. Feel the rhythm of your feet.', phase: 'visualize' },
    { duration: 20, text: 'Picture yourself at mile 3 — the hardest part. See yourself pushing through it anyway.', phase: 'challenge' },
    { duration: 20, text: 'Feel the finish. The satisfaction. The pride. It\'s already yours.', phase: 'affirm' },
    { duration: 10, text: 'Open your eyes. You know how this ends. Go.', phase: 'activate' },
  ],
  competition: [
    { duration: 10, text: 'Breathe. Slow down your nervous system. You\'re calm and ready.', phase: 'breathe' },
    { duration: 20, text: 'You have prepared for this. Think of every early morning, every hard session, every rep you didn\'t want to do but did anyway.', phase: 'affirm' },
    { duration: 20, text: 'Visualize your competition from start to finish. See every key moment going your way.', phase: 'visualize' },
    { duration: 15, text: 'Pressure is a privilege. Only those who prepared get to feel it.', phase: 'affirm' },
    { duration: 10, text: 'Time to show what you\'re built from. Let\'s go.', phase: 'activate' },
  ],
}

const PHASE_COLORS: Record<string, string> = {
  breathe: '#22c55e', ground: '#3b82f6', visualize: '#a855f7',
  challenge: '#f59e0b', execute: '#ef4444', affirm: '#22c55e', activate: '#f97316',
}

export default function VisualizePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-black" />}>
      <VisualizeContent />
    </Suspense>
  )
}

function VisualizeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = (searchParams.get('type') || 'strength') as keyof typeof VISUALIZATION_SCRIPTS
  const [phase, setPhase] = useState<'idle' | 'running' | 'complete'>('idle')
  const [stepIndex, setStepIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const steps = VISUALIZATION_SCRIPTS[type] || VISUALIZATION_SCRIPTS.strength
  const currentStep = steps[stepIndex]

  function start() {
    setPhase('running')
    setStepIndex(0)
    setTimeLeft(steps[0].duration)
  }

  useEffect(() => {
    if (phase !== 'running') return

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          const nextIdx = stepIndex + 1
          if (nextIdx >= steps.length) {
            setPhase('complete')
            clearInterval(intervalRef.current)
            return 0
          }
          setStepIndex(nextIdx)
          return steps[nextIdx].duration
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [phase, stepIndex, steps])

  const phaseColor = currentStep ? (PHASE_COLORS[currentStep.phase] || '#ffffff') : '#ffffff'
  const progress = currentStep ? ((currentStep.duration - timeLeft) / currentStep.duration) * 100 : 0

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col">
      {phase === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <span className="text-7xl mb-6">🧠</span>
          <h1 className="text-3xl font-black mb-3">Pre-Workout Visualization</h1>
          <p className="text-gray-400 leading-relaxed mb-2">
            Elite athletes use visualization to prime the nervous system before training.
          </p>
          <p className="text-gray-500 text-sm mb-10">
            {steps.reduce((s, st) => s + st.duration, 0)} seconds · eyes closed · headphones recommended
          </p>

          <div className="flex gap-3 mb-8 flex-wrap justify-center">
            {Object.keys(VISUALIZATION_SCRIPTS).map(t => (
              <a key={t} href={`?type=${t}`} className={`px-4 py-2 rounded-2xl text-sm font-bold capitalize ${t === type ? 'bg-white text-black' : 'bg-gray-900 text-gray-400'}`}>
                {t}
              </a>
            ))}
          </div>

          <button
            onClick={start}
            className="w-full max-w-xs bg-white text-black font-black text-xl py-5 rounded-3xl active:scale-95 transition-transform"
          >
            Begin
          </button>

          <button onClick={() => router.back()} className="mt-4 text-gray-600 text-sm">Skip for now</button>
        </div>
      )}

      {phase === 'running' && currentStep && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div
            className="w-40 h-40 rounded-full flex items-center justify-center mb-10 transition-all duration-1000"
            style={{
              background: `${phaseColor}15`,
              boxShadow: `0 0 ${60 * (1 - progress/100) + 20}px ${phaseColor}30`,
              border: `2px solid ${phaseColor}40`
            }}
          >
            <span className="text-4xl font-black" style={{ color: phaseColor }}>{timeLeft}s</span>
          </div>

          <p className="text-xl leading-relaxed font-medium text-white max-w-sm">{currentStep.text}</p>

          <div className="mt-10 flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === stepIndex ? 'w-8' : 'w-2'}`}
                   style={{ background: i <= stepIndex ? phaseColor : '#374151' }} />
            ))}
          </div>

          <button onClick={() => setPhase('complete')} className="mt-8 text-gray-700 text-sm">Skip</button>
        </div>
      )}

      {phase === 'complete' && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <span className="text-7xl mb-6">🔥</span>
          <h2 className="text-3xl font-black mb-3">You&apos;re Ready</h2>
          <p className="text-gray-400 mb-10">Your mind and body are primed. Go get it.</p>
          <button onClick={() => router.back()} className="w-full max-w-xs bg-green-500 text-black font-black text-xl py-5 rounded-3xl">
            Start Workout
          </button>
        </div>
      )}
    </div>
  )
}
