"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getLevelFromXP, getXPProgressPercent, getNextLevel } from "@/lib/xp-system";

interface LevelUpScreenProps {
  show: boolean;
  newLevel: number;
  totalXP: number;
  onDismiss: () => void;
}

const LEVEL_TITLES: Record<number, string> = {
  1: "Rookie",
  2: "Athlete",
  3: "Competitor",
  4: "Elite",
  5: "Champion",
  6: "Legend",
  7: "Master",
  8: "Grandmaster",
  9: "Immortal",
  10: "God Mode",
};

export default function LevelUpScreen({ show, newLevel, totalXP, onDismiss }: LevelUpScreenProps) {
  const title = LEVEL_TITLES[newLevel] || "Champion";
  const xpPct = getXPProgressPercent(totalXP);
  const nextLevel = getNextLevel(totalXP);
  const xpToNext = nextLevel ? nextLevel.minXP - totalXP : 0;

  useEffect(() => {
    if (!show) return;
    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 400]);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center px-6 text-center"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#0066FF]/20 rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="relative z-10 space-y-6"
          >
            {/* Badge */}
            <div className="relative mx-auto w-32 h-32">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-[#0066FF]/40"
              />
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#0066FF] to-[#003399] flex items-center justify-center shadow-2xl shadow-[#0066FF]/30">
                <span className="text-4xl font-black text-white">{newLevel}</span>
              </div>
            </div>

            {/* Text */}
            <div>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm font-bold text-[#0066FF] uppercase tracking-widest"
              >
                Level Up! 🎉
              </motion.p>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-4xl font-black mt-1"
              >
                Level {newLevel}
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-[#0066FF] font-bold mt-1"
              >
                {title}
              </motion.p>
            </div>

            {/* XP Progress */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="w-full max-w-xs"
            >
              <div className="flex justify-between text-xs text-neutral-500 mb-2">
                <span>Level {newLevel}</span>
                <span>{xpToNext > 0 ? `${xpToNext} XP to Level ${newLevel + 1}` : "Max Level!"}</span>
              </div>
              <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-[#0066FF] rounded-full"
                />
              </div>
            </motion.div>

            {/* CTA */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={onDismiss}
              className="px-10 py-4 bg-[#0066FF] text-white font-black rounded-2xl text-lg"
            >
              Awesome! 💪
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
