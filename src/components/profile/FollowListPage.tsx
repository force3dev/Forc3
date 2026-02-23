"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";

type FollowItem = {
  id: string;
  username: string | null;
  name: string;
  avatarUrl: string | null;
  level: number;
  streak: number;
  isFollowing: boolean;
};

interface Props {
  userId: string;
  mode: "followers" | "following";
}

export default function FollowListPage({ userId, mode }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<FollowItem[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/social/${mode}/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setTotal(d.total || 0);
      })
      .finally(() => setLoading(false));
  }, [mode, userId]);

  async function toggleFollow(targetUserId: string, isFollowing: boolean) {
    const method = isFollowing ? "DELETE" : "POST";
    await fetch("/api/social/follow", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    setItems((prev) => prev.map((u) => (u.id === targetUserId ? { ...u, isFollowing: !isFollowing } : u)));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(q) || (item.username || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  const title = mode === "followers" ? "Followers" : "Following";

  return (
    <main className="min-h-screen bg-black text-white pb-6">
      <header className="px-5 pt-8 pb-4">
        <button onClick={() => router.back()} className="text-sm text-neutral-400">
          ← Back to Profile
        </button>
        <h1 className="mt-3 text-xl font-bold uppercase">
          {title} ({total})
        </h1>
      </header>

      <div className="px-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${title.toLowerCase()}...`}
          className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0066FF]"
        />
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-5 mt-4 space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-[#141414] border border-[#262626] rounded-xl p-3">
              <Link href={`/profile/${item.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar user={{ avatarUrl: item.avatarUrl, name: item.name }} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{item.name}</p>
                  <p className="text-xs text-neutral-500 truncate">
                    @{item.username || "athlete"} · Level {item.level} · 🔥 {item.streak} streak
                  </p>
                </div>
              </Link>
              <button
                onClick={() => toggleFollow(item.id, item.isFollowing)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  item.isFollowing
                    ? "bg-[#1a1a1a] border-[#303030] text-neutral-200"
                    : "bg-[#0066FF] border-[#0066FF] text-white"
                }`}
              >
                {item.isFollowing ? "Following" : "Follow"}
              </button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-neutral-500 py-8 text-center">No users found.</p>}
        </div>
      )}
    </main>
  );
}
