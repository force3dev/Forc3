'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { haptics } from '@/lib/haptics'

interface RestTimerProps {
  seconds: number
  onComplete: () => void
  onSkip: () => void
}

export function RestTimer({ seconds, onComplete, onSkip }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const intervalRef = useRef<NodeJS.Timeout>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          haptics.success()
          onComplete()
          return 0
        }
        if (prev === 4) haptics.medium()
        if (prev === 11) haptics.light()
        return prev - 1
      })
    }, 1000)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const progress = remaining / seconds
  const circumference = 2 * Math.PI * 16

  const minutes = Math.floor(remaining / 60)
  const secs = remaining % 60
  const displayTime = minutes > 0
    ? `${minutes}:${secs.toString().padStart(2, '0')}`
    : `${secs}s`

  const color = remaining > seconds * 0.5 ? '#22c55e'
    : remaining > seconds * 0.2 ? '#f59e0b'
    : '#ef4444'

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-20 px-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 flex items-center gap-4 shadow-2xl">
        {/* Circular mini progress */}
        <div className="relative w-10 h-10 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="#1f2937" strokeWidth="3"/>
            <circle
              cx="20" cy="20" r="16" fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
            {minutes > 0 ? `${minutes}:${secs.toString().padStart(2,'0')}` : remaining}
          </span>
        </div>

        {/* Label */}
        <div className="flex-1">
          <p className="text-white font-bold text-sm">Resting · {displayTime}</p>
          <p className="text-gray-500 text-xs">Next set when ready</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRemaining(r => r + 30)}
            className="bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded-xl font-medium active:scale-90"
          >
            +30s
          </button>
          <button
            onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); onSkip() }}
            className="bg-green-500/20 text-green-400 text-xs px-2.5 py-1.5 rounded-xl font-medium active:scale-90"
          >
            Skip
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default RestTimer
