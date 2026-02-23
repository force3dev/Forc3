"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/shared/BottomNav";
import Avatar from "@/components/Avatar";

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
    targetCalories?: number;
    targetProtein?: number;
    targetCarbs?: number;
    targetFat?: number;
    onboardingDone?: boolean;
  } | null;
  subscription: { tier: string; status: string } | null;
  streak: { currentStreak: number; longestStreak: number } | null;
}

interface WorkoutHistoryItem {
  id: string;
  startedAt: string;
  completedAt: string;
  duration: number | null;
  totalVolume: number | null;
  workout: { name: string };
}

const GOAL_LABELS: Record<string, string> = {
  fat_loss: "Fat Loss",
  muscle_gain: "Build Muscle",
  strength: "Get Stronger",
  endurance: "Improve Endurance",
  general: "General Fitness",
};

function cmToFtIn(cm: number) {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn % 12);
  return `${ft}'${inches}"`;
}

function WorkoutsList({ count }: { count: number }) {
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/workouts/log?limit=20")
      .then(r => r.ok ? r.json() : { logs: [] })
      .then(d => setWorkouts(d.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">💪</div>
        <p className="text-neutral-500 text-sm">No workouts logged yet</p>
        <Link href="/workout" className="text-[#0066FF] text-sm mt-2 inline-block">Start training →</Link>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {workouts.map(w => (
        <div key={w.id} className="bg-[#141414] border border-[#262626] rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-sm">{w.workout.name}</h4>
              <p className="text-xs text-neutral-500 mt-0.5">
                {new Date(w.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
            <div className="text-right">
              {w.duration != null && w.duration > 0 && <div className="text-xs text-neutral-400">{w.duration} min</div>}
              {w.totalVolume != null && w.totalVolume > 0 && <div className="text-xs text-neutral-500">{Math.round(w.totalVolume).toLocaleString()} lbs</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsView({ data }: { data: ProfileData }) {
  const profile = data.profile;
  const isImperial = profile?.unitSystem !== "metric";
  const weightDisplay = profile?.weight
    ? isImperial ? `${Math.round(profile.weight * 2.2046)} lbs` : `${Math.round(profile.weight)} kg`
    : null;
  const heightDisplay = profile?.height
    ? isImperial ? cmToFtIn(profile.height) : `${Math.round(profile.height)} cm`
    : null;

  return (
    <div className="p-4 space-y-4">
      {/* Training Profile */}
      {profile && (
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-3">
          <div className="text-xs text-neutral-500 uppercase tracking-wide">Training</div>
          {[
            { label: "Goal", value: profile.goal ? GOAL_LABELS[profile.goal] || profile.goal : null },
            { label: "Experience", value: profile.experienceLevel },
            { label: "Training Days", value: profile.trainingDays ? `${profile.trainingDays}x / week` : null },
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
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-3">
          <div className="text-xs text-neutral-500 uppercase tracking-wide">Body</div>
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
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
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
        <Link href="/profile/edit" className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
          <span className="text-sm">Edit Profile</span>
          <span className="text-neutral-500">→</span>
        </Link>
        <Link href="/settings" className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
          <span className="text-sm">Settings</span>
          <span className="text-neutral-500">→</span>
        </Link>
        <Link href="/progress" className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
          <span className="text-sm">Personal Records</span>
          <span className="text-neutral-500">→</span>
        </Link>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"workouts" | "stats">("workouts");

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

  async function handleShare() {
    const url = `${window.location.origin}/user/${data?.username}`;
    if (navigator.share) {
      await navigator.share({ title: `${data?.displayName} on FORC3`, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Profile link copied!");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const profile = data?.profile;

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      {/* Header */}
      <header className="px-5 pt-8 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {data?.username ? `@${data.username}` : "Profile"}
        </h1>
        <div className="flex gap-4">
          <Link href="/settings" className="text-neutral-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Profile Header — Instagram Style */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-5 mb-4">
          {/* Avatar */}
          <Avatar
            user={{ avatarUrl: data?.avatarUrl, name: data?.displayName || profile?.name || data?.email || "Athlete" }}
            size="xl"
            className="border-2 border-[#0066FF]/40 bg-[#0066FF]/20"
          />

          {/* Stats Row */}
          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <div className="text-xl font-bold">{data?.workoutsCount ?? 0}</div>
              <div className="text-xs text-neutral-500">Workouts</div>
            </div>
            <Link href={`/profile/${data?.id}/followers`} className="text-center">
              <div className="text-xl font-bold">{data?.followersCount ?? 0}</div>
              <div className="text-xs text-neutral-500">Followers</div>
            </Link>
            <Link href={`/profile/${data?.id}/following`} className="text-center">
              <div className="text-xl font-bold">{data?.followingCount ?? 0}</div>
              <div className="text-xs text-neutral-500">Following</div>
            </Link>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mb-3">
          <h2 className="font-bold text-base">{data?.displayName || profile?.name || "Athlete"}</h2>
          {profile?.goal && (
            <p className="text-xs text-neutral-500 mt-0.5">{GOAL_LABELS[profile.goal] || profile.goal}</p>
          )}
          {data?.bio && <p className="text-sm text-neutral-300 mt-1">{data.bio}</p>}
          {!data?.username && (
            <Link href="/onboarding/username" className="text-xs text-[#0066FF] mt-1 inline-block">Set username →</Link>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            href="/profile/edit"
            className="flex-1 py-2 bg-[#1a1a1a] border border-[#262626] rounded-lg font-semibold text-sm text-center"
          >
            Edit Profile
          </Link>
          <button
            onClick={handleShare}
            className="flex-1 py-2 bg-[#1a1a1a] border border-[#262626] rounded-lg font-semibold text-sm"
          >
            Share Profile
          </button>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <div className="flex border-y border-[#1a1a1a] py-3 mb-0">
        <div className="flex-1 text-center border-r border-[#1a1a1a]">
          <div className="text-lg font-bold text-orange-400">{data?.streak?.currentStreak ?? 0} 🔥</div>
          <div className="text-xs text-neutral-500">Streak</div>
        </div>
        <div className="flex-1 text-center border-r border-[#1a1a1a]">
          <div className="text-lg font-bold text-white">{data?.streak?.longestStreak ?? 0}</div>
          <div className="text-xs text-neutral-500">Best Streak</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-lg font-bold text-[#0066FF] capitalize">
            {data?.subscription?.tier || "Free"}
          </div>
          <div className="text-xs text-neutral-500">Plan</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1a1a1a]">
        <button
          onClick={() => setActiveTab("workouts")}
          className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
            activeTab === "workouts" ? "text-white border-b-2 border-white" : "text-neutral-500"
          }`}
        >
          💪 Workouts
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
            activeTab === "stats" ? "text-white border-b-2 border-white" : "text-neutral-500"
          }`}
        >
          📊 Stats
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "workouts" ? (
        <WorkoutsList count={data?.workoutsCount ?? 0} />
      ) : (
        <StatsView data={data!} />
      )}

      {/* Sign Out */}
      <div className="px-5 pb-6">
        <button
          onClick={handleSignOut}
          className="w-full py-3 text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Sign out
        </button>
      </div>

      <BottomNav active="profile" />
    </main>
  );
}
