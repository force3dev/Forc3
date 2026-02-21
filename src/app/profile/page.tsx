"use client";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ProfileData {
  user: { id: string; email: string; name?: string };
  profile: {
    age?: number;
    heightCm?: number;
    weightKg?: number;
    unitSystem?: string;
    goal?: string;
    experience?: string;
    trainingDays?: string;
    sports?: string;
    injuries?: string;
  } | null;
  plan: {
    name?: string;
    splitType?: string;
    totalWeeks?: number;
    currentWeek?: number;
  } | null;
}

const GOAL_LABELS: Record<string, string> = {
  fat_loss: "Fat Loss",
  maintenance: "Maintenance",
  muscle_gain: "Build Muscle",
  performance: "Performance",
  event_training: "Event Training",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function cmToFtIn(cm: number) {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn % 12);
  return `${ft}'${inches}"`;
}

function kgToLbs(kg: number) {
  return Math.round(kg * 2.20462);
}

export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/profile")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const profile = data?.profile;
  const isImperial = !profile?.unitSystem || profile.unitSystem === "imperial";

  const heightDisplay = profile?.heightCm
    ? isImperial ? cmToFtIn(profile.heightCm) : `${Math.round(profile.heightCm)} cm`
    : null;

  const weightDisplay = profile?.weightKg
    ? isImperial ? `${kgToLbs(profile.weightKg)} lbs` : `${Math.round(profile.weightKg)} kg`
    : null;

  const sports = profile?.sports ? JSON.parse(profile.sports) as string[] : [];
  const injuries = profile?.injuries ? JSON.parse(profile.injuries) as string[] : [];

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <header className="p-6 pb-4">
        <div className="text-xs font-semibold tracking-widest text-neutral-500">FORCE3</div>
        <h1 className="text-xl font-semibold mt-1">Profile</h1>
      </header>

      <div className="px-6 space-y-4">
        {/* Account */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="text-xs text-neutral-500 uppercase tracking-wide">Account</div>
          {data?.user?.name && (
            <div className="flex justify-between">
              <span className="text-sm text-neutral-400">Name</span>
              <span className="text-sm">{data.user.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-neutral-400">Email</span>
            <span className="text-sm text-neutral-300">{data?.user?.email}</span>
          </div>
        </div>

        {/* Stats */}
        {profile && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="text-xs text-neutral-500 uppercase tracking-wide">Your Stats</div>
            {profile.goal && (
              <div className="flex justify-between">
                <span className="text-sm text-neutral-400">Goal</span>
                <span className="text-sm">{GOAL_LABELS[profile.goal] || profile.goal}</span>
              </div>
            )}
            {profile.experience && (
              <div className="flex justify-between">
                <span className="text-sm text-neutral-400">Experience</span>
                <span className="text-sm">{EXPERIENCE_LABELS[profile.experience] || profile.experience}</span>
              </div>
            )}
            {profile.age && (
              <div className="flex justify-between">
                <span className="text-sm text-neutral-400">Age</span>
                <span className="text-sm">{profile.age}</span>
              </div>
            )}
            {heightDisplay && (
              <div className="flex justify-between">
                <span className="text-sm text-neutral-400">Height</span>
                <span className="text-sm">{heightDisplay}</span>
              </div>
            )}
            {weightDisplay && (
              <div className="flex justify-between">
                <span className="text-sm text-neutral-400">Weight</span>
                <span className="text-sm">{weightDisplay}</span>
              </div>
            )}
            {sports.length > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-neutral-400">Sports</span>
                <span className="text-sm capitalize">{sports.join(", ")}</span>
              </div>
            )}
            {injuries.length > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-neutral-400">Limitations</span>
                <span className="text-sm text-neutral-300">{injuries.length} noted</span>
              </div>
            )}
          </div>
        )}

        {/* Current Plan */}
        {data?.plan && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="text-xs text-neutral-500 uppercase tracking-wide">Training Plan</div>
            {data.plan.name && (
              <div className="flex justify-between">
                <span className="text-sm text-neutral-400">Plan</span>
                <span className="text-sm">{data.plan.name}</span>
              </div>
            )}
            {data.plan.splitType && (
              <div className="flex justify-between">
                <span className="text-sm text-neutral-400">Split</span>
                <span className="text-sm">{data.plan.splitType}</span>
              </div>
            )}
            {data.plan.currentWeek && (
              <div className="flex justify-between">
                <span className="text-sm text-neutral-400">Progress</span>
                <span className="text-sm">Week {data.plan.currentWeek} of {data.plan.totalWeeks}</span>
              </div>
            )}
            <Link
              href="/plan"
              className="block text-center mt-2 py-2.5 border border-neutral-700 text-white text-sm font-medium rounded-xl hover:border-neutral-500 transition-colors"
            >
              View Full Plan
            </Link>
          </div>
        )}

        {/* Actions */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="text-xs text-neutral-500 uppercase tracking-wide">Actions</div>
          <Link
            href="/history"
            className="block py-3 text-sm text-neutral-300 hover:text-white transition-colors"
          >
            Workout History →
          </Link>
          <div className="border-t border-neutral-800" />
          <button
            onClick={handleSignOut}
            className="w-full py-3 text-sm text-red-400 hover:text-red-300 transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-neutral-900 px-6 py-4">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link href="/dashboard" className="flex flex-col items-center text-neutral-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/plan" className="flex flex-col items-center text-neutral-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs mt-1">Plan</span>
          </Link>
          <Link href="/nutrition" className="flex flex-col items-center text-neutral-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs mt-1">Nutrition</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
