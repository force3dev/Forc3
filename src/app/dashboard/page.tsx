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
import { TrainingLoadCard } from "@/components/dashboard/TrainingLoadCard";
import { DashboardSkeleton } from "@/components/Skeletons";
import { getLevelFromXP, getXPProgressPercent } from "@/lib/xp-system";
import { celebrateWorkout } from "@/lib/confetti";
import Avatar from "@/components/Avatar";
import StreakMilestoneScreen, { STREAK_MILESTONES } from "@/components/StreakMilestoneScreen";

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
  cardio?: {
    id: string;
    title: string | null;
    type: string;
    duration: number | null;
    intensity: string | null;
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
  const [loadError, setLoadError] = useState(false);
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
  const [weeklyReview, setWeeklyReview] = useState<string | null>(null);
  const [deloadCheck, setDeloadCheck] = useState<{
    deloadNeeded: boolean;
    deloadReason: string | null;
    plateaus: Array<{ exercise: string; weeksStuck: number; stuckWeight: number; protocol: { week1: string; week2: string; week3: string; week4: string } }>;
  } | null>(null);
  const [weekProgress, setWeekProgress] = useState<Array<{ dayIndex: number; dayName: string; completed: boolean; isRest: boolean; isFuture: boolean }>>([]);
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  async function load() {
    try {
      // Single dashboard endpoint for all core data
      const dashRes = await fetch("/api/dashboard");

      if (dashRes.ok) {
        const dash = await dashRes.json();
        if (dash.needsOnboarding) { router.push("/onboarding"); return; }

        // Map dashboard data to existing state
        setToday({
          isRestDay: dash.isRestDay,
          currentWeek: 1,
          workoutsThisWeek: dash.quickStats?.workoutsThisWeek || 0,
          daysPerWeek: 4,
          workout: dash.todayWorkout || undefined,
          cardio: dash.todayCardio || undefined,
          inProgressLog: dash.inProgressLog || null,
        });
        const newStreak = dash.user?.streak || 0;
        setStreak(newStreak);
        setTotalXP(dash.user?.totalXP || 0);
        setUserName(dash.user?.name?.split(" ")[0] || "Athlete");
        setAvatarUrl(dash.user?.avatarUrl || null);
        setIsPremium(dash.user?.isPremium || false);
        if (dash.weekProgress) setWeekProgress(dash.weekProgress);
        if (dash.morningMessage) setWeeklyReview(dash.morningMessage);

        // Check streak milestones (only show once per milestone per session)
        const shownMilestones = JSON.parse(sessionStorage.getItem("shownStreakMilestones") || "[]") as number[];
        const milestone = STREAK_MILESTONES.find(m => newStreak === m && !shownMilestones.includes(m));
        if (milestone) {
          setStreakMilestone(milestone);
          sessionStorage.setItem("shownStreakMilestones", JSON.stringify([...shownMilestones, milestone]));
        }
      } else {
        // Fallback to individual endpoints
        const [todayRes, profileRes] = await Promise.all([
          fetch("/api/workouts/today"),
          fetch("/api/user/profile"),
        ]);
        const todayData = await todayRes.json();
        if (todayData.needsOnboarding) { router.push("/onboarding"); return; }
        setToday(todayData);
        if (profileRes.ok) {
          const profData = await profileRes.json();
          setStreak(profData.streak?.currentStreak || 0);
          setTotalXP(profData.streak?.totalXP || 0);
          setUserName(profData.profile?.name?.split(" ")[0] || "Athlete");
          setAvatarUrl(profData.avatarUrl || null);
          setIsPremium((profData.subscription?.tier || "free") !== "free");
        }
      }

      // Parallel non-blocking loads
      fetch("/api/nutrition").then(r => r.ok ? r.json() : null).then(d => {
        if (d) setNutrition(d);
      }).catch(() => {});

      fetch("/api/coach/check-limit").then(r => r.ok ? r.json() : null).then(d => {
        if (d) setMessageUsed(d.remaining === 0);
      }).catch(() => {});

      fetch("/api/injury/list").then(r => r.ok ? r.json() : null).then(d => {
        if (d?.flags) setInjuryFlags(d.flags);
      }).catch(() => {});

      // Weekly review — only fetch on Mondays
      if (new Date().getDay() === 1) {
        fetch("/api/coach/weekly-review").then(r => r.ok ? r.json() : null).then(d => {
          if (d?.review) setWeeklyReview(d.review);
        }).catch(() => {});
      }

      // Deload + plateau check (non-blocking)
      fetch("/api/progress/deload-check").then(r => r.ok ? r.json() : null).then(d => {
        if (d) setDeloadCheck(d);
      }).catch(() => {});
    } catch (err) {
      console.error(err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  // PWA install banner — show if not in standalone mode
  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem("install-banner-dismissed");
    if (!isStandalone && !dismissed) {
      const timer = setTimeout(() => setShowInstallBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

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

  if (loadError || !today) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-4xl">⚡</div>
          <h2 className="text-xl font-bold">Couldn't load your dashboard</h2>
          <p className="text-neutral-400 text-sm">Check your connection and try again.</p>
          <button
            onClick={() => { setLoadError(false); setLoading(true); load(); }}
            className="px-6 py-3 bg-[#0066FF] text-white font-bold rounded-xl"
          >
            Retry
          </button>
        </div>
      </main>
    );
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

  // Daily challenges — derive completion from existing state
  const dailyChallenges = [
    {
      label: "Complete today's workout",
      xp: 50,
      done: today?.isRestDay === true,
      icon: "💪",
    },
    {
      label: "Log all 3 meals",
      xp: 30,
      done: !!nutrition && nutrition.totals.calories > 0,
      icon: "🥗",
    },
    {
      label: "Hit your protein target",
      xp: 20,
      done: !!nutrition && nutrition.targets.protein > 0 && nutrition.totals.protein >= nutrition.targets.protein * 0.9,
      icon: "🥩",
    },
  ];

  return (
    <>
    {/* Streak milestone screen */}
    <StreakMilestoneScreen
      show={streakMilestone !== null}
      streak={streakMilestone ?? 0}
      onDismiss={() => setStreakMilestone(null)}
    />

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
              Let's Go →
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

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="mx-6 mt-3 bg-blue-950/40 border border-blue-900/50 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">📱</span>
          <div className="flex-1">
            <p className="font-bold text-sm">Add FORC3 to Home Screen</p>
            <p className="text-neutral-400 text-xs">Tap Share → Add to Home Screen for the full app experience</p>
          </div>
          <button
            onClick={() => { localStorage.setItem("install-banner-dismissed", "1"); setShowInstallBanner(false); }}
            className="text-neutral-600 p-1"
          >✕</button>
        </div>
      )}

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

        {/* WEEK CALENDAR */}
        {weekProgress.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.21, duration: 0.4 }}
            className="bg-[#141414] border border-[#262626] rounded-2xl p-4"
          >
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">This Week</p>
            <div className="grid grid-cols-7 gap-1.5">
              {weekProgress.map((day) => (
                <div key={day.dayIndex} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-neutral-600 font-medium">{day.dayName.slice(0, 1)}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    day.isRest
                      ? "bg-[#1a1a1a] border border-[#262626] text-neutral-600"
                      : day.completed
                      ? "bg-[#00C853]/20 border border-[#00C853]/40"
                      : day.isFuture
                      ? "bg-[#1a1a1a] border border-[#262626]"
                      : "bg-[#1a1a1a] border border-[#333]"
                  }`}>
                    {day.isRest ? "😴" : day.completed ? "✅" : day.isFuture ? "" : "⬜"}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* WEEKLY REVIEW CARD — Monday only */}
        {weeklyReview && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.4 }}
            className="bg-gradient-to-br from-[#1a1a2e] to-[#141414] border border-[#0066FF]/30 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📋</span>
              <h3 className="font-semibold text-sm text-[#0066FF]">Weekly Review</h3>
              <span className="ml-auto text-xs text-neutral-600">Monday</span>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed">{weeklyReview}</p>
            <Link href="/coach" className="text-xs text-[#0066FF] mt-3 block hover:text-[#4d94ff] transition-colors">
              Chat with your coach →
            </Link>
          </motion.div>
        )}

        {/* DAILY CHALLENGES */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.23, duration: 0.4 }}
          className="bg-[#141414] border border-[#262626] rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Daily Challenges</h3>
            <span className="text-xs text-neutral-600">resets at midnight</span>
          </div>
          <div className="space-y-2">
            {dailyChallenges.map((c, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors ${
                  c.done
                    ? "bg-[#00C853]/10 border border-[#00C853]/20"
                    : "bg-[#1a1a1a] border border-[#262626]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    c.done ? "bg-[#00C853]" : "border-2 border-[#333]"
                  }`}
                >
                  {c.done && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{c.icon}</span>
                <span className={`text-sm flex-1 ${c.done ? "line-through text-neutral-600" : "text-neutral-200"}`}>
                  {c.label}
                </span>
                <span className={`text-xs font-bold ${c.done ? "text-[#00C853]" : "text-[#FFB300]"}`}>
                  +{c.xp} XP
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* DELOAD RECOMMENDATION */}
        {deloadCheck?.deloadNeeded && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.4 }}
            className="bg-gradient-to-br from-orange-950/40 to-[#141414] border border-orange-500/30 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔄</span>
              <h3 className="font-semibold text-sm text-orange-400">Deload Week Recommended</h3>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed">
              {deloadCheck.deloadReason || "Based on your recent training load, your body needs a lighter week."}
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              This week: 60% of normal volume. Rest, recover, come back stronger.
            </p>
            <div className="flex gap-2 mt-3">
              <Link href="/plan" className="px-4 py-2 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-xl text-xs font-semibold">
                View Deload Plan
              </Link>
              <Link href="/coach" className="px-4 py-2 bg-[#1a1a1a] border border-[#262626] text-neutral-400 rounded-xl text-xs font-semibold">
                Ask Coach
              </Link>
            </div>
          </motion.div>
        )}

        {/* PLATEAU BUSTERS */}
        {deloadCheck?.plateaus && deloadCheck.plateaus.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="bg-[#141414] border border-[#262626] rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📊</span>
              <h3 className="font-semibold text-sm">Plateau Detected</h3>
            </div>
            <div className="space-y-4">
              {deloadCheck.plateaus.map((p, i) => (
                <div key={i} className="border border-[#262626] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{p.exercise}</span>
                    <span className="text-xs text-neutral-500">Stuck at {p.stuckWeight} lbs · {p.weeksStuck}w</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-neutral-400">
                    <div><span className="text-[#0066FF] font-semibold">Wk 1:</span> {p.protocol.week1}</div>
                    <div><span className="text-[#0066FF] font-semibold">Wk 2:</span> {p.protocol.week2}</div>
                    <div><span className="text-[#0066FF] font-semibold">Wk 3:</span> {p.protocol.week3}</div>
                    <div><span className="text-[#FFB300] font-semibold">Wk 4:</span> {p.protocol.week4}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/coach" className="text-xs text-[#0066FF] mt-3 block hover:text-[#4d94ff]">
              Ask Coach Alex about this →
            </Link>
          </motion.div>
        )}

        {/* QUICK ACTIONS */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.4 }}
        >
          <div className="grid grid-cols-4 gap-2">
            <Link href="/nutrition" className="flex flex-col items-center gap-1.5 bg-[#141414] border border-[#262626] rounded-2xl py-4 active:scale-95 transition-transform">
              <span className="text-2xl">🍽️</span>
              <span className="text-[10px] text-neutral-400 font-medium">Log Food</span>
            </Link>
            <Link href="/check-in" className="flex flex-col items-center gap-1.5 bg-[#141414] border border-[#262626] rounded-2xl py-4 active:scale-95 transition-transform">
              <span className="text-2xl">📏</span>
              <span className="text-[10px] text-neutral-400 font-medium">Check In</span>
            </Link>
            <Link href="/cardio" className="flex flex-col items-center gap-1.5 bg-[#141414] border border-[#262626] rounded-2xl py-4 active:scale-95 transition-transform">
              <span className="text-2xl">🏃</span>
              <span className="text-[10px] text-neutral-400 font-medium">Cardio</span>
            </Link>
            <Link href="/coach" className="flex flex-col items-center gap-1.5 bg-[#141414] border border-[#262626] rounded-2xl py-4 active:scale-95 transition-transform">
              <span className="text-2xl">💬</span>
              <span className="text-[10px] text-neutral-400 font-medium">Coach</span>
            </Link>
          </div>
        </motion.div>

        {/* HEALTH CHECK-IN */}
        <HealthCheckin />

        {/* MORNING CHECK-IN */}
        <MorningCheckin isPremium={isPremium} messageUsed={messageUsed} />

        {/* RECOVERY SCORE */}
        <RecoveryScore isPremium={isPremium} />

        {/* TRAINING LOAD (ACWR) */}
        <TrainingLoadCard />

        {/* SEASON RANK CARD */}
        <Link href="/season" className="block mx-5">
          <div className="bg-gradient-to-r from-purple-950/30 to-green-950/30 border border-purple-900/30 rounded-3xl p-4 flex items-center gap-4">
            <span className="text-3xl">🏆</span>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Training Season</p>
              <p className="font-bold text-sm text-white">View your rank & leaderboard</p>
            </div>
            <span className="text-gray-500">→</span>
          </div>
        </Link>

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
            <p className="text-sm text-neutral-500 mb-3">
              {today.message || "Rest well. Growth happens here."}
            </p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Active Recovery Options</p>
            <div className="grid grid-cols-2 gap-2 text-left">
              {[
                { name: '20-min Walk', emoji: '🚶', desc: 'Easy zone 1, blood flow' },
                { name: 'Yoga Flow', emoji: '🧘', desc: 'Hips, hamstrings, thoracic' },
                { name: 'Foam Rolling', emoji: '🔵', desc: 'Focus on sore areas' },
                { name: 'Mobility Work', emoji: '🤸', desc: 'Joint health & ROM' },
              ].map(opt => (
                <Link key={opt.name} href="/cardio" className="bg-[#1a1a1a] rounded-xl p-3 hover:bg-[#222] transition-colors">
                  <span className="text-xl">{opt.emoji}</span>
                  <p className="text-xs font-medium mt-1">{opt.name}</p>
                  <p className="text-xs text-neutral-600">{opt.desc}</p>
                </Link>
              ))}
            </div>
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
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Today's Workout</p>
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
                  {today.inProgressLog ? "Resume →" : "Let's Go →"}
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* TODAY'S CARDIO — from plan */}
        {today?.cardio && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="bg-[#141414] border border-[#262626] rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Today's Cardio</p>
                <p className="font-bold mt-1">{today.cardio.title || today.cardio.type}</p>
                <p className="text-neutral-500 text-sm">{today.cardio.duration}min · {today.cardio.intensity || "moderate"}</p>
              </div>
              <Link
                href="/cardio"
                className="bg-[#0066FF]/20 border border-[#0066FF]/30 text-[#0066FF] text-sm font-bold px-4 py-2.5 rounded-xl"
              >
                Log
              </Link>
            </div>
          </motion.div>
        )}
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
