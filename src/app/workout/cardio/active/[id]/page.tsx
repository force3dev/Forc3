"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CARDIO_TEMPLATES } from "@/lib/cardio-templates";

interface Interval {
  name: string;
  description: string;
  duration: number; // seconds
  intensity: string;
}

interface CardioSession {
  id: string;
  title: string;
  type: string;
  intervals: Interval[];
  totalDuration: number;
}

const INTENSITY_COLORS: Record<string, string> = {
  easy: "#00C853",
  moderate: "#FFB300",
  hard: "#FF4444",
  max: "#CC00FF",
};

const INTENSITY_LABELS: Record<string, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
  max: "Max",
};

// Parse duration string like "1 min" or "90 sec" to seconds
function parseDurationStr(s: string): number {
  if (s.includes("min")) return parseFloat(s) * 60;
  if (s.includes("sec")) return parseFloat(s);
  return 60;
}

function buildSession(templateId: string): CardioSession | null {
  const template = CARDIO_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;

  const intervals: Interval[] = template.intervals?.flatMap(iv => {
    const workSec = parseDurationStr(iv.work);
    const restSec = parseDurationStr(iv.rest);
    const result: Interval[] = [];
    for (let r = 0; r < iv.reps; r++) {
      result.push({
        name: iv.label,
        description: `Rep ${r + 1} of ${iv.reps}`,
        duration: workSec,
        intensity: template.intensity,
      });
      if (restSec > 0 && r < iv.reps - 1) {
        result.push({
          name: "Rest",
          description: iv.rest,
          duration: restSec,
          intensity: "easy",
        });
      }
    }
    return result;
  }) ?? [
    {
      name: template.title,
      description: template.description,
      duration: template.duration * 60,
      intensity: template.intensity,
    },
  ];

  return {
    id: template.id,
    title: template.title,
    type: template.type,
    intervals,
    totalDuration: intervals.reduce((sum, iv) => sum + iv.duration, 0),
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ActiveCardioPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [session] = useState<CardioSession | null>(() => buildSession(templateId));
  const [elapsed, setElapsed] = useState(0);
  const [intervalIdx, setIntervalIdx] = useState(0);
  const [intervalElapsed, setIntervalElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [warnHaptic, setWarnHaptic] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<{ release(): Promise<void> } | null>(null);

  // Wake lock
  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request(type: string): Promise<{ release(): Promise<void> }> } };
    if (nav.wakeLock) {
      nav.wakeLock.request("screen").then(lock => {
        wakeLockRef.current = lock;
      }).catch(() => {});
    }
    return () => { wakeLockRef.current?.release().catch(() => {}); };
  }, []);

  const currentInterval = session?.intervals[intervalIdx] ?? null;
  const intervalRemaining = currentInterval ? currentInterval.duration - intervalElapsed : 0;
  const intervalProgress = currentInterval ? intervalElapsed / currentInterval.duration : 0;

  const advanceInterval = useCallback(() => {
    if (!session) return;
    if (intervalIdx < session.intervals.length - 1) {
      setIntervalIdx(i => i + 1);
      setIntervalElapsed(0);
      // Haptic for new interval
      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
      // Announce via speech
      const next = session.intervals[intervalIdx + 1];
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(`${next.name}. ${next.description}`);
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    } else {
      setFinished(true);
      if ("vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 400]);
    }
  }, [session, intervalIdx]);

  useEffect(() => {
    if (finished || paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsed(e => e + 1);
      setIntervalElapsed(ie => {
        const next = ie + 1;
        if (currentInterval && next >= currentInterval.duration) {
          advanceInterval();
          return 0;
        }
        // Warn at 3 seconds remaining
        if (currentInterval && currentInterval.duration - next === 3 && !warnHaptic) {
          if ("vibrate" in navigator) navigator.vibrate([50, 50, 50]);
          setWarnHaptic(true);
        }
        if (currentInterval && currentInterval.duration - next > 3) {
          setWarnHaptic(false);
        }
        return next;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, finished, currentInterval, advanceInterval, warnHaptic]);

  function endSession() {
    setFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
    // Log cardio
    fetch("/api/cardio/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: session?.type || "run",
        duration: Math.round(elapsed / 60),
        templateId: session?.id,
        name: session?.title,
      }),
    }).catch(() => {});
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-400">Session not found</p>
          <button onClick={() => router.back()} className="mt-4 text-[#0066FF]">← Go Back</button>
        </div>
      </main>
    );
  }

  const intensityColor = INTENSITY_COLORS[currentInterval?.intensity || "moderate"] || "#FFB300";
  const circumference = 2 * Math.PI * 52;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="px-5 pt-10 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">{session.type}</p>
          <h1 className="text-lg font-bold">{session.title}</h1>
        </div>
        <button
          onClick={endSession}
          className="px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-bold rounded-xl"
        >
          End
        </button>
      </header>

      {/* Total timer */}
      <div className="text-center py-2">
        <div className="text-4xl font-black tabular-nums">{formatTime(elapsed)}</div>
        <p className="text-xs text-neutral-500 mt-1">total elapsed</p>
      </div>

      {/* Current interval card */}
      <div className="flex-1 px-5 py-4 space-y-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={intervalIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#141414] border rounded-3xl p-5 space-y-4"
            style={{ borderColor: `${intensityColor}40` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: intensityColor }}>
                  {INTENSITY_LABELS[currentInterval?.intensity || "moderate"]}
                </p>
                <h2 className="text-xl font-black mt-0.5">{currentInterval?.name}</h2>
                <p className="text-sm text-neutral-400 mt-1 leading-relaxed">{currentInterval?.description}</p>
              </div>
              {/* Progress ring */}
              <div className="relative flex-shrink-0 ml-4">
                <svg width="120" height="120" className="-rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#1a1a1a" strokeWidth="8" />
                  <motion.circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={intensityColor} strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - intervalProgress)}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                  <span className="text-xl font-black tabular-nums">{formatTime(intervalRemaining)}</span>
                  <span className="text-[10px] text-neutral-500">left</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: intensityColor }}
                animate={{ width: `${intervalProgress * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Interval list */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl divide-y divide-[#1a1a1a]">
          <div className="px-4 py-3">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">All Intervals</p>
          </div>
          {session.intervals.map((iv, i) => (
            <div
              key={i}
              className={`px-4 py-3 flex items-center justify-between transition-colors ${
                i === intervalIdx ? "bg-[#141414]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                {i < intervalIdx ? (
                  <span className="text-[#00C853] text-sm">✅</span>
                ) : i === intervalIdx ? (
                  <span className="text-base">→</span>
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-[#333] flex-shrink-0" />
                )}
                <span className={`text-sm ${i === intervalIdx ? "text-white font-semibold" : i < intervalIdx ? "text-neutral-600" : "text-neutral-400"}`}>
                  {iv.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: INTENSITY_COLORS[iv.intensity] || "#888" }}
                />
                <span className="text-xs text-neutral-500">{formatTime(iv.duration)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 pb-10 flex gap-3">
        <button
          onClick={() => setPaused(p => !p)}
          className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${
            paused
              ? "bg-[#00C853] text-black"
              : "bg-[#141414] border border-[#262626] text-white"
          }`}
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <button
          onClick={advanceInterval}
          className="px-6 py-4 bg-[#141414] border border-[#262626] rounded-2xl font-bold text-sm text-neutral-400 hover:text-white transition-colors"
        >
          Skip ⏭
        </button>
      </div>

      {/* Finished overlay */}
      <AnimatePresence>
        {finished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center px-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-6 max-w-xs"
            >
              <div className="text-6xl">🏁</div>
              <div>
                <h2 className="text-3xl font-black">Session Complete!</h2>
                <p className="text-neutral-400 mt-2">Great work, Coach Alex is proud.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
                  <div className="text-2xl font-black text-[#0066FF]">{formatTime(elapsed)}</div>
                  <div className="text-xs text-neutral-500 mt-1">Total Time</div>
                </div>
                <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
                  <div className="text-2xl font-black text-[#00C853]">{session.intervals.length}</div>
                  <div className="text-xs text-neutral-500 mt-1">Intervals</div>
                </div>
              </div>
              <div className="space-y-3 w-full">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full py-4 bg-[#0066FF] text-white font-black rounded-2xl"
                >
                  Done
                </button>
                <button
                  onClick={() => router.push("/progress")}
                  className="w-full py-3 text-neutral-500 text-sm"
                >
                  View Progress
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
