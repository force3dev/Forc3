"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/shared/BottomNav";
import PullToRefreshWrapper from "@/components/shared/PullToRefreshWrapper";

interface ActivityUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

interface FeedActivity {
  id: string;
  type: string;
  data: Record<string, any>; // JSON data field
  createdAt: string;
  user: ActivityUser;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Avatar({ user }: { user: ActivityUser }) {
  return (
    <div className="w-10 h-10 rounded-full bg-[#0066FF]/20 border border-[#0066FF]/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[#0066FF] font-bold text-sm">
          {(user.displayName || user.username || "?")[0].toUpperCase()}
        </span>
      )}
    </div>
  );
}

function ActivityCard({ activity }: { activity: FeedActivity }) {
  const router = useRouter();
  const data = activity.data;
  const name = activity.user.displayName || activity.user.username || "Someone";
  const handle = activity.user.username ? `@${activity.user.username}` : "";

  const content = () => {
    switch (activity.type) {
      case "workout_completed":
        return (
          <div>
            <p className="text-sm">
              <span className="font-semibold">{name}</span>
              {" "}completed{" "}
              <span className="text-[#0066FF]">{String(data.workoutName || "a workout")}</span>
            </p>
            <div className="flex gap-3 mt-1.5 text-xs text-neutral-500">
              {data.duration && <span>{String(data.duration)} min</span>}
              {data.exercises && <span>{String(data.exercises)} exercises</span>}
              {Number(data.prs) > 0 && (
                <span className="text-[#FFB300]">🏆 {String(data.prs)} PRs</span>
              )}
            </div>
          </div>
        );
      case "pr_hit":
        return (
          <div>
            <p className="text-sm">
              <span className="font-semibold">{name}</span>
              {" "}hit a new PR on{" "}
              <span className="text-[#0066FF]">{String(data.exercise || "")}</span>
            </p>
            {data.weight && data.reps && (
              <p className="text-xl font-bold mt-1">
                {String(data.weight)} lbs × {String(data.reps)}
              </p>
            )}
          </div>
        );
      case "streak_milestone":
        return (
          <p className="text-sm">
            <span className="font-semibold">{name}</span>
            {" "}reached a{" "}
            <span className="text-orange-400 font-bold">{String(data.days)} day streak 🔥</span>
          </p>
        );
      case "cardio_completed":
        return (
          <div>
            <p className="text-sm">
              <span className="font-semibold">{name}</span>
              {" "}completed a{" "}
              <span className="text-[#0066FF] capitalize">{String(data.cardioType || "cardio")}</span>
              {" "}session
            </p>
            <div className="flex gap-3 mt-1.5 text-xs text-neutral-500">
              {data.duration && <span>{Math.round(Number(data.duration) / 60)} min</span>}
              {data.distance && <span>{Number(data.distance).toFixed(1)} mi</span>}
              {data.calories && <span>{Math.round(Number(data.calories))} cal</span>}
            </div>
          </div>
        );
      case "started_program":
        return (
          <p className="text-sm">
            <span className="font-semibold">{name}</span>
            {" "}started training on FORC3 🚀
          </p>
        );
      default:
        return null;
    }
  };

  const c = content();
  if (!c) return null;

  return (
    <div className="px-4 py-4 border-b border-[#1a1a1a]">
      <div className="flex items-start gap-3">
        <button onClick={() => activity.user.username && router.push(`/user/${activity.user.username}`)}>
          <Avatar user={activity.user} />
        </button>
        <div className="flex-1 min-w-0">
          {c}
          <p className="text-xs text-neutral-600 mt-1.5">{timeAgo(activity.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="text-5xl mb-4">🤝</div>
      <h2 className="font-bold text-lg mb-2">Your feed is empty</h2>
      <p className="text-neutral-500 text-sm mb-6">
        Follow other athletes to see their workouts, PRs, and milestones here.
      </p>
      <Link
        href="/discover"
        className="px-6 py-3 bg-[#0066FF] text-white rounded-xl font-semibold text-sm"
      >
        Find People to Follow
      </Link>
    </div>
  );
}

export default function HomePage() {
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadFeed() {
    const res = await fetch("/api/social/feed");
    if (res.ok) {
      const data = await res.json();
      setActivities(data.activities || []);
    }
    setLoading(false);
  }

  useEffect(() => { loadFeed(); }, []);

  return (
    <PullToRefreshWrapper onRefresh={loadFeed}>
      <main className="min-h-screen bg-black text-white pb-24">
        <header className="px-5 pt-8 pb-4 flex items-center justify-between border-b border-[#1a1a1a]">
          <div className="text-xl font-bold tracking-tight">FORC3</div>
          <Link href="/social/notifications" className="relative p-2">
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </Link>
        </header>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <EmptyFeed />
        ) : (
          <div>
            {activities.map(a => (
              <ActivityCard key={a.id} activity={a} />
            ))}
          </div>
        )}

        <BottomNav active="home" />
      </main>
    </PullToRefreshWrapper>
  );
}
