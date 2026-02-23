'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateShareImage, shareImage } from '@/lib/share-card'

interface PRShareCardProps {
  exerciseName: string
  weight: number
  reps: number
  previousWeight?: number
  onClose: () => void
}

export function PRShareCard({ exerciseName, weight, reps, previousWeight, onClose }: PRShareCardProps) {
  const [sharing, setSharing] = useState(false)

  async function handleShare() {
    setSharing(true)
    try {
      const blob = await generateShareImage('pr-share-card')
      await shareImage(blob, `New PR! ${weight} lbs × ${reps} on ${exerciseName} 🏆 via @forc3app`)
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
          {/* Card to capture */}
          <div
            id="pr-share-card"
            className="bg-black rounded-2xl p-6 space-y-5"
            style={{ border: '1px solid #FFB30060' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[#FFB300] font-black text-lg tracking-widest">⚡ FORC3</span>
              <span className="text-xs text-neutral-500">forc3.app</span>
            </div>
            <div className="text-center space-y-1">
              <div className="text-4xl">🏆</div>
              <p className="text-xs text-[#FFB300] font-bold uppercase tracking-widest">New Personal Record</p>
            </div>
            <div className="bg-[#1a1500] border border-[#FFB300]/30 rounded-2xl p-5 text-center">
              <h2 className="text-xl font-black uppercase text-white">{exerciseName}</h2>
              <p className="text-3xl font-black text-[#FFB300] mt-2">{weight} lbs × {reps}</p>
              {previousWeight && (
                <div className="mt-3 space-y-0.5">
                  <p className="text-xs text-neutral-500">Previous best: {previousWeight} lbs</p>
                  <p className="text-xs text-[#00C853] font-bold">+{Math.round(weight - previousWeight)} lbs improvement</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm text-neutral-400 border border-[#262626] rounded-xl"
            >
              Close
            </button>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="flex-[2] py-3 text-sm font-bold rounded-xl disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #FFB300, #FF6B00)', color: '#000' }}
            >
              {sharing ? 'Sharing...' : 'Share PR 🏆'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
