"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { haptics } from "@/lib/haptics";
import { calculatePlates } from "@/lib/calculations/plateCalculator";
import { getVoiceCoach } from "@/lib/voice-coach";
import { generateStoryCard } from "@/lib/workout-card-generator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExerciseSet {
  setNumber: number;
  targetReps: number;
  weight: number;
  reps: number;
  completed: boolean;
  rpe?: number;
  previousWeight?: number;
  previousReps?: number;
}

interface ActiveExercise {
  planExerciseId: string;
  exerciseId: string;
  name: string;
  muscleGroup?: string;
  sets: ExerciseSet[];
  notes: string;
  restSeconds: number;
}

interface WorkoutState {
  workoutId: string;
  workoutName: string;
  logId: string | null;
  exercises: ActiveExercise[];
  startedAt: string;
}

const STORAGE_KEY = "forc3_active_workout";

// ─── Plate Math Display ──────────────────────────────────────────────────────

function PlateMath({ weight }: { weight: number }) {
  if (weight < 45) return null;
  const breakdown = calculatePlates(weight, "lbs");
  if (breakdown.platesPerSide.length === 0) return null;

  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-[9px] text-neutral-600">Per side:</span>
      {breakdown.platesPerSide.map((p, i) => (
        <span key={i} className="text-[9px] bg-[#1a1a1a] px-1.5 py-0.5 rounded text-neutral-400">
          {p.count > 1 ? `${p.count}×` : ""}{p.weight}
        </span>
      ))}
    </div>
  );
}

// ─── Rest Timer ──────────────────────────────────────────────────────────────

function RestTimerOverlay({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const [total, setTotal] = useState(seconds);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    if (remaining <= 0) { haptics.timerComplete(); onDone(); return; }
    const t = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(t);
  }, [remaining, dismissed, onDone]);

  useEffect(() => {
    if (remaining === 3) haptics.medium();
  }, [remaining]);

  if (dismissed) return null;

  const pct = (total - remaining) / total;
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference * (1 - pct);
  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const color = remaining > total * 0.3 ? "#22c55e" : remaining > total * 0.1 ? "#f59e0b" : "#ef4444";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-28 left-4 right-4 z-40"
    >
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 shadow-2xl flex items-center gap-5">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#1a1a1a" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={color} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-white">
            {minutes > 0 ? `${minutes}:${secs.toString().padStart(2, "0")}` : secs}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wide">Rest Time</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { setRemaining(r => r + 30); setTotal(t => t + 30); }}
              className="bg-[#1a1a1a] text-white text-xs px-3 py-1.5 rounded-xl font-medium"
            >
              +30s
            </button>
            <button
              onClick={() => { setDismissed(true); onDone(); }}
              className="bg-[#1a1a1a] text-[#00C853] text-xs px-3 py-1.5 rounded-xl font-medium"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Set Row ─────────────────────────────────────────────────────────────────

function RpePicker({ onSelect }: { onSelect: (rpe: number) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-1 mt-1.5 ml-9"
    >
      <span className="text-[10px] text-neutral-500">RPE:</span>
      {[6, 7, 8, 9, 10].map(rpe => (
        <button
          key={rpe}
          onClick={() => { haptics.light(); onSelect(rpe); }}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
            rpe <= 7 ? "bg-[#1a1a1a] text-neutral-400 hover:bg-[#262626]" :
            rpe === 8 ? "bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25" :
            "bg-red-500/15 text-red-400 hover:bg-red-500/25"
          }`}
        >
          {rpe}
        </button>
      ))}
    </motion.div>
  );
}

function SetRow({
  set, exerciseIdx, setIdx, onComplete, onWeightChange, onRepsChange, onRpeSelect, showRpePicker,
}: {
  set: ExerciseSet;
  exerciseIdx: number;
  setIdx: number;
  onComplete: (exIdx: number, sIdx: number) => void;
  onWeightChange: (exIdx: number, sIdx: number, val: number) => void;
  onRepsChange: (exIdx: number, sIdx: number, val: number) => void;
  onRpeSelect: (exIdx: number, sIdx: number, rpe: number) => void;
  showRpePicker: boolean;
}) {
  return (
    <div>
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: setIdx * 0.04 }}
      className={`flex items-center gap-2 py-2.5 px-3 rounded-xl transition-colors ${
        set.completed ? "bg-[#00C853]/5 border border-[#00C853]/20" : "bg-[#0a0a0a] border border-[#1a1a1a]"
      }`}
    >
      {/* Set number */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        set.completed ? "bg-[#00C853] text-black" : "bg-[#1a1a1a] text-neutral-500"
      }`}>
        {set.completed ? "\u2713" : set.setNumber}
      </div>

      {/* Previous performance */}
      {set.previousWeight != null && set.previousWeight > 0 && !set.completed && (
        <div className="text-[10px] text-neutral-600 flex-shrink-0 w-12 text-center">
          {set.previousWeight}×{set.previousReps}
        </div>
      )}

      {/* Weight */}
      <div className="flex-1 flex items-center gap-1">
        <button
          onClick={() => onWeightChange(exerciseIdx, setIdx, Math.max(0, set.weight - 5))}
          className="w-7 h-7 rounded-lg bg-[#1a1a1a] text-neutral-400 text-sm font-bold flex items-center justify-center"
        >
          {"\u2212"}
        </button>
        <input
          type="number"
          value={set.weight}
          onChange={e => onWeightChange(exerciseIdx, setIdx, parseFloat(e.target.value) || 0)}
          className="w-14 text-center bg-transparent text-sm font-bold focus:outline-none"
        />
        <button
          onClick={() => onWeightChange(exerciseIdx, setIdx, set.weight + 5)}
          className="w-7 h-7 rounded-lg bg-[#1a1a1a] text-neutral-400 text-sm font-bold flex items-center justify-center"
        >
          +
        </button>
        <span className="text-[10px] text-neutral-600">lbs</span>
      </div>

      {/* Reps */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onRepsChange(exerciseIdx, setIdx, Math.max(1, set.reps - 1))}
          className="w-7 h-7 rounded-lg bg-[#1a1a1a] text-neutral-400 text-sm font-bold flex items-center justify-center"
        >
          {"\u2212"}
        </button>
        <input
          type="number"
          value={set.reps}
          onChange={e => onRepsChange(exerciseIdx, setIdx, parseInt(e.target.value) || 0)}
          className="w-10 text-center bg-transparent text-sm font-bold focus:outline-none"
        />
        <button
          onClick={() => onRepsChange(exerciseIdx, setIdx, set.reps + 1)}
          className="w-7 h-7 rounded-lg bg-[#1a1a1a] text-neutral-400 text-sm font-bold flex items-center justify-center"
        >
          +
        </button>
        <span className="text-[10px] text-neutral-600">reps</span>
      </div>

      {/* Complete button */}
      <button
        onClick={() => onComplete(exerciseIdx, setIdx)}
        disabled={set.completed}
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
          set.completed
            ? "bg-[#00C853] text-black cursor-default"
            : "bg-[#0066FF] text-white hover:bg-[#0052CC] active:scale-95"
        }`}
      >
        {set.completed ? "\u2713" : "\u2192"}
      </button>
    </motion.div>
    <AnimatePresence>
      {showRpePicker && set.completed && !set.rpe && (
        <RpePicker onSelect={(rpe) => onRpeSelect(exerciseIdx, setIdx, rpe)} />
      )}
    </AnimatePresence>
    {set.rpe && (
      <div className="ml-9 mt-0.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
          set.rpe <= 7 ? "bg-[#1a1a1a] text-neutral-500" :
          set.rpe === 8 ? "bg-yellow-500/10 text-yellow-500" :
          "bg-red-500/10 text-red-500"
        }`}>RPE {set.rpe}</span>
      </div>
    )}
    </div>
  );
}

// ─── Exercise Card ───────────────────────────────────────────────────────────

function ExerciseCard({
  exercise, exerciseIdx, isActive, onComplete, onWeightChange, onRepsChange, onActivate, onNotesChange, onRpeSelect, lastCompletedSet,
}: {
  exercise: ActiveExercise;
  exerciseIdx: number;
  isActive: boolean;
  onComplete: (exIdx: number, sIdx: number) => void;
  onWeightChange: (exIdx: number, sIdx: number, val: number) => void;
  onRepsChange: (exIdx: number, sIdx: number, val: number) => void;
  onActivate: () => void;
  onNotesChange: (exIdx: number, notes: string) => void;
  onRpeSelect: (exIdx: number, sIdx: number, rpe: number) => void;
  lastCompletedSet: { exIdx: number; sIdx: number } | null;
}) {
  const completedSets = exercise.sets.filter(s => s.completed).length;
  const allDone = completedSets === exercise.sets.length;
  const currentWeight = exercise.sets[0]?.weight || 0;

  return (
    <div
      className={`rounded-2xl border transition-all ${
        allDone ? "border-[#00C853]/30 bg-[#00C853]/5" :
        isActive ? "border-[#0066FF]/50 bg-[#0066FF]/5" :
        "border-[#262626] bg-[#141414]"
      }`}
    >
      <button onClick={onActivate} className="w-full flex items-center justify-between p-4">
        <div className="text-left">
          <div className="font-bold text-sm">{exercise.name}</div>
          {exercise.muscleGroup && (
            <div className="text-xs text-neutral-500 mt-0.5 capitalize">{exercise.muscleGroup}</div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            allDone ? "bg-[#00C853]/20 text-[#00C853]" : "bg-[#1a1a1a] text-neutral-400"
          }`}>
            {completedSets}/{exercise.sets.length} sets
          </div>
          <span className={`text-neutral-400 text-xs transition-transform ${isActive ? "rotate-180" : ""}`}>{"\u25BC"}</span>
        </div>
      </button>

      {isActive && (
        <div className="px-4 pb-4 space-y-2">
          {/* Plate math */}
          {currentWeight >= 45 && (
            <div className="px-3 mb-1">
              <PlateMath weight={currentWeight} />
            </div>
          )}

          {/* Header labels */}
          <div className="flex items-center gap-2 px-3 mb-1">
            <div className="w-7" />
            <div className="flex-1 text-center text-[10px] text-neutral-600 uppercase tracking-wide">Weight</div>
            <div className="text-[10px] text-neutral-600 uppercase tracking-wide w-28 text-center">Reps</div>
            <div className="w-9" />
          </div>

          {exercise.sets.map((set, sIdx) => (
            <SetRow
              key={sIdx}
              set={set}
              exerciseIdx={exerciseIdx}
              setIdx={sIdx}
              onComplete={onComplete}
              onWeightChange={onWeightChange}
              onRepsChange={onRepsChange}
              onRpeSelect={onRpeSelect}
              showRpePicker={lastCompletedSet?.exIdx === exerciseIdx && lastCompletedSet?.sIdx === sIdx}
            />
          ))}

          {/* Notes field */}
          <input
            type="text"
            placeholder="Add notes..."
            value={exercise.notes}
            onChange={e => onNotesChange(exerciseIdx, e.target.value)}
            className="w-full mt-2 px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-xs text-neutral-400 placeholder:text-neutral-700 focus:outline-none focus:border-[#0066FF]/50"
          />
        </div>
      )}
    </div>
  );
}

// ─── Warm-Up Auto Loader ─────────────────────────────────────────────────────

const COMPOUND_PATTERNS = ["bench", "squat", "deadlift", "overhead press", "ohp", "barbell row", "military press"];

function isCompoundLift(name: string): boolean {
  const lower = name.toLowerCase();
  return COMPOUND_PATTERNS.some(p => lower.includes(p));
}

function generateWarmup(workingWeight: number): Array<{ weight: number; reps: number; label: string }> {
  if (workingWeight <= 45) return [];
  const sets = [];
  sets.push({ weight: 45, reps: 10, label: "Empty bar" });
  if (workingWeight > 95) sets.push({ weight: Math.round(workingWeight * 0.5 / 5) * 5, reps: 8, label: "~50%" });
  if (workingWeight > 135) sets.push({ weight: Math.round(workingWeight * 0.7 / 5) * 5, reps: 5, label: "~70%" });
  if (workingWeight > 185) sets.push({ weight: Math.round(workingWeight * 0.85 / 5) * 5, reps: 3, label: "~85%" });
  if (workingWeight > 225) sets.push({ weight: Math.round(workingWeight * 0.95 / 5) * 5, reps: 1, label: "~95%" });
  return sets;
}

function WarmUpCard({ exerciseName, workingWeight, onDismiss }: { exerciseName: string; workingWeight: number; onDismiss: () => void }) {
  const warmupSets = generateWarmup(workingWeight);
  if (warmupSets.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[#141414] border border-[#262626] rounded-2xl p-4 mb-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Warm-Up Suggestion</p>
          <p className="text-sm font-bold mt-0.5">{exerciseName} {"\u2192"} {workingWeight} lbs</p>
        </div>
        <button onClick={onDismiss} className="text-neutral-600 text-xs px-3 py-1.5 bg-[#1a1a1a] rounded-lg">
          Dismiss
        </button>
      </div>
      <div className="space-y-1.5">
        {warmupSets.map((s, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5 px-3 bg-[#0a0a0a] rounded-xl">
            <span className="text-[10px] text-neutral-600 w-10">{s.label}</span>
            <span className="text-sm font-bold text-white flex-1">{s.weight} lbs</span>
            <span className="text-xs text-neutral-400">{"\u00D7"} {s.reps} reps</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Workout Complete Screen ─────────────────────────────────────────────────

function WorkoutCompleteScreen({
  workoutName, duration, totalSets, totalVolume, exerciseCount, onFinish,
}: {
  workoutName: string;
  duration: number;
  totalSets: number;
  totalVolume: number;
  exerciseCount: number;
  onFinish: () => void;
}) {
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    haptics.workoutComplete();
    // Fire confetti
    import("canvas-confetti").then(mod => {
      const confetti = mod.default;
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 50, spread: 120, origin: { y: 0.4 } }), 300);
    }).catch(() => {});
  }, []);

  async function handleShare() {
    setSharing(true);
    try {
      const dataUrl = await generateStoryCard({
        duration,
        volume: totalVolume,
        prs: [],
        streak: 0,
        userName: "athlete",
      });
      // Convert data URL to blob for sharing/download
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "forc3-workout.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "FORC3 Workout" });
          setSharing(false);
          return;
        }
      }

      // Fallback: download
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "forc3-workout.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch { /* ignore share cancel */ }
    setSharing(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center px-6 text-center"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00C853]/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        className="relative z-10 space-y-6 w-full max-w-sm"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: 2, duration: 0.5 }}
          className="text-6xl"
        >
          {"\u{1F3C6}"}
        </motion.div>

        <div>
          <p className="text-xs font-bold text-[#00C853] uppercase tracking-widest">Workout Complete!</p>
          <h1 className="text-3xl font-black mt-1">{workoutName}</h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Duration", value: `${duration}m`, icon: "\u23F1" },
            { label: "Exercises", value: exerciseCount, icon: "\u{1F3CB}\uFE0F" },
            { label: "Sets Done", value: totalSets, icon: "\u{1F4AA}" },
            { label: "Volume", value: `${(totalVolume / 1000).toFixed(1)}k lbs`, icon: "\u{1F4CA}" },
          ].map(s => (
            <div key={s.label} className="bg-[#141414] border border-[#262626] rounded-xl p-3">
              <div className="text-xl">{s.icon}</div>
              <div className="text-xl font-black mt-1">{s.value}</div>
              <div className="text-xs text-neutral-500">{s.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={handleShare}
          disabled={sharing}
          className="w-full py-3.5 bg-[#141414] border border-[#262626] text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
        >
          {sharing ? "Generating..." : <>{"\u{1F4F8}"} Share Workout Card</>}
        </button>

        <button
          onClick={onFinish}
          className="w-full py-4 bg-[#00C853] text-black font-black rounded-2xl text-lg"
        >
          Done!
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const workoutId = params.id as string;

  const [state, setState] = useState<WorkoutState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState(0);
  const [showRest, setShowRest] = useState(false);
  const [restSeconds, setRestSeconds] = useState(90);
  const [showComplete, setShowComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastCompletedSet, setLastCompletedSet] = useState<{ exIdx: number; sIdx: number } | null>(null);
  const [warmupDismissed, setWarmupDismissed] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const exerciseRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // ── Screen Wake Lock ──
  useEffect(() => {
    async function acquireWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        }
      } catch { /* ignore */ }
    }
    acquireWakeLock();
    return () => { wakeLockRef.current?.release().catch(() => {}); };
  }, []);

  // ── Elapsed timer ──
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const elapsedMin = Math.floor(elapsedSeconds / 60);
  const elapsedSec = elapsedSeconds % 60;
  const elapsedDisplay = `${elapsedMin}:${String(elapsedSec).padStart(2, "0")}`;

  // ── Persist state to localStorage ──
  useEffect(() => {
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, elapsed: elapsedSeconds }));
    }
  }, [state, elapsedSeconds]);

  // ── Load workout (or resume from localStorage) ──
  useEffect(() => {
    async function loadWorkout() {
      // Try resuming from localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.workoutId === workoutId) {
            setState(parsed);
            setElapsedSeconds(parsed.elapsed || 0);
            setLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }

      try {
        const res = await fetch(`/api/workouts/today`);
        const data = await res.json();
        const workout = data.workout;
        if (!workout) { setError("Workout not found"); setLoading(false); return; }

        const logRes = await fetch("/api/workouts/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workoutId: workout.id }),
        });
        const logData = await logRes.json();

        const exercises: ActiveExercise[] = (workout.exercises || []).map((ex: any) => ({
          planExerciseId: ex.id,
          exerciseId: ex.exerciseId,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          restSeconds: ex.restSeconds || parseInt(localStorage.getItem("forc3_rest_timer") || "90"),
          notes: "",
          sets: Array.from({ length: ex.sets }, (_, i) => ({
            setNumber: i + 1,
            targetReps: ex.repsMin,
            weight: ex.lastWeight || 0,
            reps: ex.repsMin,
            completed: false,
            previousWeight: ex.lastWeight || 0,
            previousReps: ex.lastReps || ex.repsMin,
          })),
        }));

        setState({
          workoutId: workout.id,
          workoutName: workout.name,
          logId: logData.logId || null,
          exercises,
          startedAt: new Date().toISOString(),
        });
      } catch {
        setError("Failed to load workout");
      } finally {
        setLoading(false);
      }
    }
    loadWorkout();
  }, [workoutId]);

  // ── Voice coach ──
  const voice = useRef<ReturnType<typeof getVoiceCoach> | null>(null);
  useEffect(() => {
    voice.current = getVoiceCoach();
    return () => { voice.current?.stop(); };
  }, []);

  const handleCompleteSet = useCallback((exIdx: number, sIdx: number) => {
    setState(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.exercises = [...prev.exercises];
      updated.exercises[exIdx] = { ...prev.exercises[exIdx] };
      updated.exercises[exIdx].sets = [...prev.exercises[exIdx].sets];
      updated.exercises[exIdx].sets[sIdx] = { ...prev.exercises[exIdx].sets[sIdx], completed: true };

      haptics.success();
      setLastCompletedSet({ exIdx, sIdx });

      // Voice cues
      const exercise = updated.exercises[exIdx];
      const completedCount = exercise.sets.filter(s => s.completed).length;
      const isLastSet = completedCount === exercise.sets.length;

      if (isLastSet && exIdx < updated.exercises.length - 1) {
        // Auto-scroll to next exercise
        setTimeout(() => {
          setActiveExercise(exIdx + 1);
          exerciseRefs.current[exIdx + 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 500);
      }

      if (sIdx === exercise.sets.length - 2) {
        voice.current?.announceLastSet();
      }

      // Start rest timer
      setRestSeconds(prev.exercises[exIdx].restSeconds);
      setShowRest(true);
      voice.current?.announceRestPeriod(prev.exercises[exIdx].restSeconds);

      return updated;
    });
  }, []);

  const handleWeightChange = useCallback((exIdx: number, sIdx: number, val: number) => {
    setState(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.exercises = [...prev.exercises];
      updated.exercises[exIdx] = { ...prev.exercises[exIdx] };
      updated.exercises[exIdx].sets = [...prev.exercises[exIdx].sets];
      updated.exercises[exIdx].sets[sIdx] = { ...prev.exercises[exIdx].sets[sIdx], weight: val };
      return updated;
    });
  }, []);

  const handleRepsChange = useCallback((exIdx: number, sIdx: number, val: number) => {
    setState(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.exercises = [...prev.exercises];
      updated.exercises[exIdx] = { ...prev.exercises[exIdx] };
      updated.exercises[exIdx].sets = [...prev.exercises[exIdx].sets];
      updated.exercises[exIdx].sets[sIdx] = { ...prev.exercises[exIdx].sets[sIdx], reps: val };
      return updated;
    });
  }, []);

  const handleRpeSelect = useCallback((exIdx: number, sIdx: number, rpe: number) => {
    setState(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.exercises = [...prev.exercises];
      updated.exercises[exIdx] = { ...prev.exercises[exIdx] };
      updated.exercises[exIdx].sets = [...prev.exercises[exIdx].sets];
      updated.exercises[exIdx].sets[sIdx] = { ...prev.exercises[exIdx].sets[sIdx], rpe };
      return updated;
    });
    setLastCompletedSet(null);
  }, []);

  const handleNotesChange = useCallback((exIdx: number, notes: string) => {
    setState(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.exercises = [...prev.exercises];
      updated.exercises[exIdx] = { ...prev.exercises[exIdx], notes };
      return updated;
    });
  }, []);

  async function finishWorkout() {
    if (!state) return;
    setSaving(true);

    const allSets = state.exercises.flatMap(ex =>
      ex.sets.filter(s => s.completed).map(s => ({
        exerciseId: ex.exerciseId,
        planExerciseId: ex.planExerciseId,
        setNumber: s.setNumber,
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe || undefined,
        completed: true,
      }))
    );
    const totalVolume = allSets.reduce((sum, s) => sum + s.weight * s.reps, 0);

    try {
      await fetch("/api/workouts/log", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId: state.logId,
          sets: allSets,
          duration: elapsedMin,
          totalVolume,
          completedAt: new Date().toISOString(),
        }),
      });
    } catch { /* save best effort */ }

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);

    setSaving(false);
    setShowComplete(true);
    if (timerRef.current) clearInterval(timerRef.current);
    voice.current?.announceWorkoutComplete();
    wakeLockRef.current?.release().catch(() => {});
  }

  const allCompleted = state?.exercises.every(ex => ex.sets.every(s => s.completed));
  const totalSets = state?.exercises.flatMap(ex => ex.sets.filter(s => s.completed)).length || 0;
  const totalVolume = state?.exercises.flatMap(ex => ex.sets.filter(s => s.completed)).reduce((sum, s) => sum + s.weight * s.reps, 0) || 0;
  const completedExercises = state?.exercises.filter(ex => ex.sets.every(s => s.completed)).length || 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (error || !state) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="text-4xl">{"\u26A0\uFE0F"}</div>
        <h2 className="text-xl font-bold">{error || "Something went wrong"}</h2>
        <button onClick={() => router.back()} className="px-6 py-3 bg-[#0066FF] rounded-xl font-bold">
          Go Back
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white pb-32">
      {/* Header */}
      <header className="px-5 pt-8 pb-4 border-b border-[#1a1a1a] sticky top-0 bg-black/95 backdrop-blur-sm z-30">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm("Quit workout? Your progress is saved locally and you can resume later.")) {
                router.back();
              }
            }}
            className="text-neutral-400 text-sm"
          >
            {"\u2715"} Quit
          </button>

          <div className="text-center">
            <div className="font-bold text-sm">{state.workoutName}</div>
            <div className="text-xs text-neutral-500">
              {completedExercises}/{state.exercises.length} exercises {"\u00B7"} {elapsedDisplay}
            </div>
          </div>

          <button
            onClick={finishWorkout}
            disabled={saving}
            className={`text-sm font-bold px-4 py-2 rounded-xl transition-colors ${
              allCompleted ? "bg-[#00C853] text-black" : "bg-[#0066FF] text-white"
            }`}
          >
            {saving ? "..." : "Finish"}
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0066FF] rounded-full transition-all"
            style={{ width: `${state.exercises.length > 0 ? (completedExercises / state.exercises.length) * 100 : 0}%` }}
          />
        </div>
      </header>

      {/* Quick stats bar */}
      <div className="flex border-b border-[#1a1a1a]">
        {[
          { label: "Sets", value: totalSets },
          { label: "Volume", value: `${(totalVolume / 1000).toFixed(1)}k` },
          { label: "Time", value: elapsedDisplay },
        ].map(s => (
          <div key={s.label} className="flex-1 text-center py-2.5 border-r border-[#1a1a1a] last:border-0">
            <div className="font-bold text-sm">{s.value}</div>
            <div className="text-[10px] text-neutral-600">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pre-workout visualization prompt */}
      {!state.exercises.some(e => e.sets.some(s => s.completed)) && (
        <div className="text-center py-3 border-b border-[#1a1a1a]">
          <a href="/mental/visualize?type=strength" className="text-purple-400 text-sm font-medium">
            🧠 30s visualization before you start →
          </a>
        </div>
      )}

      {/* Exercise list */}
      <div className="px-4 py-4 space-y-3">
        {/* Warm-up suggestion for compound lifts */}
        <AnimatePresence>
          {!warmupDismissed && state.exercises.length > 0 && isCompoundLift(state.exercises[0].name) && state.exercises[0].sets[0]?.weight > 45 && !state.exercises[0].sets[0]?.completed && (
            <WarmUpCard
              exerciseName={state.exercises[0].name}
              workingWeight={state.exercises[0].sets[0].weight}
              onDismiss={() => setWarmupDismissed(true)}
            />
          )}
        </AnimatePresence>

        {state.exercises.map((exercise, exIdx) => (
          <div key={exercise.planExerciseId} ref={el => { exerciseRefs.current[exIdx] = el; }}>
            <ExerciseCard
              exercise={exercise}
              exerciseIdx={exIdx}
              isActive={activeExercise === exIdx}
              onComplete={handleCompleteSet}
              onWeightChange={handleWeightChange}
              onRepsChange={handleRepsChange}
              onActivate={() => setActiveExercise(exIdx)}
              onNotesChange={handleNotesChange}
              onRpeSelect={handleRpeSelect}
              lastCompletedSet={lastCompletedSet}
            />
          </div>
        ))}
      </div>

      {/* Finish CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-black/95 backdrop-blur-sm border-t border-[#1a1a1a]">
        <button
          onClick={finishWorkout}
          disabled={saving}
          className={`w-full py-4 font-black rounded-2xl text-lg transition-all ${
            allCompleted ? "bg-[#00C853] text-black" : "bg-[#0066FF] text-white"
          } disabled:opacity-50`}
        >
          {saving ? "Saving..." : allCompleted ? "Complete Workout \u{1F3C6}" : "Finish Early"}
        </button>
      </div>

      {/* Rest Timer */}
      <AnimatePresence>
        {showRest && (
          <RestTimerOverlay
            seconds={restSeconds}
            onDone={() => setShowRest(false)}
          />
        )}
      </AnimatePresence>

      {/* Workout Complete Screen */}
      {showComplete && (
        <WorkoutCompleteScreen
          workoutName={state.workoutName}
          duration={elapsedMin}
          totalSets={totalSets}
          totalVolume={totalVolume}
          exerciseCount={completedExercises}
          onFinish={() => {
            localStorage.removeItem(STORAGE_KEY);
            router.push("/dashboard");
          }}
        />
      )}
    </main>
  );
}
