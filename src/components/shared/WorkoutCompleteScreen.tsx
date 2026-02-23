"use client";
import { useEffect } from "react";

interface Props {
  duration: number; // seconds
  totalVolume: number;
  totalSets: number;
  prCount: number;
  newAchievements?: { name: string; icon: string; xpReward: number }[];
  onClose: () => void;
}

export default function WorkoutCompleteScreen({
  prCount,
  newAchievements = [],
  onClose,
}: Props) {
  // Auto-dismiss after 2 seconds
  useEffect(() => {
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-[#141414] border border-[#00C853]/40 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-lg shadow-black/60">
        {/* Green checkmark */}
        <div className="w-10 h-10 rounded-full bg-[#00C853]/20 border border-[#00C853]/50 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-[#00C853]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-white">Workout Complete! 💪</p>
          <p className="text-xs text-neutral-400 mt-0.5">
            {prCount > 0 ? `${prCount} new PR${prCount !== 1 ? "s" : ""}` : "Great work — keep showing up"}
            {newAchievements.length > 0 ? ` · ${newAchievements.length} achievement${newAchievements.length !== 1 ? "s" : ""}` : ""}
          </p>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
          <div
            className="h-full bg-[#00C853] animate-shrink"
            style={{ animationDuration: "2s", animationTimingFunction: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}
