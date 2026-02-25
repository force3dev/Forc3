"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

interface CoachMessage {
  id: string;
  role: "user" | "coach";
  content: string;
  createdAt: string;
}

interface GroupedMessages {
  label: string;
  messages: CoachMessage[];
}

function groupByDate(messages: CoachMessage[]): GroupedMessages[] {
  const groups: Record<string, CoachMessage[]> = {};
  for (const msg of messages) {
    const d = new Date(msg.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let label: string;
    if (d.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  }

  return Object.entries(groups).map(([label, messages]) => ({ label, messages }));
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function CoachHistoryPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/coach/history")
      .then(r => r.json())
      .then(d => setMessages(d.messages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => groupByDate(messages), [messages]);

  async function clearHistory() {
    setClearing(true);
    try {
      await fetch("/api/coach/history", { method: "DELETE" });
      setMessages([]);
      setShowConfirm(false);
    } finally {
      setClearing(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <header className="px-5 pt-8 pb-4 border-b border-[#1a1a1a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-neutral-400 hover:text-white transition-colors">
            ← Back
          </button>
          <div>
            <p className="text-xs text-[#0066FF] font-bold tracking-widest">AI COACH</p>
            <h1 className="text-lg font-bold">Chat History</h1>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
          >
            Clear All
          </button>
        )}
      </header>

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#0066FF]/10 flex items-center justify-center text-2xl mb-4">
              💬
            </div>
            <h2 className="font-bold text-lg mb-1">No history yet</h2>
            <p className="text-neutral-500 text-sm">Your conversations with Coach Alex will appear here.</p>
            <button
              onClick={() => router.push("/coach")}
              className="mt-6 px-6 py-3 bg-[#0066FF] text-white font-bold rounded-xl text-sm"
            >
              Start Chatting →
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map(group => (
              <div key={group.label}>
                {/* Date divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-[#1a1a1a]" />
                  <span className="text-xs text-neutral-600 font-medium px-2">{group.label}</span>
                  <div className="flex-1 h-px bg-[#1a1a1a]" />
                </div>

                <div className="space-y-3">
                  {group.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "coach" && (
                        <div className="w-7 h-7 rounded-full bg-[#0066FF] flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0 mt-1">
                          A
                        </div>
                      )}
                      <div className={`max-w-[80%] space-y-0.5`}>
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-[#0066FF] text-white rounded-br-sm"
                              : "bg-[#141414] border border-[#262626] text-white rounded-bl-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className={`text-[10px] text-neutral-700 px-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm clear dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg">Clear all history?</h3>
            <p className="text-neutral-400 text-sm">This will permanently delete all conversations with Coach Alex. This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 bg-[#1a1a1a] border border-[#262626] rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={clearHistory}
                disabled={clearing}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {clearing ? "Clearing..." : "Clear All"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="coach" />
    </main>
  );
}
