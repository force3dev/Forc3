"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import BottomNav from "@/components/shared/BottomNav";

interface PR {
  exerciseName: string;
  value: number;
  type: string;
}

interface Achievement {
  icon: string;
  name: string;
  unlocked: boolean;
}

interface UserProfile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location?: string | null;
  followers: number;
  following: number;
  workouts: number;
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  totalVolume: number;
  totalCardioKm: number;
  prs: PR[];
  achievements: Achievement[];
}

interface ProfileData {
  user: UserProfile;
  isFollowing: boolean;
  isPending: boolean;
  isOwnProfile: boolean;
}

const LEVEL_NAMES: Record<number, string> = {
  1: "Beginner", 2: "Athlete", 3: "Warrior",
  4: "Elite", 5: "Legend", 6: "Champion",
};

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileData | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/social/user?userId=${userId}`)
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleFollowToggle() {
    if (!data || busy) return;
    setBusy(true);
    if (data.isFollowing) {
      const res = await fetch("/api/social/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: data.user.id }),
      });
      const d = await res.json();
      setData(prev =>
        prev ? { ...prev, isFollowing: false, user: { ...prev.user, followers: d.followerCount ?? prev.user.followers } } : prev
      );
    } else {
      const res = await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: data.user.id }),
      });
      const d = await res.json();
      setData(prev =>
        prev ? {
          ...prev,
          isFollowing: d.status === "following",
          isPending: d.status === "pending",
          user: { ...prev.user, followers: d.followerCount ?? prev.user.followers },
        } : prev
      );
    }
    setBusy(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        User not found
      </main>
    );
  }

  const u = data.user;
  const levelName = LEVEL_NAMES[u.level] || `Level ${u.level}`;
  const xpPct = u.xpToNext > 0 ? Math.min(100, (u.xp / u.xpToNext) * 100) : 100;
  const unlockedAchievements = u.achievements?.filter(a => a.unlocked) || [];

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      {/* Back button */}
      <div className="px-5 pt-8 pb-2 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center text-neutral-400"
        >
          ←
        </button>
        <span className="font-semibold text-sm text-neutral-400">Profile</span>
      </div>

      {/* Banner */}
      <div
        className="h-24 mx-5 rounded-2xl mb-4"
        style={{
          background: "linear-gradient(135deg, #0066FF 0%, #003399 50%, #001a66 100%)",
        }}
      />

      {/* Avatar + Name */}
      <div className="px-6 -mt-8 space-y-3">
        <div className="flex items-end justify-between">
          <div className="w-20 h-20 rounded-2xl border-4 border-black overflow-hidden">
            <Avatar user={{ name: u.displayName || u.username || "Athlete", avatarUrl: u.avatarUrl }} size="xl" />
          </div>
          <div className="flex gap-2">
            {data.isOwnProfile ? (
              <Link
                href="/settings/profile"
                className="px-4 py-2 bg-[#1a1a1a] border border-[#262626] rounded-xl text-sm font-semibold"
              >
                Edit
              </Link>
            ) : (
              <button
                onClick={handleFollowToggle}
                disabled={busy || data.isPending}
                className={`px-5 py-2 rounded-xl font-semibold text-sm ${
                  data.isPending
                    ? "bg-[#1a1a1a] border border-[#262626] text-neutral-500"
                    : data.isFollowing
                    ? "bg-[#1a1a1a] border border-[#262626] text-white"
                    : "bg-[#0066FF] text-white"
                }`}
              >
                {data.isPending ? "Requested" : data.isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </div>

        {/* Name & Bio */}
        <div>
          <h1 className="text-xl font-bold">{u.displayName || u.username || "Athlete"}</h1>
          {u.username && (
            <p className="text-neutral-500 text-sm">@{u.username}</p>
          )}
          {u.bio && (
            <p className="text-neutral-300 text-sm mt-1">{u.bio}</p>
          )}
          {u.location && (
            <p className="text-neutral-500 text-xs mt-1">📍 {u.location}</p>
          )}
        </div>

        {/* Level + XP Bar */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs text-neutral-500">Level {u.level}</span>
              <span className="ml-2 text-xs font-bold text-[#0066FF]">{levelName}</span>
            </div>
            <span className="text-xs text-neutral-600">{u.xp} / {u.xpToNext} XP</span>
          </div>
          <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0066FF] to-[#00C853] rounded-full transition-all"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Link href={`/profile/${u.id}/followers`} className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-center">
            <div className="text-2xl font-black">{u.followers}</div>
            <div className="text-xs text-neutral-500">Followers</div>
          </Link>
          <Link href={`/profile/${u.id}/following`} className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-center">
            <div className="text-2xl font-black">{u.following}</div>
            <div className="text-xs text-neutral-500">Following</div>
          </Link>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-center">
            <div className="text-2xl font-black">{u.workouts}</div>
            <div className="text-xs text-neutral-500">Workouts</div>
          </div>
        </div>

        {/* Training Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <div className="text-xs text-neutral-500 mb-1">Current Streak</div>
            <div className="text-2xl font-bold text-[#0066FF]">
              {u.streak} {u.streak >= 7 ? "🔥" : ""}
            </div>
            <div className="text-xs text-neutral-600">days</div>
          </div>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <div className="text-xs text-neutral-500 mb-1">Volume Lifted</div>
            <div className="text-2xl font-bold">
              {u.totalVolume >= 1000000
                ? `${(u.totalVolume / 1000000).toFixed(1)}M`
                : u.totalVolume >= 1000
                ? `${(u.totalVolume / 1000).toFixed(0)}k`
                : u.totalVolume}
            </div>
            <div className="text-xs text-neutral-600">lbs total</div>
          </div>
        </div>

        {/* Personal Records */}
        {u.prs && u.prs.length > 0 && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <h3 className="font-bold text-sm mb-3">Personal Records</h3>
            <div className="grid grid-cols-3 gap-3">
              {u.prs.slice(0, 6).map((pr, i) => (
                <div key={i} className="text-center">
                  <div className="text-lg font-black text-[#FFB300]">
                    {Math.round(pr.value)}
                  </div>
                  <div className="text-[10px] text-neutral-400 leading-tight truncate">
                    {pr.exerciseName}
                  </div>
                  <div className="text-[10px] text-neutral-600">lbs</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">Achievements</h3>
              <span className="text-xs text-neutral-500">{unlockedAchievements.length} unlocked</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {unlockedAchievements.slice(0, 10).map((a, i) => (
                <div key={i} className="text-center" title={a.name}>
                  <div className="text-2xl">{a.icon}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav active="profile" />
    </main>
  );
}
