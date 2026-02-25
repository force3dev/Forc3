"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

interface ExerciseSpec {
  id: string;
  order: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  rpe?: number;
  restSeconds: number;
  exercise: { name: string; muscleGroups: string };
}

interface Workout {
  id: string;
  name: string;
  order: number;
  exercises: ExerciseSpec[];
}

interface Plan {
  id: string;
  name: string;
  type: string;
  split: string;
  daysPerWeek: number;
  currentWeek: number;
  currentPhase?: string;
  workouts: Workout[];
}

const SPLIT_LABELS: Record<string, string> = {
  ppl: "Push / Pull / Legs",
  upper_lower: "Upper / Lower",
  full_body: "Full Body",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [toast, setToast] = useState("");

  async function loadPlan() {
    try {
      const res = await fetch("/api/plan");
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPlan(); }, []);

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/program/generate", { method: "POST" });
      if (res.ok) {
        await loadPlan();
        setToast("New program ready! 💪");
        setTimeout(() => setToast(""), 2500);
      }
    } catch {
      setToast("Failed to generate. Try again.");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-5xl">📋</div>
          <p className="font-semibold">No plan yet</p>
          <p className="text-sm text-neutral-500">Complete onboarding to generate your plan.</p>
          <button
            onClick={() => router.push("/onboarding")}
            className="px-6 py-3 bg-[#0066FF] text-white font-bold rounded-xl"
          >
            Get My Plan
          </button>
        </div>
      </main>
    );
  }

  const todayDayOfWeek = new Date().getDay();

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0066FF] text-white text-sm font-semibold px-5 py-2.5 rounded-2xl shadow-lg">
          {toast}
        </div>
      )}

      <header className="px-6 pt-8 pb-4">
        <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
        <div className="flex items-start justify-between mt-1">
          <div>
            <h1 className="text-2xl font-bold">{plan.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-neutral-500">{SPLIT_LABELS[plan.split] || plan.split}</span>
              <span className="text-neutral-700">·</span>
              <span className="text-sm text-neutral-500">{plan.daysPerWeek}x / week</span>
              <span className="text-neutral-700">·</span>
              <span className="text-sm text-neutral-500">Week {plan.currentWeek}</span>
            </div>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex-shrink-0 px-3 py-2 bg-[#1a1a1a] border border-[#262626] rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:border-[#0066FF] transition-all disabled:opacity-50"
          >
            {regenerating ? "Building..." : "↻ Regenerate"}
          </button>
        </div>
      </header>

      {/* Week overview */}
      <div className="px-6 mb-5">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Your Training Week</p>
          <div className="space-y-2">
            {DAY_NAMES.map((dayLabel, dayIdx) => {
              const workout = plan.workouts.find(w => {
                // dayOfWeek stored as JS getDay() index
                return (w as unknown as { dayOfWeek?: number }).dayOfWeek === dayIdx;
              });
              const isToday = dayIdx === todayDayOfWeek;
              return (
                <div key={dayLabel} className={`flex items-center gap-3 py-1.5 ${isToday ? "opacity-100" : "opacity-70"}`}>
                  <span className={`text-xs font-bold w-7 ${isToday ? "text-[#0066FF]" : "text-neutral-500"}`}>{dayLabel}</span>
                  {workout ? (
                    <>
                      <span className="text-sm">💪</span>
                      <span className={`text-sm font-medium truncate ${isToday ? "text-white" : "text-neutral-300"}`}>{workout.name}</span>
                      <span className="ml-auto text-xs text-neutral-600">{workout.exercises.length} ex</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">😴</span>
                      <span className="text-sm text-neutral-600">Rest Day</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 space-y-3">
        {plan.workouts.map((workout, idx) => {
          const isExpanded = expanded === workout.id;

          return (
            <div
              key={workout.id}
              className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : workout.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#0066FF]/20 flex items-center justify-center text-[#0066FF] font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{workout.name}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {workout.exercises.length} exercises
                      </div>
                    </div>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-neutral-600 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-[#1a1a1a] divide-y divide-[#1a1a1a]">
                  {workout.exercises.map(ex => {
                    const muscles = (() => {
                      try { return (JSON.parse(ex.exercise.muscleGroups) as string[]).slice(0, 2).join(", "); }
                      catch { return ""; }
                    })();

                    return (
                      <div key={ex.id} className="px-5 py-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{ex.exercise.name}</div>
                          {muscles && (
                            <div className="text-xs text-neutral-600 mt-0.5 capitalize">{muscles}</div>
                          )}
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="text-sm font-semibold tabular-nums">
                            {ex.sets} × {ex.repsMin}–{ex.repsMax}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {ex.rpe ? `RPE ${ex.rpe} · ` : ""}{ex.restSeconds}s rest
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav active="workout" />
    </main>
  );
}
