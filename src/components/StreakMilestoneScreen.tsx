"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StreakMilestoneScreenProps {
  show: boolean;
  streak: number;
  onDismiss: () => void;
}

const MILESTONE_DATA: Record<number, { emoji: string; title: string; message: string; color: string }> = {
  7:   { emoji: "🔥", title: "One Week Warrior", message: "7 days straight. You're building a real habit.",  color: "#FF6B00" },
  14:  { emoji: "⚡", title: "Two Week Beast",   message: "14 days. Consistency is your superpower.",        color: "#FFB300" },
  30:  { emoji: "🏆", title: "Monthly Legend",   message: "30 days! You're in elite territory now.",        color: "#0066FF" },
  60:  { emoji: "💎", title: "Diamond Grinder",  message: "60 days of pure commitment. Unstoppable.",       color: "#00C853" },
  100: { emoji: "👑", title: "Century Champion", message: "100 DAYS. You are an absolute machine.",         color: "#FFD700" },
};

export const STREAK_MILESTONES = [7, 14, 30, 60, 100];

export default function StreakMilestoneScreen({ show, streak, onDismiss }: StreakMilestoneScreenProps) {
  const data = MILESTONE_DATA[streak] ?? {
    emoji: "🔥",
    title: `${streak}-Day Streak`,
    message: `${streak} days of consistency. Keep it up!`,
    color: "#FF6B00",
  };

  useEffect(() => {
    if (!show) return;
    if ("vibrate" in navigator) navigator.vibrate([100, 50, 100, 50, 300]);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center px-6 text-center"
          onClick={onDismiss}
        >
          {/* Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-20"
              style={{ backgroundColor: data.color }}
            />
          </div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 280 }}
            className="relative z-10 space-y-6"
            onClick={e => e.stopPropagation()}
          >
            {/* Streak counter */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="relative mx-auto"
            >
              <div className="text-8xl">{data.emoji}</div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white"
                style={{ backgroundColor: data.color }}
              >
                {streak}
              </motion.div>
            </motion.div>

            {/* Text */}
            <div>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: data.color }}
              >
                Streak Milestone 🎉
              </motion.p>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-black mt-2"
              >
                {data.title}
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-neutral-400 text-base mt-2 leading-relaxed"
              >
                {data.message}
              </motion.p>
            </div>

            {/* Streak number display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-baseline justify-center gap-2"
            >
              <span className="text-7xl font-black" style={{ color: data.color }}>{streak}</span>
              <span className="text-2xl text-neutral-400 font-bold">days</span>
            </motion.div>

            {/* CTA */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={onDismiss}
              className="px-10 py-4 text-black font-black rounded-2xl text-lg"
              style={{ backgroundColor: data.color }}
            >
              Keep It Going! 🔥
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
