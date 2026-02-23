'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface WeeklyData {
  workoutsCompleted: number
  targetWorkouts: number
  totalVolume: number
  prsHit: number
  streakDays: number
  recapText: string
  nextWeekFocus: string
  weekStart: string
  weekEnd: string
}

export default function WeeklyRecap() {
  const [data, setData] = useState<WeeklyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/progress/weekly?recap=true')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-3 animate-pulse">
        <div className="h-4 bg-[#262626] rounded w-1/2" />
        <div className="h-3 bg-[#262626] rounded w-3/4" />
        <div className="h-3 bg-[#262626] rounded w-2/3" />
      </div>
    )
  }

  if (!data) return null

  const weekLabel = data.weekStart
    ? `${new Date(data.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(data.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : 'This Week'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#141414] border border-[#0066FF]/30 rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-[#262626]">
        <p className="text-xs text-[#0066FF] font-bold uppercase tracking-widest">Weekly Recap</p>
        <p className="text-xs text-neutral-500 mt-0.5">{weekLabel}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 divide-x divide-[#262626] border-b border-[#262626]">
        {[
          { label: 'Workouts', value: `${data.workoutsCompleted}/${data.targetWorkouts}` },
          { label: 'Volume', value: `${Math.round((data.totalVolume || 0) / 1000)}k lbs` },
          { label: 'PRs', value: String(data.prsHit || 0) },
          { label: 'Streak', value: `${data.streakDays}d 🔥` },
        ].map(stat => (
          <div key={stat.label} className="p-3 text-center">
            <div className="text-base font-bold text-white">{stat.value}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Coach recap text */}
      {data.recapText && (
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-neutral-300 leading-relaxed">{data.recapText}</p>
          {data.nextWeekFocus && (
            <div className="bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-[#0066FF] uppercase tracking-wide mb-1">Focus next week</p>
              <p className="text-sm text-neutral-200">{data.nextWeekFocus}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
