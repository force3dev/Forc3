"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AchievementBannerProps {
  achievement: { name: string; icon: string; description?: string } | null;
  onDismiss: () => void;
}

export default function AchievementBanner({ achievement, onDismiss }: AchievementBannerProps) {
  useEffect(() => {
    if (!achievement) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [achievement, onDismiss]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          onClick={onDismiss}
          className="fixed bottom-24 left-4 right-4 z-50 cursor-pointer"
        >
          <div className="bg-[#141414] border border-[#FFD700]/40 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-2xl shadow-black/50">
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center text-2xl flex-shrink-0">
              {achievement.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#FFD700] uppercase tracking-widest">Achievement Unlocked</p>
              <p className="font-bold text-sm mt-0.5 truncate">{achievement.name}</p>
              {achievement.description && (
                <p className="text-xs text-neutral-500 truncate mt-0.5">{achievement.description}</p>
              )}
            </div>
            <div className="text-[#FFD700] text-xl flex-shrink-0">🏆</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
