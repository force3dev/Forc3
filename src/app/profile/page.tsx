"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/shared/BottomNav";

interface ProfileData {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  workoutsCount: number;
  profile: {
    name?: string;
    age?: number;
    height?: number;
    weight?: number;
    unitSystem?: string;
    goal?: string;
    experienceLevel?: string;
    trainingDays?: number;
    equipment?: string;
    sport?: string;
    injuries?: string;
    bmr?: number;
    tdee?: number;
    targetCalories?: number;
    targetProtein?: number;
    targetCarbs?: number;
    targetFat?: number;
    onboardingDone?: boolean;
  } | null;
  subscription: { tier: string; status: string } | null;
  streak: { currentStreak: number; longestStreak: number } | null;
}

const GOAL_LABELS: Record<string, string> = {
  fat_loss: "Fat Loss",
  muscle_gain: "Build Muscle",
  strength: "Get Stronger",
  endurance: "Improve Endurance",
  general: "General Fitness",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Beginner (0–1 yr)",
  intermediate: "Intermediate (1–3 yr)",
  advanced: "Advanced (3+ yr)",
};

const EQUIPMENT_LABELS: Record<string, string> = {
  full_gym: "Full Gym",
  home_gym: "Home Gym",
  minimal: "Minimal (Dumbbells)",
  bodyweight: "Bodyweight Only",
};

function cmToFtIn(cm: number) {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn % 12);
  return `${ft}'${inches}"`;
}

export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/profile")
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  const profile = data?.profile;
  const isImperial = profile?.unitSystem !== "metric";

  const weightDisplay = profile?.weight
    ? isImperial ? `${Math.round(profile.weight * 2.2046)} lbs` : `${Math.round(profile.weight)} kg`
    : null;

  const heightDisplay = profile?.height
    ? isImperial ? cmToFtIn(profile.height) : `${Math.round(profile.height)} cm`
    : null;

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <header className="px-6 pt-8 pb-4">
        <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
        <h1 className="text-2xl font-bold mt-1">Profile</h1>
      </header>

      <div className="px-6 space-y-4">
        {/* Social Identity Card */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-[#0066FF]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {data?.avatarUrl ? (
                <img src={data.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#0066FF] font-bold text-2xl">
                  {(data?.displayName || profile?.name || data?.email || "?")[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg">{data?.displayName || profile?.name || "Athlete"}</div>
              {data?.username ? (
                <div className="text-sm text-neutral-500">@{data.username}</div>
              ) : (
                <Link href="/onboarding/username" className="text-xs text-[#0066FF]">Set username →</Link>
              )}
              {data?.bio && (
                <p className="text-xs text-neutral-400 mt-1 truncate">{data.bio}</p>
              )}
            </div>
          </div>

          {/* Social Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
              <div className="text-xl font-bold">{data?.followersCount ?? 0}</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Followers</div>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
              <div className="text-xl font-bold">{data?.followingCount ?? 0}</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Following</div>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
              <div className="text-xl font-bold">{data?.workoutsCount ?? 0}</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Workouts</div>
            </div>
          </div>

          {/* Streak */}
          {data?.streak && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-[#0066FF]">{data.streak.currentStreak}</div>
                <div className="text-xs text-neutral-500 mt-1">day streak 🔥</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{data.streak.longestStreak}</div>
                <div className="text-xs text-neutral-500 mt-1">best streak</div>
              </div>
            </div>
          )}
        </div>

        {/* Subscription */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Plan</div>
              <div className="font-bold capitalize">
                {data?.subscription?.tier || "Free"}
                {data?.subscription?.tier === "free" && (
                  <span className="ml-2 text-xs text-neutral-500">· Limited features</span>
                )}
              </div>
            </div>
            {data?.subscription?.tier === "free" && (
              <div className="px-4 py-2 bg-[#0066FF] rounded-xl text-sm font-bold">
                Upgrade
              </div>
            )}
          </div>
        </div>

        {/* Training Profile */}
        {profile && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-3">
            <div className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Training Profile</div>

            {[
              { label: "Goal", value: profile.goal ? GOAL_LABELS[profile.goal] || profile.goal : null },
              { label: "Experience", value: profile.experienceLevel ? EXPERIENCE_LABELS[profile.experienceLevel] || profile.experienceLevel : null },
              { label: "Training Days", value: profile.trainingDays ? `${profile.trainingDays}x / week` : null },
              { label: "Equipment", value: profile.equipment ? EQUIPMENT_LABELS[profile.equipment] || profile.equipment : null },
              { label: "Sport Focus", value: profile.sport ? profile.sport.charAt(0).toUpperCase() + profile.sport.slice(1) : null },
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-neutral-500">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Body Stats */}
        {profile && (profile.weight || profile.height || profile.age) && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-3">
            <div className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Body Stats</div>

            {[
              { label: "Age", value: profile.age ? `${profile.age} years` : null },
              { label: "Weight", value: weightDisplay },
              { label: "Height", value: heightDisplay },
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-neutral-500">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Nutrition Targets */}
        {profile?.targetCalories && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
            <div className="text-xs text-neutral-500 uppercase tracking-wide mb-3">Daily Targets</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Calories", value: `${Math.round(profile.targetCalories!)} kcal`, color: "text-[#0066FF]" },
                { label: "Protein", value: `${Math.round(profile.targetProtein!)}g`, color: "text-[#00C853]" },
                { label: "Carbs", value: `${Math.round(profile.targetCarbs!)}g`, color: "text-white" },
                { label: "Fat", value: `${Math.round(profile.targetFat!)}g`, color: "text-[#FFB300]" },
              ].map(m => (
                <div key={m.label} className="bg-[#0a0a0a] rounded-xl p-3">
                  <div className="text-xs text-neutral-500">{m.label}</div>
                  <div className={`text-lg font-bold mt-0.5 ${m.color}`}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
          <Link
            href="/settings/profile"
            className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors"
          >
            <span className="text-sm">Edit Profile</span>
            <span className="text-neutral-500">→</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors"
          >
            <span className="text-sm">Settings</span>
            <span className="text-neutral-500">→</span>
          </Link>
          <Link
            href="/history"
            className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors"
          >
            <span className="text-sm">Workout History</span>
            <span className="text-neutral-500">→</span>
          </Link>
          <Link
            href="/progress"
            className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors"
          >
            <span className="text-sm">Personal Records</span>
            <span className="text-neutral-500">→</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-5 py-4 text-sm text-red-400 hover:text-red-300 hover:bg-[#1a1a1a] transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </div>

      <BottomNav active="profile" />
    </main>
  );
}
