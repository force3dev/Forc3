"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

const SUGGESTIONS = [
  "How's my progress this week?",
  "Should I increase weight today?",
  "Am I eating enough protein?",
  "I feel tired — rest day or push through?",
  "Why did you program these exercises?",
];

function TypingIndicator() {
  return (
    <div className="flex gap-1 py-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#0066FF] flex items-center justify-center text-sm font-bold mr-2 flex-shrink-0 mt-0.5">
          AI
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-[#0066FF] text-white rounded-tr-sm"
            : "bg-[#1a1a1a] text-white border border-[#262626] rounded-tl-sm"
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

export default function CoachPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load history
  useEffect(() => {
    fetch("/api/coach/history")
      .then(r => r.json())
      .then(d => {
        if (d.messages) {
          setMessages(d.messages.map((m: Message) => ({ ...m, id: m.id || crypto.randomUUID() })));
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, []);

  useEffect(() => {
    if (historyLoaded) scrollToBottom();
  }, [historyLoaded, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput("");
    setError(null);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: msg,
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || "Coach unavailable");
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      const coachMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
      };
      setMessages(prev => [...prev, coachMsg]);
    } catch {
      setError("Network error — check your connection");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading]);

  const clearHistory = async () => {
    if (!confirm("Clear conversation history?")) return;
    await fetch("/api/coach/history", { method: "DELETE" });
    setMessages([]);
  };

  const configured = true; // actual check happens server-side

  return (
    <main className="min-h-screen bg-black text-white flex flex-col pb-20">
      {/* Header */}
      <header className="px-5 pt-6 pb-3 border-b border-[#1a1a1a] flex items-center justify-between flex-shrink-0">
        <div>
          <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
          <h1 className="text-xl font-bold">AI Coach</h1>
          <p className="text-xs text-neutral-500">Personalized — knows your data</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            Clear
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {!historyLoaded && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {historyLoaded && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="text-5xl mb-4">🏋️</div>
            <h2 className="text-xl font-bold mb-2">Your AI Coach</h2>
            <p className="text-neutral-500 text-sm mb-6 max-w-xs">
              Ask me anything about your training, nutrition, or recovery. I know your data.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="bg-[#141414] border border-[#262626] text-neutral-300 px-3 py-2 rounded-full text-sm hover:border-[#0066FF]/50 hover:text-white transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-[#0066FF] flex items-center justify-center text-sm font-bold mr-2 flex-shrink-0">
              AI
            </div>
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-2xl rounded-tl-sm px-4 py-3">
              <TypingIndicator />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
            {error.includes("CLAUDE_API_KEY") && (
              <div className="mt-2 text-xs text-neutral-500">
                Add your API key to .env to enable the AI coach.
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions when empty */}
      {historyLoaded && messages.length > 0 && messages.length <= 4 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          {SUGGESTIONS.slice(0, 3).map(s => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="flex-shrink-0 bg-[#141414] border border-[#262626] text-neutral-400 px-3 py-1.5 rounded-full text-xs hover:text-white transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#1a1a1a] flex gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask your coach anything..."
          className="flex-1 bg-[#141414] border border-[#262626] text-white rounded-full px-4 py-3 text-sm outline-none focus:border-[#0066FF] transition-colors placeholder:text-neutral-600"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="w-12 h-12 rounded-full bg-[#0066FF] flex items-center justify-center text-white hover:bg-[#0052CC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      <BottomNav active="coach" />
    </main>
  );
}
