"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Avatar from "@/components/Avatar";

interface Msg {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface OtherUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const otherUserId = params.userId as string;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [other, setOther] = useState<OtherUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/messages/${otherUserId}`);
    if (!res.ok) return;
    const d = await res.json();
    setMessages(d.messages || []);
    setOther(d.other || null);
    setLoading(false);
  }, [otherUserId]);

  useEffect(() => {
    fetch("/api/user/profile")
      .then(r => r.json())
      .then(d => setCurrentUserId(d.id || d.userId))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: otherUserId, content }),
    });
    if (res.ok) await load();
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const displayName = other?.displayName || other?.username || "User";

  return (
    <main className="flex flex-col h-screen bg-black text-white">
      <header className="flex items-center gap-3 px-4 pt-8 pb-4 border-b border-[#1a1a1a] flex-shrink-0">
        <button onClick={() => router.back()} className="text-neutral-400 text-lg">&#8592;</button>
        {other && <Avatar user={{ avatarUrl: other.avatarUrl, name: other.displayName || other.username || "User" }} size="sm" />}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{displayName}</p>
          {other?.username && (
            <p className="text-xs text-neutral-500">@{other.username}</p>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500 text-sm">No messages yet. Say hi!</p>
          </div>
        ) : (
          messages.map(m => {
            const isMine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMine ? "bg-[#0066FF] text-white rounded-br-sm" : "bg-[#1a1a1a] text-white rounded-bl-sm"
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-blue-200" : "text-neutral-600"}`}>
                    {new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 px-4 pb-8 pt-3 border-t border-[#1a1a1a] flex items-end gap-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message..."
          rows={1}
          className="flex-1 bg-[#141414] border border-[#262626] rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-600 resize-none outline-none focus:border-[#0066FF] transition-colors"
          style={{ maxHeight: 120, overflowY: "auto" }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="w-10 h-10 bg-[#0066FF] rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          )}
        </button>
      </div>
    </main>
  );
}
