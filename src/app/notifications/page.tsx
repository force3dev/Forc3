"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data: Record<string, string>;
}

const TYPE_ICONS: Record<string, string> = {
  new_follower: "👤",
  follow_request: "🤝",
  reaction: "🔥",
  message: "💬",
  achievement: "🏆",
  pr: "⭐",
  challenge: "⚔️",
  system: "📣",
  workout_copied: "📋",
  workout_liked: "❤️",
  comment: "💬",
};

function timeAgo(d: string) {
  const secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => setNotifs(d.notifications || []))
      .finally(() => setLoading(false));

    // Mark all read after 1s
    const t = setTimeout(() => {
      fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  function navigate(n: Notif) {
    if (n.type === "new_follower" && n.data?.senderId) router.push(`/profile/${n.data.senderId}`);
    else if (n.type === "message" && n.data?.senderId) router.push(`/messages/${n.data.senderId}`);
    else if (n.type === "follow_request") router.push("/profile");
  }

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <header className="px-5 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-neutral-400">←</button>
          <h1 className="text-xl font-bold">Notifications</h1>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16 px-6">
          <div className="text-5xl mb-4">🔔</div>
          <h2 className="text-lg font-bold mb-2">No notifications</h2>
          <p className="text-neutral-500 text-sm">You're all caught up!</p>
        </div>
      ) : (
        <div className="divide-y divide-[#1a1a1a]">
          {notifs.map(n => (
            <button
              key={n.id}
              onClick={() => navigate(n)}
              className={`w-full flex items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-[#141414] ${!n.read ? "bg-[#0066FF]/5" : ""}`}
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || "🔔"}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${!n.read ? "text-white" : "text-neutral-300"}`}>{n.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{n.body}</p>
              </div>
              <span className="text-xs text-neutral-600 flex-shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
            </button>
          ))}
        </div>
      )}

      <BottomNav active="home" />
    </main>
  );
}
