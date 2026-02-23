"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";
import CardioCalendar from "@/components/cardio/CardioCalendar";

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

export default function PlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Get the plan directly from Prisma via a new API route
        const res = await fetch("/api/plan");
        if (res.ok) {
          const data = await res.json();
          setPlan(data.plan);
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <header className="px-6 pt-8 pb-4">
        <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
        <h1 className="text-2xl font-bold mt-1">{plan.name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-neutral-500">{SPLIT_LABELS[plan.split] || plan.split}</span>
          <span className="text-neutral-700">·</span>
          <span className="text-sm text-neutral-500">{plan.daysPerWeek}x / week</span>
          <span className="text-neutral-700">·</span>
          <span className="text-sm text-neutral-500">Week {plan.currentWeek}</span>
        </div>
      </header>

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

      {/* Cardio Calendar */}
      <div className="px-6 mt-6">
        <CardioCalendar />
      </div>

      <BottomNav active="workout" />
    </main>
  );
}
