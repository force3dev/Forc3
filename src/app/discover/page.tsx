"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

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

function Avatar({ user }: { user: { displayName?: string | null; username?: string | null; avatarUrl?: string | null } }) {
  return (
    <div className="w-10 h-10 rounded-full bg-[#0066FF]/20 border border-[#0066FF]/30 flex items-center justify-center overflow-hidden flex-shrink-0">
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

function UserCard({ user, onFollowToggle }: { user: UserResult; onFollowToggle: (id: string) => void }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3 py-3">
      <button onClick={() => user.username && router.push(`/user/${user.username}`)}>
        <Avatar user={user} />
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
        <Avatar user={workout.user} />
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

export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [trending, setTrending] = useState<TrendingWorkout[]>([]);
  const [popularUsers, setPopularUsers] = useState<UserResult[]>([]);
  const [activeTab, setActiveTab] = useState<"trending" | "users">("trending");
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Load popular users
    fetch("/api/social/search?q=a")
      .then(r => r.json())
      .then(d => setPopularUsers(d.users || []));
  }, []);

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
            {(["trending", "users"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? "text-white border-b-2 border-[#0066FF]"
                    : "text-neutral-500"
                }`}
              >
                {tab === "trending" ? "Trending Workouts" : "Popular Athletes"}
              </button>
            ))}
          </div>

          <div className="px-5">
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
