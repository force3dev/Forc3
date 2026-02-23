"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/shared/BottomNav";
import SleepDebtCard from "@/components/SleepDebtCard";
import PullToRefreshWrapper from "@/components/shared/PullToRefreshWrapper";
import WeeklySummaryPopup from "@/components/shared/WeeklySummaryPopup";
import CardioBlock from "@/components/cardio/CardioBlock";

interface ExercisePreview {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  lastWeight: number | null;
}

interface TodayData {
  isRestDay: boolean;
  currentWeek: number;
  workoutsThisWeek: number;
  daysPerWeek: number;
  message?: string;
  needsOnboarding?: boolean;
  workout?: {
    id: string;
    name: string;
    exercises: ExercisePreview[];
  };
  inProgressLog: string | null;
}

interface RaceGoal {
  type: string;
  date?: string;
  priority?: string;
}

interface NutritionData {
  totals: { calories: number; protein: number; carbs: number; fat: number };
  targets: { calories: number; protein: number; carbs: number; fat: number };
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<TodayData | null>(null);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [streak, setStreak] = useState(0);
  const [raceCountdown, setRaceCountdown] = useState<{ label: string; days: number } | null>(null);

  async function load() {
    try {
      const [todayRes, nutritionRes, profileRes] = await Promise.all([
        fetch("/api/workouts/today"),
        fetch("/api/nutrition"),
        fetch("/api/user/profile"),
      ]);

      const todayData = await todayRes.json();
      if (todayData.needsOnboarding) { router.push("/onboarding"); return; }
      setToday(todayData);

      if (nutritionRes.ok) {
        const nutData = await nutritionRes.json();
        setNutrition(nutData);
      }

      if (profileRes.ok) {
        const profData = await profileRes.json();
        setStreak(profData.streak?.currentStreak || 0);

        // Compute race countdown from profile raceGoals
        const goals: RaceGoal[] = profData.profile?.raceGoals || [];
        if (goals.length > 0) {
          const now = Date.now();
          const nearest = goals
            .filter((r: RaceGoal) => r.date)
            .map((r: RaceGoal) => ({
              label: r.type.replace(/_/g, " "),
              days: Math.max(0, Math.round((new Date(r.date!).getTime() - now) / 86400000)),
            }))
            .sort((a, b) => a.days - b.days)[0];
          if (nearest) setRaceCountdown(nearest);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const caloriesPct = nutrition
    ? Math.min(100, (nutrition.totals.calories / nutrition.targets.calories) * 100)
    : 0;
  const proteinPct = nutrition
    ? Math.min(100, (nutrition.totals.protein / nutrition.targets.protein) * 100)
    : 0;

  return (
    <>
    <WeeklySummaryPopup />
    <PullToRefreshWrapper onRefresh={load}>
    <main className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="px-6 pt-8 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
            <h1 className="text-2xl font-bold mt-1">{dayName}</h1>
            <p className="text-neutral-500 text-sm">{dateStr}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-500">WEEK {today?.currentWeek || 1}</div>
            <div className="text-xs text-neutral-400 mt-0.5">
              {today?.workoutsThisWeek || 0}/{today?.daysPerWeek || 4} this week
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 space-y-5">
        {/* RACE COUNTDOWN BADGE */}
        {raceCountdown && (
          <div className="bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🏁</span>
              <span className="text-sm font-medium capitalize">{raceCountdown.label}</span>
            </div>
            <div className="text-right">
              <span className="text-[#0066FF] font-bold text-lg">{raceCountdown.days}</span>
              <span className="text-neutral-500 text-xs ml-1">days out</span>
            </div>
          </div>
        )}

        {/* TODAY'S WORKOUT */}
        {today?.isRestDay ? (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 text-center space-y-3">
            <div className="text-4xl">😴</div>
            <h2 className="text-lg font-semibold">Rest Day</h2>
            <p className="text-sm text-neutral-500">
              {today.message || "Rest well. Growth happens here."}
            </p>
          </div>
        ) : today?.workout ? (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#262626] flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Today</p>
                <h2 className="text-lg font-bold mt-0.5">{today.workout.name}</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {today.workout.exercises.length} exercises
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/workout/edit/${today.workout.id}`}
                  className="px-3 py-2 text-[#0066FF] text-sm font-semibold border border-[#0066FF]/30 rounded-xl hover:bg-[#0066FF]/10 transition-colors"
                >
                  Edit
                </Link>
                <Link
                  href={`/workout/${today.workout.id}`}
                  className="px-5 py-2.5 bg-[#0066FF] text-white text-sm font-bold rounded-xl hover:bg-[#0052CC] transition-colors"
                >
                  {today.inProgressLog ? "Resume" : "Start"}
                </Link>
              </div>
            </div>

            <div className="px-5 py-4 space-y-3">
              {today.workout.exercises.slice(0, 4).map(ex => (
                <div key={ex.id} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-200">{ex.name}</span>
                  <span className="text-xs text-neutral-500">
                    {ex.sets} × {ex.repsMin}–{ex.repsMax}
                    {ex.lastWeight ? ` • ${ex.lastWeight} lbs` : ""}
                  </span>
                </div>
              ))}
              {today.workout.exercises.length > 4 && (
                <p className="text-xs text-neutral-600">
                  +{today.workout.exercises.length - 4} more
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 text-center space-y-3">
            <div className="text-4xl">💪</div>
            <h2 className="text-lg font-semibold">No workout today</h2>
            <p className="text-sm text-neutral-500">Start a free workout or check your plan.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/workout/create" className="px-4 py-2 bg-[#0066FF] rounded-xl text-sm font-semibold">
                Create Workout
              </Link>
              <Link href="/plan" className="px-4 py-2 bg-[#1a1a1a] border border-[#262626] rounded-xl text-sm font-semibold">
                View Plan
              </Link>
            </div>
          </div>
        )}

        {/* CARDIO BLOCK */}
        <CardioBlock />

        {/* NUTRITION CARD */}
        {nutrition && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Nutrition</h3>
              <Link href="/nutrition" className="text-xs text-[#0066FF] hover:text-[#0052CC] transition-colors">
                Log meal →
              </Link>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-neutral-400">Calories</span>
                  <span>
                    <span className="font-semibold">{Math.round(nutrition.totals.calories)}</span>
                    <span className="text-neutral-500"> / {Math.round(nutrition.targets.calories)}</span>
                  </span>
                </div>
                <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0066FF] rounded-full transition-all"
                    style={{ width: `${caloriesPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-neutral-400">Protein</span>
                  <span>
                    <span className="font-semibold">{Math.round(nutrition.totals.protein)}g</span>
                    <span className="text-neutral-500"> / {Math.round(nutrition.targets.protein)}g</span>
                  </span>
                </div>
                <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00C853] rounded-full transition-all"
                    style={{ width: `${proteinPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUICK STATS */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/history"
            className="bg-[#141414] border border-[#262626] rounded-2xl p-4 hover:border-[#0066FF]/50 transition-colors"
          >
            <div className="text-xs text-neutral-500 uppercase tracking-wide">This Week</div>
            <div className="text-3xl font-bold mt-1">
              {today?.workoutsThisWeek || 0}
              <span className="text-lg text-neutral-500 font-normal"> / {today?.daysPerWeek || 4}</span>
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">workouts</div>
          </Link>

          <Link
            href="/progress"
            className="bg-[#141414] border border-[#262626] rounded-2xl p-4 hover:border-[#0066FF]/50 transition-colors"
          >
            <div className="text-xs text-neutral-500 uppercase tracking-wide">Streak</div>
            <div className="text-3xl font-bold mt-1">
              {streak}
              <span className="text-lg text-neutral-500 font-normal"> days</span>
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">{streak >= 7 ? "🔥 On fire!" : "Keep going"}</div>
          </Link>
        </div>

        {/* DISCOVER LINK */}
        <Link
          href="/discover"
          className="flex items-center justify-between bg-[#141414] border border-[#262626] rounded-2xl p-4 hover:border-[#0066FF]/50 transition-colors"
        >
          <div>
            <div className="font-semibold text-sm">Community Feed</div>
            <div className="text-xs text-neutral-500 mt-0.5">See what others are training</div>
          </div>
          <span className="text-[#0066FF]">→</span>
        </Link>
      </div>

      {/* Sleep Debt */}
      <div className="px-6 pb-2">
        <SleepDebtCard />
      </div>

      <BottomNav active="home" />
    </main>
    </PullToRefreshWrapper>
    </>
  );
}
