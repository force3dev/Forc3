"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/shared/BottomNav";
import Avatar from "@/components/Avatar";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface UserResult {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  followerCount: number;
  isFollowing: boolean;
  isPrivate: boolean;
}

interface TrendingWorkout {
  id: string;
  title: string | null;
  description: string | null;
  createdAt: string;
  workout: { name: string };
  user: { username: string | null; displayName: string | null; avatarUrl: string | null };
  _count: { likes: number; comments: number; copies: number };
}

interface FeedActivity {
  id: string;
  type: string;
  data: Record<string, any>;
  createdAt: string;
  user: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ActivityCard({ activity }: { activity: FeedActivity }) {
  const router = useRouter();
  const data = activity.data;
  const name = activity.user.displayName || activity.user.username || "Someone";

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
          <Avatar user={{ avatarUrl: activity.user.avatarUrl, name: activity.user.displayName || activity.user.username || "Athlete" }} />
        </button>
        <div className="flex-1 min-w-0">
          {c}
          <p className="text-xs text-neutral-600 mt-1.5">{timeAgo(activity.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

function UserCard({ user, onFollowToggle }: { user: UserResult; onFollowToggle: (id: string) => void }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3 py-3">
      <button onClick={() => user.username && router.push(`/user/${user.username}`)}>
        <Avatar user={{ avatarUrl: user.avatarUrl, name: user.displayName || user.username || "Athlete" }} />
      </button>
      <div className="flex-1 min-w-0" onClick={() => user.username && router.push(`/user/${user.username}`)}>
        <div className="font-semibold text-sm truncate">{user.displayName || user.username}</div>
        <div className="text-xs text-neutral-500">
          {user.username ? `@${user.username}` : ""} · {user.followerCount} followers
        </div>
      </div>
      <button
        onClick={() => onFollowToggle(user.id)}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
          user.isFollowing
            ? "border border-[#262626] text-neutral-400"
            : "bg-[#0066FF] text-white"
        }`}
      >
        {user.isFollowing ? "Following" : user.isPrivate ? "Request" : "Follow"}
      </button>
    </div>
  );
}

function WorkoutCard({ workout }: { workout: TrendingWorkout }) {
  const router = useRouter();
  return (
    <div
      className="bg-[#141414] border border-[#262626] rounded-2xl p-4 cursor-pointer hover:border-[#0066FF]/30 transition-colors"
      onClick={() => router.push(`/user/${workout.user.username}`)}
    >
      <div className="flex items-center gap-2 mb-3">
        <Avatar user={{ avatarUrl: workout.user.avatarUrl, name: workout.user.displayName || workout.user.username || "Athlete" }} />
        <div>
          <div className="text-sm font-semibold">{workout.user.displayName || workout.user.username}</div>
          <div className="text-xs text-neutral-500">{workout.user.username ? `@${workout.user.username}` : ""}</div>
        </div>
      </div>
      <h3 className="font-bold text-base mb-1">{workout.title || workout.workout.name}</h3>
      {workout.description && (
        <p className="text-neutral-500 text-xs mb-3 line-clamp-2">{workout.description}</p>
      )}
      <div className="flex gap-4 text-xs text-neutral-500">
        <span>❤️ {workout._count.likes}</span>
        <span>💬 {workout._count.comments}</span>
        <span>📋 {workout._count.copies} copies</span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [trending, setTrending] = useState<TrendingWorkout[]>([]);
  const [popularUsers, setPopularUsers] = useState<UserResult[]>([]);
  const [feed, setFeed] = useState<FeedActivity[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "trending" | "users">("feed");
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Load popular users
    fetch("/api/social/search?q=a")
      .then(r => r.json())
      .then(d => setPopularUsers(d.users || []));
  }, []);

  useEffect(() => {
    if (activeTab === "feed" && feed.length === 0) {
      setFeedLoading(true);
      fetch("/api/social/feed")
        .then(r => r.json())
        .then(d => setFeed(d.activities || []))
        .finally(() => setFeedLoading(false));
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (q: string) => {
    setSearch(q);
    clearTimeout(debounceRef.current);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/social/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.users || []);
      setSearchLoading(false);
    }, 400);
  };

  const handleFollowToggle = async (userId: string) => {
    const user = [...searchResults, ...popularUsers].find(u => u.id === userId);
    if (!user) return;

    if (user.isFollowing) {
      await fetch("/api/social/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const update = (prev: UserResult[]) =>
        prev.map(u => u.id === userId ? { ...u, isFollowing: false } : u);
      setSearchResults(update);
      setPopularUsers(update);
    } else {
      await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const update = (prev: UserResult[]) =>
        prev.map(u => u.id === userId ? { ...u, isFollowing: true } : u);
      setSearchResults(update);
      setPopularUsers(update);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold mb-4">Discover</h1>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search athletes..."
            className="w-full bg-[#141414] border border-[#262626] rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#0066FF] focus:outline-none"
          />
        </div>
      </header>

      {search.length > 1 ? (
        <div className="px-5">
          <p className="text-xs text-neutral-500 mb-3 uppercase tracking-wide">Athletes</p>
          {searchLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <p className="text-neutral-500 text-sm py-8 text-center">No athletes found for &quot;{search}&quot;</p>
          ) : (
            <div className="divide-y divide-[#1a1a1a]">
              {searchResults.map(u => (
                <UserCard key={u.id} user={u} onFollowToggle={handleFollowToggle} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex border-b border-[#1a1a1a] mb-4">
            {(["feed", "trending", "users"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? "text-white border-b-2 border-[#0066FF]"
                    : "text-neutral-500"
                }`}
              >
                {tab === "feed" ? "Feed" : tab === "trending" ? "Trending" : "Athletes"}
              </button>
            ))}
          </div>

          <div className="px-5">
            {activeTab === "feed" && (
              feedLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : feed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-5xl mb-4">🤝</div>
                  <h2 className="font-bold text-lg mb-2">Your feed is empty</h2>
                  <p className="text-neutral-500 text-sm mb-6">
                    Follow other athletes to see their workouts, PRs, and milestones here.
                  </p>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="px-6 py-3 bg-[#0066FF] text-white rounded-xl font-semibold text-sm"
                  >
                    Find People to Follow
                  </button>
                </div>
              ) : (
                <div className="-mx-5">
                  {feed.map(a => <ActivityCard key={a.id} activity={a} />)}
                </div>
              )
            )}

            {activeTab === "trending" && (
              trending.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-sm">
                  <p className="text-3xl mb-3">🏋️</p>
                  <p>No shared workouts yet.</p>
                  <p className="mt-1">Be the first to share yours!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trending.map(w => <WorkoutCard key={w.id} workout={w} />)}
                </div>
              )
            )}

            {activeTab === "users" && (
              <div className="divide-y divide-[#1a1a1a]">
                {popularUsers.map(u => (
                  <UserCard key={u.id} user={u} onFollowToggle={handleFollowToggle} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <BottomNav active="discover" />
    </main>
  );
}
