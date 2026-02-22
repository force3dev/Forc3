"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useAchievementToast } from "@/hooks/useAchievementToast";

function Toast({
  achievement,
  onDismiss,
}: {
  achievement: { name: string; icon: string; description: string };
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  useEffect(() => {
    navigator.vibrate?.(50);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="fixed bottom-24 left-4 right-4 z-50"
    >
      <div
        onClick={onDismiss}
        className="bg-[#1a1a1a] border border-[#FFB300]/40 rounded-2xl p-4 flex items-center gap-3 shadow-xl cursor-pointer"
      >
        <div className="text-3xl">{achievement.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-[#FFB300] uppercase tracking-wide">Achievement Unlocked!</div>
          <div className="font-semibold text-white text-sm truncate">{achievement.name}</div>
        </div>
        <div className="text-[#FFB300] text-lg">🏆</div>
      </div>
    </motion.div>
  );
}

export default function AchievementToastProvider() {
  const { current, dismiss } = useAchievementToast();

  return (
    <AnimatePresence>
      {current && (
        <Toast key={current.id} achievement={current} onDismiss={dismiss} />
      )}
    </AnimatePresence>
  );
}
