'use client'
import { useState, useEffect, useRef } from 'react'

interface FocusTimerProps {
  onClose?: () => void
}

export function FocusTimer({ onClose }: FocusTimerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [focusMode, setFocusMode] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  function toggle() {
    setIsRunning(!isRunning)
    if (!isRunning) setFocusMode(true)
  }

  function reset() {
    setIsRunning(false)
    setElapsed(0)
    setFocusMode(false)
  }

  if (focusMode && isRunning) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        <p className="text-gray-600 text-xs uppercase tracking-widest mb-4">Focus Mode</p>
        <p className="text-white font-black text-7xl tabular-nums">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </p>
        <p className="text-gray-600 text-sm mt-4">No distractions. Just train.</p>
        <div className="flex gap-4 mt-10">
          <button onClick={() => setFocusMode(false)} className="text-gray-600 text-sm px-6 py-3 rounded-2xl bg-gray-900">
            Show Workout
          </button>
          <button onClick={reset} className="text-red-400 text-sm px-6 py-3 rounded-2xl bg-red-950/30">
            End Focus
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-3xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Focus Timer</p>
          <p className="text-white font-black text-2xl tabular-nums mt-1">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggle}
            className={`px-4 py-2 rounded-2xl text-sm font-bold ${isRunning ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}
          >
            {isRunning ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
          </button>
          {elapsed > 0 && (
            <button onClick={reset} className="px-4 py-2 rounded-2xl text-sm font-bold bg-gray-800 text-gray-400">
              Reset
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="px-3 py-2 rounded-2xl text-sm text-gray-600">
              ×
            </button>
          )}
        </div>
      </div>
      {isRunning && (
        <button onClick={() => setFocusMode(true)} className="mt-3 w-full bg-gray-800 text-gray-400 text-xs font-bold py-2 rounded-xl">
          Enter Full Focus Mode
        </button>
      )}
    </div>
  )
}
