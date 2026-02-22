"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserProfile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isPrivate: boolean;
  followers: number;
  following: number;
  workouts: number;
}

interface SharedWorkout {
  id: string;
  title: string | null;
  description: string | null;
  workout: { name: string };
  _count: { likes: number; copies: number };
}

interface ProfileData {
  user: UserProfile;
  isFollowing: boolean;
  isPending: boolean;
  isBlocked: boolean;
  sharedWorkouts: SharedWorkout[];
}

function Avatar({ user }: { user: { displayName?: string | null; username?: string | null; avatarUrl?: string | null } }) {
  return (
    <div className="w-20 h-20 rounded-full bg-[#0066FF]/20 border-2 border-[#0066FF]/30 flex items-center justify-center overflow-hidden">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[#0066FF] font-bold text-2xl">
          {(user.displayName || user.username || "?")[0].toUpperCase()}
        </span>
      )}
    </div>
  );
}

export default function UserProfilePage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/social/user?username=${encodeURIComponent(params.username)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.username]);

  const handleFollow = async () => {
    if (!data || followLoading) return;
    setFollowLoading(true);
    if (data.isFollowing) {
      await fetch("/api/social/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id }),
      });
      setData(prev => prev ? { ...prev, isFollowing: false } : prev);
    } else {
      const res = await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id }),
      });
      const r = await res.json();
      setData(prev => prev ? {
        ...prev,
        isFollowing: r.status === "following",
        isPending: r.status === "pending",
      } : prev);
    }
    setFollowLoading(false);
  };

  const handleCopyWorkout = async (sharedWorkoutId: string) => {
    const res = await fetch("/api/social/copy-workout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sharedWorkoutId }),
    });
    if (res.ok) {
      const d = await res.json();
      router.push(`/workout/edit/${d.workoutId}`);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!data || data.isBlocked) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="font-bold text-lg mb-2">User not available</h2>
        <button onClick={() => router.back()} className="text-[#0066FF] text-sm mt-4">← Go back</button>
      </main>
    );
  }

  const { user, isFollowing, isPending, sharedWorkouts } = data;
  const canSeeContent = !user.isPrivate || isFollowing;

  return (
    <main className="min-h-screen bg-black text-white pb-8">
      <header className="flex items-center gap-3 px-5 pt-8 pb-4">
        <button onClick={() => router.back()} className="text-neutral-400 text-sm">← Back</button>
      </header>

      {/* Profile Header */}
      <div className="px-5 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar user={user} />
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-xl font-bold">{user.followers}</div>
              <div className="text-xs text-neutral-500">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{user.following}</div>
              <div className="text-xs text-neutral-500">Following</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{user.workouts}</div>
              <div className="text-xs text-neutral-500">Workouts</div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="font-bold text-lg">{user.displayName || user.username}</h2>
          {user.username && <p className="text-neutral-500 text-sm">@{user.username}</p>}
          {user.bio && <p className="text-sm mt-2 text-neutral-300">{user.bio}</p>}
        </div>

        {/* Follow/Unfollow */}
        <div className="flex gap-2">
          {isFollowing ? (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className="flex-1 py-2.5 border border-[#262626] rounded-xl font-semibold text-sm transition-colors hover:border-neutral-500"
            >
              Following
            </button>
          ) : isPending ? (
            <button
              disabled
              className="flex-1 py-2.5 border border-[#262626] rounded-xl font-semibold text-sm text-neutral-500 cursor-not-allowed"
            >
              Requested
            </button>
          ) : (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className="flex-1 py-2.5 bg-[#0066FF] rounded-xl font-semibold text-sm hover:bg-[#0052CC] transition-colors"
            >
              Follow{user.isPrivate ? "" : ""}
            </button>
          )}
        </div>
      </div>

      {/* Shared Workouts */}
      <div className="px-5">
        <h3 className="text-xs text-neutral-500 uppercase tracking-wide font-semibold mb-3">
          Shared Workouts
        </h3>

        {!canSeeContent ? (
          <div className="text-center py-12 text-neutral-500 text-sm">
            <div className="text-3xl mb-3">🔒</div>
            <p>This account is private.</p>
            <p className="mt-1">Follow to see their workouts.</p>
          </div>
        ) : sharedWorkouts.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-sm">
            <div className="text-3xl mb-3">🏋️</div>
            <p>No shared workouts yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sharedWorkouts.map(w => (
              <div key={w.id} className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
                <h4 className="font-bold">{w.title || w.workout.name}</h4>
                {w.description && (
                  <p className="text-neutral-500 text-xs mt-1 line-clamp-2">{w.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-3 text-xs text-neutral-500">
                    <span>❤️ {w._count.likes}</span>
                    <span>📋 {w._count.copies} copies</span>
                  </div>
                  <button
                    onClick={() => handleCopyWorkout(w.id)}
                    className="px-3 py-1.5 bg-[#0066FF]/20 text-[#0066FF] rounded-lg text-xs font-semibold hover:bg-[#0066FF]/30 transition-colors"
                  >
                    Copy Workout
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
