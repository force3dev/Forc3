"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/shared/BottomNav";
import PullToRefreshWrapper from "@/components/shared/PullToRefreshWrapper";
import WeeklySummaryPopup from "@/components/shared/WeeklySummaryPopup";
import CardioBlock from "@/components/cardio/CardioBlock";
import MorningCheckin from "@/components/MorningCheckin";
import RecoveryScore from "@/components/RecoveryScore";
import HealthCheckin from "@/components/HealthCheckin";
import StravaFeed from "@/components/StravaFeed";
import InjuryAlert from "@/components/InjuryAlert";
import { DashboardSkeleton } from "@/components/Skeletons";
import { getLevelFromXP, getXPProgressPercent } from "@/lib/xp-system";
import { celebrateWorkout } from "@/lib/confetti";
import Avatar from "@/components/Avatar";

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

function getGreeting(name: string, hour: number): string {
  if (hour < 12) return `Good morning, ${name} ☀️`;
  if (hour < 17) return `Good afternoon, ${name} 💪`;
  if (hour < 21) return `Evening session, ${name} 🌙`;
  return `Late night grind, ${name} 🔥`;
}

function getWorkoutGradient(workoutName?: string, isRestDay?: boolean): string {
  if (isRestDay) return "from-purple-950/30 via-neutral-950 to-black";
  if (!workoutName) return "from-neutral-950 to-black";
  const n = workoutName.toLowerCase();
  if (n.includes("run") || n.includes("cardio") || n.includes("bike") || n.includes("swim"))
    return "from-cyan-950/40 via-neutral-950 to-black";
  if (n.includes("push") || n.includes("chest") || n.includes("upper") || n.includes("pull") || n.includes("back"))
    return "from-red-950/30 via-neutral-950 to-black";
  if (n.includes("leg") || n.includes("lower") || n.includes("squat"))
    return "from-orange-950/30 via-neutral-950 to-black";
  return "from-blue-950/30 via-neutral-950 to-black";
}

interface NutritionData {
  totals: { calories: number; protein: number; carbs: number; fat: number };
  targets: { calories: number; protein: number; carbs: number; fat: number };
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<TodayData | null>(null);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [userName, setUserName] = useState("Athlete");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [messageUsed, setMessageUsed] = useState(false);
  const [injuryFlags, setInjuryFlags] = useState<{ id: string; type: string; severity: string; muscle?: string; message: string; createdAt: string }[]>([]);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);

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
        setTotalXP(profData.streak?.totalXP || 0);
        setUserName(profData.profile?.name?.split(" ")[0] || "Athlete");
        setAvatarUrl(profData.avatarUrl || null);
        const tier = profData.subscription?.tier || "free";
        setIsPremium(tier !== "free");
      }

      if (limitRes.ok) {
        const limitData = await limitRes.json();
        setMessageUsed(limitData.remaining === 0);
      }

      // Load injury flags
      fetch("/api/injury/list").then(r => r.ok ? r.json() : null).then(d => {
        if (d?.flags) setInjuryFlags(d.flags);
      }).catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show upgrade success on ?upgraded=true
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setShowUpgradeSuccess(true);
      celebrateWorkout();
      // Clean the URL
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (loading) {
    return <DashboardSkeleton />;
  }

  const hour = new Date().getHours();
  const greeting = getGreeting(userName, hour);
  const bgGradient = getWorkoutGradient(today?.workout?.name, today?.isRestDay);
  const level = getLevelFromXP(totalXP);
  const xpPct = getXPProgressPercent(totalXP);

  const caloriesPct = nutrition
    ? Math.min(100, (nutrition.totals.calories / nutrition.targets.calories) * 100)
    : 0;
  const proteinPct = nutrition
    ? Math.min(100, (nutrition.totals.protein / nutrition.targets.protein) * 100)
    : 0;

  return (
    <>
    {/* Upgrade success overlay */}
    <AnimatePresence>
      {showUpgradeSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-6"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-[#141414] border border-[#00C853]/40 rounded-3xl p-8 max-w-sm w-full text-center space-y-5"
          >
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-black">Welcome to Premium!</h2>
            <div className="space-y-2 text-sm text-neutral-300">
              {["Unlimited AI coach chat", "Adaptive program updates", "Race programming + taper", "Nutrition AI coach", "Injury prevention alerts"].map(f => (
                <div key={f} className="flex items-center gap-2"><span className="text-[#00C853]">✓</span>{f}</div>
              ))}
            </div>
            <button
              onClick={() => setShowUpgradeSuccess(false)}
              className="w-full py-4 bg-[#00C853] text-black font-black rounded-2xl"
            >
              Let&apos;s Go →
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <WeeklySummaryPopup />
    <PullToRefreshWrapper onRefresh={load}>
    <main className={`min-h-screen bg-gradient-to-b ${bgGradient} text-white pb-24`}>
      {/* Header */}
      <header className="px-6 pt-8 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-2xl font-bold mt-1"
            >
              {greeting}
            </motion.h1>
            <p className="text-neutral-500 text-sm">{dateStr}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-neutral-500">WEEK {today?.currentWeek || 1}</div>
              <div className="text-xs text-neutral-400 mt-0.5">
                {today?.workoutsThisWeek || 0}/{today?.daysPerWeek || 4} this week
              </div>
            </div>
            <Link href="/profile">
              <Avatar user={{ name: userName, avatarUrl }} size="md" />
            </Link>
          </div>
        </div>

        {/* Level + XP bar */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mt-4"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#FFB300] tracking-wide">
              Lv.{level.level} · {level.name}
            </span>
            <span className="text-xs text-neutral-500">{totalXP} XP</span>
          </div>
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#FFB300] to-[#FF6B00] rounded-full"
            />
          </div>
        </motion.div>
      </header>

      <div className="px-6 space-y-5">
        {/* Injury alerts */}
        {injuryFlags.length > 0 && (
          <InjuryAlert flags={injuryFlags} onDismiss={(id) => setInjuryFlags(f => f.filter(x => x.id !== id))} />
        )}

        {/* Quick Stats Row */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        >
          {/* Streak pill */}
          <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#262626] rounded-full px-3 py-1.5 flex-shrink-0">
            <span className="text-sm" style={{ animation: streak >= 3 ? 'pulse 2s infinite' : undefined }}>🔥</span>
            <span className="text-xs font-bold text-white">{streak}</span>
            <span className="text-xs text-neutral-500">streak</span>
          </div>
          {/* Workouts this week */}
          <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#262626] rounded-full px-3 py-1.5 flex-shrink-0">
            <span className="text-sm">💪</span>
            <span className="text-xs font-bold text-white">{today?.workoutsThisWeek || 0}</span>
            <span className="text-xs text-neutral-500">workouts</span>
          </div>
          {/* Day name */}
          <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#262626] rounded-full px-3 py-1.5 flex-shrink-0">
            <span className="text-sm">📅</span>
            <span className="text-xs font-bold text-white">{dayName}</span>
          </div>
        </motion.div>

        {/* HEALTH CHECK-IN */}
        <HealthCheckin />

        {/* MORNING CHECK-IN */}
        <MorningCheckin isPremium={isPremium} messageUsed={messageUsed} />

        {/* RECOVERY SCORE */}
        <RecoveryScore isPremium={isPremium} />

        {/* TODAY'S WORKOUT — Hero Card */}
        {today?.isRestDay ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="bg-[#141414] border border-[#262626] rounded-2xl p-6 text-center space-y-3"
          >
            <div className="text-4xl">😴</div>
            <h2 className="text-lg font-semibold">Rest Day</h2>
            <p className="text-sm text-neutral-500">
              {today.message || "Rest well. Growth happens here."}
            </p>
          </motion.div>
        ) : today?.workout ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            whileHover={{ y: -2 }}
            className="relative bg-[#141414] rounded-2xl overflow-hidden"
            style={{
              border: '1px solid transparent',
              backgroundClip: 'padding-box',
            }}
          >
            {/* Animated gradient border */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, #0066FF40, #00C85340, #0066FF40)',
                backgroundSize: '200% 200%',
                animation: 'gradientShift 4s ease infinite',
                zIndex: 0,
              }}
            />
            <style>{`
              @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
            `}</style>
            <div className="relative z-10 m-px bg-[#141414] rounded-2xl">
              <div className="px-5 py-4 border-b border-[#262626]">
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Today&apos;s Workout</p>
                <h2 className="text-xl font-bold mt-1">{today.workout.name}</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {today.workout.exercises.length} exercises
                </p>
              </div>
              <div className="px-5 py-4 space-y-3">
                {today.workout.exercises.slice(0, 4).map((ex, i) => (
                  <motion.div
                    key={ex.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-neutral-200">{ex.name}</span>
                    <span className="text-xs text-neutral-500">
                      {ex.sets} × {ex.repsMin}–{ex.repsMax}
                      {ex.lastWeight ? ` • ${ex.lastWeight} lbs` : ""}
                    </span>
                  </motion.div>
                ))}
                {today.workout.exercises.length > 4 && (
                  <p className="text-xs text-neutral-600">
                    +{today.workout.exercises.length - 4} more
                  </p>
                )}
              </div>
              <div className="px-5 pb-5 flex gap-2">
                <Link
                  href={`/workout/edit/${today.workout.id}`}
                  className="flex-1 py-3 text-center text-[#0066FF] text-sm font-semibold border border-[#0066FF]/30 rounded-xl hover:bg-[#0066FF]/10 transition-colors"
                >
                  Edit
                </Link>
                <Link
                  href={`/workout/${today.workout.id}`}
                  className="flex-[2] py-3 text-center bg-[#0066FF] text-white text-sm font-bold rounded-xl hover:bg-[#0052CC] transition-colors"
                >
                  {today.inProgressLog ? "Resume →" : "Let&apos;s Go →"}
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* TODAY'S CARDIO */}
        <CardioBlock />

        {/* STRAVA ACTIVITY FEED */}
        <StravaFeed />

        {/* NUTRITION CARD */}
        {nutrition && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="bg-[#141414] border border-[#262626] rounded-2xl p-5"
          >
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
          </motion.div>
        )}

        {/* STREAK + WORKOUTS STATS */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Link
              href="/history"
              className="block bg-[#141414] border border-[#262626] rounded-2xl p-4 hover:border-[#0066FF]/50 transition-colors"
            >
              <div className="text-xs text-neutral-500 uppercase tracking-wide">This Week</div>
              <div className="text-3xl font-bold mt-1">
                {today?.workoutsThisWeek || 0}
                <span className="text-lg text-neutral-500 font-normal"> / {today?.daysPerWeek || 4}</span>
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">workouts</div>
            </Link>
          </motion.div>

          <motion.div whileTap={{ scale: 0.97 }}>
            <Link
              href="/progress"
              className="block bg-[#141414] border border-[#262626] rounded-2xl p-4 hover:border-[#FFB300]/50 transition-colors"
            >
              <div className="text-xs text-neutral-500 uppercase tracking-wide">Streak</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-3xl font-bold">{streak}</span>
                <span className="text-lg text-neutral-500 font-normal ml-1">days</span>
                {streak >= 3 && <span className="text-xl ml-1">🔥</span>}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                {streak === 0 ? "Start your streak today!" : streak >= 7 ? "On fire! 🏆" : "Keep going"}
              </div>
            </Link>
          </motion.div>
        </div>
      </div>

      <BottomNav active="home" />
    </main>
    </PullToRefreshWrapper>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black" />}>
      <DashboardContent />
    </Suspense>
  );
}
