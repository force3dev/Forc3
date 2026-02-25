"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";
import Avatar from "@/components/Avatar";

interface Conv {
  id: string;
  other: { id: string; username: string | null; displayName: string | null; avatarUrl: string | null };
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages")
      .then(r => r.json())
      .then(d => setConvs(d.conversations || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <header className="px-5 pt-8 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-neutral-400">←</button>
        <h1 className="text-xl font-bold">Messages</h1>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : convs.length === 0 ? (
        <div className="text-center py-16 px-6">
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-lg font-bold mb-2">No messages yet</h2>
          <p className="text-neutral-500 text-sm">Find athletes in Discover and start a conversation</p>
          <button onClick={() => router.push("/discover")} className="mt-4 px-6 py-2.5 bg-[#0066FF] rounded-xl text-sm font-semibold">
            Find Athletes
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#1a1a1a]">
          {convs.map(c => (
            <button
              key={c.id}
              onClick={() => router.push(`/messages/${c.other.id}`)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[#141414] transition-colors text-left"
            >
              <div className="relative flex-shrink-0">
                <Avatar user={{ avatarUrl: c.other.avatarUrl, name: c.other.displayName || c.other.username || "User" }} size="md" />
                {c.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0066FF] rounded-full text-[10px] font-bold flex items-center justify-center">
                    {c.unread > 9 ? "9+" : c.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`font-semibold text-sm ${c.unread > 0 ? "text-white" : "text-neutral-300"}`}>
                    {c.other.displayName || c.other.username || "User"}
                  </p>
                  {c.lastMessageAt && (
                    <span className="text-xs text-neutral-600 ml-2 flex-shrink-0">
                      {new Date(c.lastMessageAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
                {c.lastMessage && (
                  <p className={`text-sm truncate mt-0.5 ${c.unread > 0 ? "text-neutral-300" : "text-neutral-500"}`}>
                    {c.lastMessage}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <BottomNav active="home" />
    </main>
  );
}
