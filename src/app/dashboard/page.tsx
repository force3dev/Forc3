"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/shared/BottomNav";
import PullToRefreshWrapper from "@/components/shared/PullToRefreshWrapper";
import WeeklySummaryPopup from "@/components/shared/WeeklySummaryPopup";
import CardioBlock from "@/components/cardio/CardioBlock";
import MorningCheckin from "@/components/MorningCheckin";
import RecoveryScore from "@/components/RecoveryScore";
import HealthCheckin from "@/components/HealthCheckin";
import StravaFeed from "@/components/StravaFeed";

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

interface NutritionData {
  totals: { calories: number; protein: number; carbs: number; fat: number };
  targets: { calories: number; protein: number; carbs: number; fat: number };
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<TodayData | null>(null);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [streak, setStreak] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [messageUsed, setMessageUsed] = useState(false);

  async function load() {
    try {
      const [todayRes, nutritionRes, profileRes, limitRes] = await Promise.all([
        fetch("/api/workouts/today"),
        fetch("/api/nutrition"),
        fetch("/api/user/profile"),
        fetch("/api/coach/check-limit"),
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
        const tier = profData.subscription?.tier || "free";
        setIsPremium(tier !== "free");
      }

      if (limitRes.ok) {
        const limitData = await limitRes.json();
        setMessageUsed(limitData.remaining === 0);
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
        {/* HEALTH CHECK-IN — appears first thing in morning */}
        <HealthCheckin />

        {/* MORNING CHECK-IN */}
        <MorningCheckin isPremium={isPremium} messageUsed={messageUsed} />

        {/* RECOVERY SCORE */}
        <RecoveryScore isPremium={isPremium} />

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
        ) : null}

        {/* TODAY'S CARDIO */}
        <CardioBlock />

        {/* STRAVA ACTIVITY FEED */}
        <StravaFeed />

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
      </div>

      <BottomNav active="home" />
    </main>
    </PullToRefreshWrapper>
    </>
  );
}
