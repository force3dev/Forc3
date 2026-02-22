"use client";
import { useEffect, useRef } from "react";

interface Props {
  duration: number; // seconds
  totalVolume: number;
  totalSets: number;
  prCount: number;
  newAchievements?: { name: string; icon: string; xpReward: number }[];
  onClose: () => void;
}

export default function WorkoutCompleteScreen({
  duration,
  totalVolume,
  totalSets,
  prCount,
  newAchievements = [],
  onClose,
}: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    // Dynamically load canvas-confetti
    import("canvas-confetti").then(({ default: confetti }) => {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#0066FF", "#00C853", "#FFB300"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#0066FF", "#00C853", "#FFB300"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    });
  }, []);

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4">🏆</div>
      <h1 className="text-3xl font-bold mb-2">Workout Complete!</h1>
      <p className="text-neutral-400 mb-8">Great work — keep showing up</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
          <div className="text-2xl font-bold tabular-nums">{mins}:{String(secs).padStart(2, "0")}</div>
          <div className="text-xs text-neutral-500 mt-1">Duration</div>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
          <div className="text-2xl font-bold tabular-nums">
            {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
          </div>
          <div className="text-xs text-neutral-500 mt-1">lbs lifted</div>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
          <div className="text-2xl font-bold tabular-nums">{totalSets}</div>
          <div className="text-xs text-neutral-500 mt-1">Sets done</div>
        </div>
      </div>

      {/* PRs */}
      {prCount > 0 && (
        <div className="mb-6 px-5 py-3 bg-[#FFB300]/10 border border-[#FFB300]/30 rounded-2xl">
          <p className="text-[#FFB300] font-bold">
            🎯 {prCount} new personal record{prCount !== 1 ? "s" : ""}!
          </p>
        </div>
      )}

      {/* New achievements */}
      {newAchievements.length > 0 && (
        <div className="w-full max-w-sm mb-6">
          <p className="text-sm text-neutral-400 mb-3">New achievements unlocked!</p>
          <div className="space-y-2">
            {newAchievements.map(a => (
              <div key={a.name} className="flex items-center gap-3 bg-[#141414] border border-[#262626] rounded-xl p-3">
                <span className="text-2xl">{a.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-sm">{a.name}</div>
                </div>
                <div className="text-[#FFB300] text-sm font-bold">+{a.xpReward} XP</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full max-w-sm py-4 bg-[#0066FF] text-white font-bold rounded-2xl hover:bg-[#0052CC] transition-colors"
      >
        Done
      </button>
    </div>
  );
}
