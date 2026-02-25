"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

interface WorkoutStats {
  duration: number;
  exercises: number;
  sets: number;
  volume: number;
  xpEarned: number;
  streakDay: number;
  prs: { exercise: string; weight: number; reps: number }[];
  levelUp: boolean;
}

function WorkoutCompleteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [stats, setStats] = useState<WorkoutStats | null>(null);

  useEffect(() => {
    // Try getting stats from URL params or localStorage
    const stored = localStorage.getItem("forc3_workout_complete");
    if (stored) {
      try {
        setStats(JSON.parse(stored));
        localStorage.removeItem("forc3_workout_complete");
      } catch { /* ignore */ }
    } else {
      // Fallback from URL params
      setStats({
        duration: parseInt(params.get("duration") || "0"),
        exercises: parseInt(params.get("exercises") || "0"),
        sets: parseInt(params.get("sets") || "0"),
        volume: parseInt(params.get("volume") || "0"),
        xpEarned: parseInt(params.get("xp") || "50"),
        streakDay: parseInt(params.get("streak") || "1"),
        prs: [],
        levelUp: params.get("levelUp") === "true",
      });
    }
  }, [params]);

  const launchConfetti = useCallback(async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      // Initial burst
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      // Side bursts
      setTimeout(() => {
        confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } });
      }, 250);
    } catch { /* confetti not available */ }
  }, []);

  useEffect(() => {
    if (stats) launchConfetti();
  }, [stats, launchConfetti]);

  function formatDuration(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      return `${h}h ${m % 60}m`;
    }
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }

  function formatVolume(vol: number): string {
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
    return vol.toString();
  }

  if (!stats) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      {/* Celebration header */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12, delay: 0.1 }}
        className="text-center mb-8"
      >
        <div className="text-6xl mb-4">
          {stats.levelUp ? "🏆" : "💪"}
        </div>
        <h1 className="text-3xl font-black mb-1">
          {stats.levelUp ? "Level Up!" : "Workout Complete!"}
        </h1>
        <p className="text-neutral-500 text-sm">
          {stats.streakDay > 1 ? `Day ${stats.streakDay} streak` : "Great start"}
        </p>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm grid grid-cols-2 gap-3 mb-6"
      >
        <StatCard label="Duration" value={formatDuration(stats.duration)} icon="⏱" />
        <StatCard label="Exercises" value={stats.exercises.toString()} icon="🏋️" />
        <StatCard label="Sets" value={stats.sets.toString()} icon="✅" />
        <StatCard label="Volume" value={`${formatVolume(stats.volume)} kg`} icon="📊" />
      </motion.div>

      {/* XP earned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="w-full max-w-sm mb-6"
      >
        <div className="bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-2xl p-4 text-center">
          <p className="text-xs font-bold text-[#0066FF] uppercase tracking-wider mb-1">XP Earned</p>
          <p className="text-3xl font-black text-[#0066FF]">+{stats.xpEarned}</p>
        </div>
      </motion.div>

      {/* PRs */}
      {stats.prs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-sm mb-6 space-y-2"
        >
          <p className="text-xs font-bold text-[#FFB300] uppercase tracking-wider px-1">New Personal Records</p>
          {stats.prs.map((pr, i) => (
            <div
              key={i}
              className="bg-[#FFB300]/10 border border-[#FFB300]/30 rounded-2xl p-3 flex items-center gap-3"
            >
              <span className="text-2xl">🏅</span>
              <div>
                <p className="font-semibold text-sm">{pr.exercise}</p>
                <p className="text-xs text-neutral-400">
                  {pr.weight} kg x {pr.reps} reps
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        className="w-full max-w-sm space-y-3"
      >
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full py-4 bg-[#0066FF] text-white font-bold rounded-xl hover:bg-[#0052CC] transition-colors"
        >
          Back to Dashboard
        </button>
        <button
          onClick={() => {
            // Share workout as text
            if (navigator.share) {
              navigator.share({
                title: "FORC3 Workout Complete",
                text: `Just crushed a ${formatDuration(stats.duration)} workout! ${stats.exercises} exercises, ${stats.sets} sets, ${formatVolume(stats.volume)} kg volume. Day ${stats.streakDay} streak 💪`,
              }).catch(() => {});
            }
          }}
          className="w-full py-4 bg-[#141414] border border-[#262626] text-neutral-300 font-semibold rounded-xl text-center hover:bg-[#1a1a1a] transition-colors"
        >
          Share Workout
        </button>
      </motion.div>
    </main>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-center">
      <span className="text-xl">{icon}</span>
      <p className="text-xl font-black mt-1">{value}</p>
      <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function WorkoutCompletePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <WorkoutCompleteContent />
    </Suspense>
  );
}
