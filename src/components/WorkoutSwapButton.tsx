'use client'
import { useState } from 'react'

interface WorkoutSwapButtonProps {
  workoutId: string
  onSwapped?: (swaps: any[]) => void
}

export default function WorkoutSwapButton({ workoutId, onSwapped }: WorkoutSwapButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function requestSwap() {
    if (!reason.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/coach/swap-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId, reason }),
      })
      const data = await res.json()
      setResult(data)
      onSwapped?.(data.swaps || [])
    } catch {
      setResult({ coachMessage: 'Could not process swap request. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition-all text-sm"
      >
        <span>🔄</span>
        Not feeling this workout? Ask Coach to modify
      </button>
    )
  }

  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Modify Workout</h3>
        <button onClick={() => { setOpen(false); setResult(null) }} className="text-gray-500 hover:text-white">✕</button>
      </div>

      {!result ? (
        <>
          <p className="text-gray-400 text-sm mb-3">
            Tell Coach Alex what&apos;s going on and they&apos;ll swap out exercises for you.
          </p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. My shoulder is sore, can we skip pressing today?"
            rows={3}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#0066FF]/40 resize-none text-sm mb-4"
          />
          <button
            onClick={requestSwap}
            disabled={!reason.trim() || loading}
            className="w-full bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Coach is thinking...
              </span>
            ) : 'Ask Coach to Modify →'}
          </button>
        </>
      ) : (
        <div>
          {result.coachMessage && (
            <div className="bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-xl p-4 mb-4">
              <p className="text-blue-300 text-sm">{result.coachMessage}</p>
            </div>
          )}
          {result.swaps?.length > 0 && (
            <div className="space-y-3">
              {result.swaps.map((swap: any, i: number) => (
                <div key={i} className="bg-black/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-400 text-sm line-through">{swap.original}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-green-400 text-sm font-semibold">{swap.replacement}</span>
                  </div>
                  {swap.reason && <p className="text-gray-500 text-xs">{swap.reason}</p>}
                  {swap.sets && (
                    <p className="text-gray-600 text-xs mt-1">{swap.sets}×{swap.repsMin}-{swap.repsMax}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => { setOpen(false); setResult(null); setReason('') }}
            className="w-full mt-4 py-2 border border-white/10 rounded-xl text-gray-400 hover:text-white text-sm transition-all"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
