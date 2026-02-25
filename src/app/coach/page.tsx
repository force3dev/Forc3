"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import BottomNav from "@/components/shared/BottomNav";

interface Message {
  id?: string;
  role: "user" | "coach";
  content: string;
  createdAt?: string;
}

interface ContextStatus {
  todayWorkout: string | null;
  recoveryScore: number | null;
  nutritionStatus: string | null;
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ remaining: number; tier: string } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [weeklyReview, setWeeklyReview] = useState<string | null>(null);
  const [context, setContext] = useState<ContextStatus>({ todayWorkout: null, recoveryScore: null, nutritionStatus: null });
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    const [chatRes, suggestionsRes, reviewRes] = await Promise.all([
      fetch("/api/coach/chat"),
      fetch("/api/coach/suggestions").catch(() => null),
      fetch("/api/coach/weekly-review").catch(() => null),
    ]);
    const chatData = await chatRes.json();
    setMessages(chatData.messages || []);
    setLimitInfo({ remaining: chatData.remaining ?? 999, tier: chatData.tier || "free" });

    if (suggestionsRes?.ok) {
      const sd = await suggestionsRes.json();
      setSuggestions(sd.suggestions || []);
    }
    if (reviewRes?.ok) {
      const rd = await reviewRes.json();
      if (rd.review) setWeeklyReview(rd.review);
    }

    // Load context status
    Promise.all([
      fetch("/api/workouts/today").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/progress/recovery").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/nutrition?today=true").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([workout, recovery, nutrition]) => {
      setContext({
        todayWorkout: workout?.workout?.name || workout?.name || null,
        recoveryScore: typeof recovery?.score === "number" ? recovery.score : null,
        nutritionStatus: nutrition?.totalCalories && nutrition?.targetCalories
          ? nutrition.totalCalories >= nutrition.targetCalories * 0.8 ? "On track" : "Under target"
          : null,
      });
    });

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput("");
    setSending(true);

    const userMsg: Message = { role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);

    const res = await fetch("/api/coach/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });
    const data = await res.json();

    if (data.error === "limit_reached") {
      setMessages(prev => [...prev, {
        role: "coach",
        content: "You've reached your daily message limit. Upgrade to Premium for unlimited coaching.",
      }]);
    } else if (!res.ok || data.error) {
      setMessages(prev => [...prev, {
        role: "coach",
        content: "Coach Alex is taking a quick break. Try again in a moment.",
      }]);
    } else if (data.response) {
      const coachMsg: Message = { role: "coach", content: data.response };
      setMessages(prev => [...prev, coachMsg]);
      setLimitInfo(prev => prev ? { ...prev, remaining: data.remaining ?? prev.remaining } : prev);

      // Extract memories in background
      const recentMsgs = [...messages.slice(-4), userMsg, coachMsg];
      fetch("/api/coach/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: recentMsgs }),
      }).catch(() => {});
    }

    setSending(false);
  }

  function formatMessage(content: string) {
    // Simple markdown-like formatting
    return content
      .split("\n")
      .map((line, i) => <span key={i}>{line}<br /></span>);
  }

  return (
    <main className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="px-5 pt-8 pb-4 border-b border-[#1a1a1a] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#0066FF] flex items-center justify-center text-sm font-black"
                style={{ animation: "pulse 3s ease-in-out infinite" }}>
                A
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00C853] rounded-full border-2 border-black" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-[#0066FF]">AI COACH</div>
              <h1 className="text-lg font-bold leading-tight">Coach Alex</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {limitInfo && limitInfo.tier === "free" && (
              <p className="text-xs text-neutral-500">
                {limitInfo.remaining > 0 ? `${limitInfo.remaining} left` : "Limit reached"}
              </p>
            )}
            <a href="/coach/history" className="text-xs text-neutral-500 hover:text-white transition-colors">
              History →
            </a>
          </div>
        </div>
      </header>

      {/* Context Bar */}
      {(context.todayWorkout || context.recoveryScore !== null || context.nutritionStatus) && (
        <div className="px-5 py-2 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0 border-b border-[#1a1a1a]">
          {context.todayWorkout && (
            <span className="flex-shrink-0 px-3 py-1.5 bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-full text-xs text-[#8bb7ff] font-medium">
              💪 {context.todayWorkout}
            </span>
          )}
          {context.recoveryScore !== null && (
            <span className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${
              context.recoveryScore >= 80 ? "bg-[#00C853]/10 border-[#00C853]/30 text-[#00C853]" :
              context.recoveryScore >= 60 ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400" :
              context.recoveryScore >= 40 ? "bg-orange-400/10 border-orange-400/30 text-orange-400" :
              "bg-red-400/10 border-red-400/30 text-red-400"
            }`}>
              ❤️ Recovery: {context.recoveryScore}%
            </span>
          )}
          {context.nutritionStatus && (
            <span className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${
              context.nutritionStatus === "On track"
                ? "bg-[#00C853]/10 border-[#00C853]/30 text-[#00C853]"
                : "bg-orange-400/10 border-orange-400/30 text-orange-400"
            }`}>
              🥗 {context.nutritionStatus}
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full bg-[#0066FF] flex items-center justify-center text-2xl font-black mx-auto"
                style={{ animation: "pulse 3s ease-in-out infinite" }}>
                A
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#00C853] rounded-full border-2 border-black flex items-center justify-center text-[8px] font-bold">✓</div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Ready to help you train smarter.</h2>
              <p className="text-neutral-400 text-sm px-4">
                I know your training history, your goals, and what's been working. Ask me anything.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Weekly review card — shown at top if available */}
            {weeklyReview && messages.length < 3 && (
              <div className="bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-2xl p-4">
                <p className="text-xs text-[#0066FF] font-semibold uppercase tracking-wide mb-2">
                  Weekly Review
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed">{weeklyReview}</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "coach" && (
                  <div className="w-8 h-8 rounded-full bg-[#0066FF] flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0 mt-1">
                    A
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#0066FF] text-white rounded-br-sm"
                      : "bg-[#141414] border border-[#262626] text-white rounded-bl-sm"
                  }`}
                >
                  {m.role === "coach" ? formatMessage(m.content) : m.content}
                </div>
              </div>
            ))}
          </>
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-[#0066FF] flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
              A
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Dynamic Suggestions */}
      {messages.length < 4 && !sending && suggestions.length > 0 && (
        <div className="px-5 pb-2 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => send(s)}
              className="flex-shrink-0 px-3 py-2 bg-[#141414] border border-[#262626] rounded-xl text-xs text-neutral-300 hover:border-[#0066FF]/50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-5 pb-8 pt-3 border-t border-[#1a1a1a] flex gap-2 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={limitInfo?.remaining === 0 ? "Upgrade for more messages" : "Ask Coach Alex anything..."}
          disabled={limitInfo?.remaining === 0 || sending}
          className="flex-1 bg-[#141414] border border-[#262626] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0066FF] disabled:opacity-50"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || sending || limitInfo?.remaining === 0}
          className="w-12 h-12 bg-[#0066FF] rounded-2xl flex items-center justify-center disabled:opacity-40 flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <BottomNav active="coach" />
    </main>
  );
}
