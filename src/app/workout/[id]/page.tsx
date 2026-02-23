"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { calculatePlates } from "@/lib/calculations/plateCalculator";
import WorkoutCompleteScreen from "@/components/shared/WorkoutCompleteScreen";
import { ExerciseDetailModal } from "@/components/workout/ExerciseDetailModal";
import { WorkoutShareCard } from "@/components/WorkoutShareCard";
import { PRShareCard } from "@/components/PRShareCard";
import { haptics } from "@/lib/haptics";
import { celebrateWorkout, celebratePR } from "@/lib/confetti";
import { getVoiceCoach } from "@/lib/voice-coach";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoggedSet {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  isPR?: boolean;
  logged: boolean;
}

interface Exercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  rpe?: number;
  restSeconds: number;
  muscleGroups: string[];
  gifUrl?: string | null;
  secondaryMuscles?: string;
  formTips?: string;
  commonMistakes?: string;
  coachingCues?: string;
  alternatives?: string;
  instructions?: string | null;
  category?: string;
  lastWeight: number | null;
  lastSets: { reps: number; weight: number }[];
  suggestedWeight: number | null;
  progressionBadge: string | null;
  progressionReason: string | null;
  loggedSets: LoggedSet[];
}

interface WorkoutData {
  id: string;
  name: string;
  exercises: Exercise[];
  coachingNotes?: string[];
}

// ─── Rest Timer Component ─────────────────────────────────────────────────────

function RestTimer({
  seconds,
  onDone,
}: {
  seconds: number;
  onDone: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(interval);
          setRunning(false);
          onDone();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, onDone]);

  const pct = ((seconds - remaining) / seconds) * 100;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6">
      <div className="w-full max-w-xs text-center space-y-6">
        <p className="text-neutral-400 text-sm uppercase tracking-widest">Rest</p>
        <div className="relative w-40 h-40 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="#1a1a1a" strokeWidth="8" />
            <circle
              cx="80" cy="80" r="70" fill="none"
              stroke="#0066FF" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 70}`}
              strokeDashoffset={`${2 * Math.PI * 70 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold tabular-nums">
              {mins}:{secs.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setRemaining(r => Math.max(0, r - 30)); }}
            className="flex-1 py-3 bg-[#1a1a1a] rounded-xl text-sm"
          >
            −30s
          </button>
          <button
            onClick={() => { setRunning(false); onDone(); }}
            className="flex-1 py-3 bg-[#0066FF] rounded-xl font-semibold"
          >
            Skip
          </button>
          <button
            onClick={() => { setRemaining(r => r + 30); }}
            className="flex-1 py-3 bg-[#1a1a1a] rounded-xl text-sm"
          >
            +30s
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PR Celebration ───────────────────────────────────────────────────────────

function PRCelebration({
  prType,
  exerciseName,
  weight,
  reps,
  previousWeight,
  onDone,
}: {
  prType: "1rm" | "volume" | null;
  exerciseName?: string;
  weight?: number;
  reps?: number;
  previousWeight?: number;
  onDone: () => void;
}) {
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    celebratePR();
    haptics.success();
  }, []);

  if (showShare && exerciseName && weight && reps) {
    return (
      <PRShareCard
        exerciseName={exerciseName}
        weight={weight}
        reps={reps}
        previousWeight={previousWeight}
        onClose={onDone}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
      <div className="text-center space-y-4 px-6">
        <div className="text-6xl animate-bounce">🏆</div>
        <h2 className="text-2xl font-bold text-[#FFB300]">NEW PR!</h2>
        {exerciseName && (
          <p className="text-white font-semibold">{exerciseName}</p>
        )}
        {weight && reps && (
          <p className="text-[#FFB300] text-xl font-bold">{weight} lbs × {reps}</p>
        )}
        <p className="text-neutral-400 text-sm">
          {prType === "1rm" ? "New estimated 1-rep max!" :
           prType === "volume" ? "New single-set volume PR!" :
           "Personal Record Broken!"}
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={onDone}
            className="flex-1 py-3 border border-[#262626] text-neutral-400 rounded-xl text-sm"
          >
            Keep Going
          </button>
          {exerciseName && weight && reps && (
            <button
              onClick={() => setShowShare(true)}
              className="flex-[2] py-3 bg-[#FFB300] text-black font-bold rounded-xl text-sm"
            >
              Share PR 📤
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Plate Calculator Modal ───────────────────────────────────────────────────

function PlateCalculatorModal({
  weight,
  onClose,
}: {
  weight: number;
  onClose: () => void;
}) {
  const [w, setW] = useState(weight);
  const breakdown = calculatePlates(w, "lbs");

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-end">
      <div className="w-full bg-[#141414] border-t border-[#262626] rounded-t-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Plate Calculator</h3>
          <button onClick={onClose} className="text-neutral-500 text-lg">✕</button>
        </div>

        <div className="relative">
          <input
            type="number"
            value={w}
            onChange={e => setW(parseFloat(e.target.value) || 0)}
            className="w-full p-4 pr-16 bg-[#0a0a0a] border border-[#262626] rounded-xl text-center text-2xl font-bold focus:border-[#0066FF] focus:outline-none"
            step={2.5}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">lbs</span>
        </div>

        <div className="bg-[#0a0a0a] rounded-xl p-4">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-neutral-400">Bar: {breakdown.bar} lbs</span>
            <span className="text-neutral-400">Per side:</span>
          </div>
          {breakdown.platesPerSide.length > 0 ? (
            <div className="space-y-2">
              {breakdown.platesPerSide.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {Array.from({ length: p.count }).map((_, j) => (
                      <div
                        key={j}
                        className="h-8 rounded-md flex items-center justify-center text-xs font-bold text-black"
                        style={{
                          width: Math.max(24, p.weight * 0.8) + "px",
                          background: p.weight >= 45 ? "#FFB300" : p.weight >= 25 ? "#0066FF" : p.weight >= 10 ? "#00C853" : "#A0A0A0",
                        }}
                      >
                        {p.weight}
                      </div>
                    ))}
                  </div>
                  <span className="text-neutral-400 text-sm">{p.count}×{p.weight}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm text-center">Bar only</p>
          )}
          <div className="mt-3 pt-3 border-t border-[#262626] flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>{breakdown.totalWeight} lbs</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Workout Page ────────────────────────────────────────────────────────

export default function WorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const workoutId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const [logId, setLogId] = useState<string | null>(null);
  const [activeExIdx, setActiveExIdx] = useState<number | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [plateCalcWeight, setPlateCalcWeight] = useState(135);
  const [showPR, setShowPR] = useState(false);
  const [prType, setPrType] = useState<"1rm" | "volume" | null>(null);
  const [prExercise, setPrExercise] = useState<{ name: string; weight: number; reps: number } | null>(null);
  const [completing, setCompleting] = useState(false);
  const [done, setDone] = useState(false);
  const [demoExercise, setDemoExercise] = useState<Exercise | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("voiceCoachEnabled") !== "false";
    }
    return true;
  });
  const [completionData, setCompletionData] = useState<{
    duration: number;
    totalVolume: number;
    prCount: number;
    newAchievements: { name: string; icon: string; xpReward: number }[];
  } | null>(null);

  const startTime = useRef(Date.now());

  // Load workout data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/workouts/today");
        const data = await res.json();

        if (!data.workout) { router.push("/dashboard"); return; }

        const w = data.workout;

        // Initialize logged sets for each exercise
        const exercises: Exercise[] = w.exercises.map((ex: Exercise) => ({
          ...ex,
          progressionBadge: ex.progressionBadge || null,
          progressionReason: ex.progressionReason || null,
          loggedSets: Array.from({ length: ex.sets }, (_, i) => ({
            setNumber: i + 1,
            weight: ex.suggestedWeight || ex.lastWeight || 45,
            reps: ex.repsMax,
            logged: false,
          })),
        }));

        setWorkout({ id: w.id, name: w.name, exercises, coachingNotes: w.coachingNotes || [] });

        // Start the workout log
        const logRes = await fetch("/api/workouts/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start", workoutId: w.id }),
        });
        const logData = await logRes.json();
        setLogId(logData.logId);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, workoutId]);

  const updateSet = (exIdx: number, setIdx: number, patch: Partial<LoggedSet>) => {
    setWorkout(prev => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const sets = [...exercises[exIdx].loggedSets];
      sets[setIdx] = { ...sets[setIdx], ...patch };
      exercises[exIdx] = { ...exercises[exIdx], loggedSets: sets };
      return { ...prev, exercises };
    });
  };

  const logSet = useCallback(
    async (exIdx: number, setIdx: number) => {
      if (!workout || !logId) return;
      const ex = workout.exercises[exIdx];
      const set = ex.loggedSets[setIdx];

      haptics.light();

      const res = await fetch("/api/workouts/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_set",
          logId,
          exerciseId: ex.exerciseId,
          setNumber: set.setNumber,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe,
        }),
      });

      const data = await res.json();
      if (data.isPR) {
        setPrType(data.prType || null);
        setPrExercise({ name: ex.name, weight: set.weight, reps: set.reps });
        setShowPR(true);
      }

      updateSet(exIdx, setIdx, { logged: true, isPR: data.isPR });

      // Voice cue for rest period
      const voice = getVoiceCoach();
      const restSecs = ex.restSeconds || 120;
      const isLastSet = setIdx === ex.sets - 1;
      if (isLastSet) {
        voice.announceLastSet();
      } else {
        voice.announceRestPeriod(restSecs);
      }

      // Start rest timer
      setTimerSeconds(restSecs);
      setShowTimer(true);
    },
    [workout, logId]
  );

  const completeWorkout = async () => {
    if (!logId) return;
    setCompleting(true);
    try {
      const res = await fetch("/api/workouts/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", logId }),
      });
      const data = await res.json();
      celebrateWorkout();
      haptics.success();
      getVoiceCoach().announceWorkoutComplete();
      setCompletionData({
        duration: data.duration * 60,
        totalVolume: data.totalVolume,
        prCount: data.prCount || 0,
        newAchievements: data.newAchievements || [],
      });
      setDone(true);
    } finally {
      setCompleting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!workout) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-neutral-400">Workout not found</p>
          <button onClick={() => router.push("/dashboard")} className="text-[#0066FF] underline">
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  // ── Done Screen ──────────────────────────────────────────────────────────────
  if (done && completionData) {
    const totalSets = workout.exercises.reduce((s, ex) => s + ex.loggedSets.filter(l => l.logged).length, 0);
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    if (showShareCard) {
      return (
        <WorkoutShareCard
          workoutName={workout.name}
          date={dateStr}
          exerciseCount={workout.exercises.length}
          totalSets={totalSets}
          totalVolume={completionData.totalVolume}
          durationMinutes={Math.round(completionData.duration / 60)}
          streakDays={0}
          onClose={() => router.push("/home")}
        />
      );
    }

    return (
      <main className="min-h-screen bg-black text-white">
        <WorkoutCompleteScreen
          duration={completionData.duration}
          totalVolume={completionData.totalVolume}
          totalSets={totalSets}
          prCount={completionData.prCount}
          newAchievements={completionData.newAchievements}
          onClose={() => setShowShareCard(true)}
        />
      </main>
    );
  }

  // ── Active Workout ──────────────────────────────────────────────────────────
  const completedExercises = workout.exercises.filter(ex =>
    ex.loggedSets.every(s => s.logged)
  ).length;

  return (
    <main className="min-h-screen bg-black text-white pb-6">
      {/* Overlays */}
      {showTimer && (
        <RestTimer
          seconds={timerSeconds}
          onDone={() => setShowTimer(false)}
        />
      )}
      {showPR && <PRCelebration
        prType={prType}
        exerciseName={prExercise?.name}
        weight={prExercise?.weight}
        reps={prExercise?.reps}
        onDone={() => { setShowPR(false); setPrType(null); setPrExercise(null); }}
      />}
      {demoExercise && (
        <ExerciseDetailModal
          exercise={{
            id: demoExercise.exerciseId,
            name: demoExercise.name,
            gifUrl: demoExercise.gifUrl,
            muscleGroups: JSON.stringify(demoExercise.muscleGroups),
            secondaryMuscles: demoExercise.secondaryMuscles || "[]",
            formTips: demoExercise.formTips || "[]",
            commonMistakes: demoExercise.commonMistakes || "[]",
            coachingCues: demoExercise.coachingCues || "[]",
            alternatives: demoExercise.alternatives || "[]",
            instructions: demoExercise.instructions,
            category: demoExercise.category || "strength",
          }}
          onClose={() => setDemoExercise(null)}
        />
      )}
      {showPlateCalc && (
        <PlateCalculatorModal
          weight={plateCalcWeight}
          onClose={() => setShowPlateCalc(false)}
        />
      )}

      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-[#1a1a1a]">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-neutral-500 text-sm hover:text-white transition-colors"
        >
          ← Exit
        </button>
        <div className="text-center">
          <div className="font-bold">{workout.name}</div>
          <div className="text-xs text-neutral-500">
            {completedExercises}/{workout.exercises.length} exercises
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const vc = getVoiceCoach();
              const next = !voiceEnabled;
              setVoiceEnabled(next);
              vc.setEnabled(next);
              localStorage.setItem("voiceCoachEnabled", String(next));
            }}
            className="text-lg"
            title={voiceEnabled ? "Voice on" : "Voice off"}
          >
            {voiceEnabled ? "🔊" : "🔇"}
          </button>
          <div className="text-xs text-neutral-500 tabular-nums">
            <ElapsedTime startTime={startTime.current} />
          </div>
        </div>
      </header>

      {/* Progress dots */}
      <div className="px-5 py-3 flex gap-1.5">
        {workout.exercises.map((ex, i) => (
          <div
            key={ex.id}
            className={`h-1 flex-1 rounded-full transition-colors ${
              ex.loggedSets.every(s => s.logged)
                ? "bg-[#0066FF]"
                : activeExIdx === i
                ? "bg-[#0066FF]/50"
                : "bg-[#262626]"
            }`}
          />
        ))}
      </div>

      {/* AI Coaching Notes */}
      {workout.coachingNotes && workout.coachingNotes.length > 0 && (
        <div className="mx-5 mb-3 bg-[#0066FF]/5 border border-[#0066FF]/20 rounded-xl p-3 space-y-1.5">
          <p className="text-xs text-[#0066FF] font-semibold uppercase tracking-wide">Coach Tips</p>
          {workout.coachingNotes.map((note, i) => (
            <p key={i} className="text-xs text-neutral-300">{note}</p>
          ))}
        </div>
      )}

      {/* Exercise List */}
      <div className="px-5 space-y-3">
        {workout.exercises.map((ex, exIdx) => {
          const isActive = activeExIdx === exIdx;
          const isComplete = ex.loggedSets.every(s => s.logged);
          const completedSets = ex.loggedSets.filter(s => s.logged).length;

          return (
            <div
              key={ex.id}
              className={`rounded-2xl border overflow-hidden transition-all ${
                isActive
                  ? "border-[#0066FF]/50 bg-[#141414]"
                  : isComplete
                  ? "border-[#262626] bg-[#0a0a0a] opacity-75"
                  : "border-[#262626] bg-[#141414]"
              }`}
            >
              {/* Exercise Header */}
              <div className="w-full px-5 py-4 flex items-center gap-3 text-left">
                {/* GIF Thumbnail */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDemoExercise(ex); }}
                  className="w-12 h-12 rounded-xl overflow-hidden bg-[#0a0a0a] border border-[#262626] flex-shrink-0 flex items-center justify-center"
                >
                  {ex.gifUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ex.gifUrl} alt={ex.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">💪</span>
                  )}
                </button>

                <button
                  className="flex-1 flex items-center justify-between text-left min-w-0"
                  onClick={() => setActiveExIdx(isActive ? null : exIdx)}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isComplete && <span className="text-[#00C853] text-sm">✓</span>}
                      <span className={`font-semibold ${isComplete ? "text-neutral-400" : "text-white"}`}>
                        {ex.name}
                      </span>
                      {ex.progressionBadge && !isComplete && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#0066FF]/20 text-[#0066FF] border border-[#0066FF]/30">
                          {ex.progressionBadge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {ex.sets} sets × {ex.repsMin}–{ex.repsMax} reps
                      {ex.rpe ? ` @ RPE ${ex.rpe}` : ""}
                      {ex.lastWeight ? ` • Last: ${ex.lastWeight} lbs` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDemoExercise(ex);
                      }}
                      className="w-5 h-5 rounded-full border border-[#303030] text-[10px] text-neutral-300 flex items-center justify-center"
                      aria-label={`Open ${ex.name} guide`}
                    >
                      ?
                    </button>
                    <span className="text-xs text-neutral-600">
                      {completedSets}/{ex.sets}
                    </span>
                    <svg
                      className={`w-4 h-4 text-neutral-600 transition-transform ${isActive ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Expanded exercise panel */}
              {isActive && (
                <div className="px-5 pb-5 space-y-3 border-t border-[#1a1a1a]">
                  {/* Progression tip */}
                  {ex.progressionReason && (
                    <div className="pt-3">
                      <p className="text-xs text-[#0066FF]/80 bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-lg px-3 py-2">
                        {ex.progressionReason}
                      </p>
                    </div>
                  )}
                  {/* Last session */}
                  {ex.lastSets.length > 0 && (
                    <div className="pt-3">
                      <p className="text-xs text-neutral-600 mb-1.5">Last session:</p>
                      <div className="flex gap-2 flex-wrap">
                        {ex.lastSets.map((s, i) => (
                          <span key={i} className="text-xs bg-[#0a0a0a] border border-[#262626] px-2 py-1 rounded-lg text-neutral-400">
                            {s.weight}×{s.reps}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sets */}
                  <div className="pt-2 space-y-2">
                    {ex.loggedSets.map((set, setIdx) => (
                      <div
                        key={setIdx}
                        className={`p-3 rounded-xl border ${
                          set.logged
                            ? "bg-[#0066FF]/10 border-[#0066FF]/30"
                            : "bg-[#0a0a0a] border-[#262626]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-neutral-500 w-10">
                            {set.logged ? "✓" : `Set ${set.setNumber}`}
                          </span>

                          {/* Weight */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  updateSet(exIdx, setIdx, { weight: Math.max(0, set.weight - 2.5) });
                                }}
                                className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-neutral-400 hover:text-white"
                              >−</button>
                              <input
                                type="number"
                                value={set.weight}
                                onChange={e =>
                                  updateSet(exIdx, setIdx, { weight: parseFloat(e.target.value) || 0 })
                                }
                                onClick={() => {
                                  setPlateCalcWeight(set.weight);
                                }}
                                className="flex-1 bg-transparent text-center font-bold text-lg focus:outline-none w-16"
                                step={2.5}
                              />
                              <button
                                onClick={() => updateSet(exIdx, setIdx, { weight: set.weight + 2.5 })}
                                className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-neutral-400 hover:text-white"
                              >+</button>
                            </div>
                            <div className="text-center text-xs text-neutral-600">lbs</div>
                          </div>

                          <span className="text-neutral-600">×</span>

                          {/* Reps */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateSet(exIdx, setIdx, { reps: Math.max(1, set.reps - 1) })}
                                className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-neutral-400 hover:text-white"
                              >−</button>
                              <input
                                type="number"
                                value={set.reps}
                                onChange={e =>
                                  updateSet(exIdx, setIdx, { reps: parseInt(e.target.value) || 0 })
                                }
                                className="flex-1 bg-transparent text-center font-bold text-lg focus:outline-none w-16"
                              />
                              <button
                                onClick={() => updateSet(exIdx, setIdx, { reps: set.reps + 1 })}
                                className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-neutral-400 hover:text-white"
                              >+</button>
                            </div>
                            <div className="text-center text-xs text-neutral-600">reps</div>
                          </div>

                          {/* Log button */}
                          {!set.logged && (
                            <button
                              onClick={() => logSet(exIdx, setIdx)}
                              className="w-10 h-10 rounded-xl bg-[#0066FF] flex items-center justify-center text-white font-bold text-lg hover:bg-[#0052CC] transition-colors"
                            >
                              ✓
                            </button>
                          )}
                          {set.isPR && (
                            <span className="text-[#FFB300] text-xs font-bold">PR!</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tools */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setPlateCalcWeight(ex.loggedSets[0]?.weight || 135);
                        setShowPlateCalc(true);
                      }}
                      className="flex-1 py-2.5 bg-[#0a0a0a] border border-[#262626] rounded-xl text-xs text-neutral-400 hover:text-white transition-colors"
                    >
                      🔢 Plate Calc
                    </button>
                    <button
                      onClick={() => {
                        setTimerSeconds(ex.restSeconds || 120);
                        setShowTimer(true);
                      }}
                      className="flex-1 py-2.5 bg-[#0a0a0a] border border-[#262626] rounded-xl text-xs text-neutral-400 hover:text-white transition-colors"
                    >
                      ⏱ Rest Timer
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Complete Workout Button */}
      <div className="px-5 mt-6">
        <button
          onClick={completeWorkout}
          disabled={completing}
          className={`w-full py-4 font-bold rounded-xl transition-all ${
            completing
              ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
              : "bg-[#0066FF] text-white hover:bg-[#0052CC]"
          }`}
        >
          {completing ? "Saving..." : "Complete Workout"}
        </button>
      </div>
    </main>
  );
}

// Elapsed time display
function ElapsedTime({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return <>{mins}:{secs.toString().padStart(2, "0")}</>;
}
