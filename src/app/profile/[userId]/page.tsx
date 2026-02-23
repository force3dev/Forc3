"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import BottomNav from "@/components/shared/BottomNav";

interface UserProfile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followers: number;
  following: number;
  workouts: number;
  level: number;
  streak: number;
}

interface ProfileData {
  user: UserProfile;
  isFollowing: boolean;
  isPending: boolean;
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileData | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/social/user?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
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
      setData((prev) => (prev ? { ...prev, isFollowing: false, user: { ...prev.user, followers: d.followerCount ?? prev.user.followers } } : prev));
    } else {
      const res = await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: data.user.id }),
      });
      const d = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: d.status === "following",
              isPending: d.status === "pending",
              user: { ...prev.user, followers: d.followerCount ?? prev.user.followers },
            }
          : prev
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
  if (!data) return <main className="min-h-screen bg-black text-white flex items-center justify-center">User not found</main>;

  const u = data.user;

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <header className="px-6 pt-8 pb-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center text-neutral-400">
          ←
        </button>
        <span className="font-semibold">Profile</span>
      </header>

      <div className="px-6 space-y-5">
        <div className="flex items-center gap-4">
          <Avatar user={{ name: u.displayName || u.username || "Athlete", avatarUrl: u.avatarUrl }} size="xl" />
          <div>
            <h1 className="text-xl font-bold">{u.displayName || u.username || "Athlete"}</h1>
            {u.username && <p className="text-neutral-500 text-sm">@{u.username} · Level {u.level}</p>}
            {u.bio && <p className="text-neutral-400 text-sm mt-1">{u.bio}</p>}
          </div>
        </div>

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

        <button
          onClick={handleFollowToggle}
          disabled={busy || data.isPending}
          className={`w-full py-3 rounded-xl font-semibold ${
            data.isPending
              ? "bg-[#1a1a1a] border border-[#262626] text-neutral-500"
              : data.isFollowing
              ? "bg-[#1a1a1a] border border-[#262626] text-white"
              : "bg-[#0066FF] text-white"
          }`}
        >
          {data.isPending ? "Requested" : data.isFollowing ? "Following" : "Follow"}
        </button>
      </div>

      <BottomNav active="profile" />
    </main>
  );
}
