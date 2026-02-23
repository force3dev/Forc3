'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateShareImage, shareImage } from '@/lib/share-card'

interface WorkoutShareCardProps {
  workoutName: string
  date: string
  exerciseCount: number
  totalSets: number
  totalVolume: number
  durationMinutes: number
  streakDays: number
  onClose: () => void
}

export function WorkoutShareCard({
  workoutName,
  date,
  exerciseCount,
  totalSets,
  totalVolume,
  durationMinutes,
  streakDays,
  onClose,
}: WorkoutShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)

  async function handleShare() {
    setSharing(true)
    try {
      const blob = await generateShareImage('workout-share-card')
      await shareImage(blob, `Crushed it! ${workoutName} complete 💪 via @forc3app`)
    } catch (e) {
      console.error(e)
    } finally {
      setSharing(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 p-4 pb-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-sm space-y-4"
        >
          {/* The card that will be captured */}
          <div
            id="workout-share-card"
            ref={cardRef}
            className="bg-black border border-[#262626] rounded-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[#0066FF] font-black text-lg tracking-widest">⚡ FORC3</span>
              <span className="text-xs text-neutral-500">forc3.app</span>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-widest">Workout Complete</p>
              <h2 className="text-2xl font-black mt-1 text-white">{workoutName}</h2>
              <p className="text-xs text-neutral-500 mt-0.5">{date}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Exercises', value: String(exerciseCount) },
                { label: 'Sets', value: String(totalSets) },
                { label: 'Volume', value: `${Math.round(totalVolume).toLocaleString()} lbs` },
                { label: 'Duration', value: `${durationMinutes} min` },
              ].map(s => (
                <div key={s.label} className="bg-[#111] rounded-xl p-3">
                  <div className="text-lg font-bold text-white">{s.value}</div>
                  <div className="text-xs text-neutral-500">{s.label}</div>
                </div>
              ))}
            </div>
            {streakDays > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <span className="text-sm font-bold text-white">{streakDays} day streak</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm text-neutral-400 border border-[#262626] rounded-xl"
            >
              Skip
            </button>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="flex-[2] py-3 text-sm font-bold bg-[#0066FF] text-white rounded-xl disabled:opacity-50"
            >
              {sharing ? 'Sharing...' : 'Share Workout 📤'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
