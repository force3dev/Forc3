"use client";
import { useEffect, useState, useCallback } from "react";
import BottomNav from "@/components/shared/BottomNav";
import Avatar from "@/components/Avatar";

interface Challenge {
  id: string; title: string; description: string; type: string;
  target: number; unit: string; startDate: string; endDate: string;
  entries: Array<{ progress: number; user: { displayName: string | null; avatarUrl: string | null } }>;
  myEntry: { progress: number; completed: boolean } | null;
}

interface LeaderEntry {
  rank: number;
  user: { id: string; displayName: string | null; username: string | null; avatarUrl: string | null };
  value: number;
}

interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface FeedComment {
  id: string;
  content: string;
  createdAt: string;
  user: { displayName: string | null; avatarUrl: string | null; username: string | null };
}

interface FeedItem {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
  user: { id: string; displayName: string | null; avatarUrl: string | null; username: string | null };
  reactions?: Reaction[];
  commentCount?: number;
}

// ─── Story Component ───────────────────────────────────────────────────────────

function StoriesRow({ feed }: { feed: FeedItem[] }) {
  const [activeStory, setActiveStory] = useState<FeedItem | null>(null);

  // Get unique users from recent feed (last 24h)
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const seen = new Set<string>();
  const storyUsers: FeedItem[] = [];
  for (const item of feed) {
    if (new Date(item.createdAt).getTime() > cutoff && !seen.has(item.user.id)) {
      seen.add(item.user.id);
      storyUsers.push(item);
    }
  }

  if (storyUsers.length === 0) return null;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {storyUsers.slice(0, 8).map(item => (
          <button
            key={item.id}
            onClick={() => setActiveStory(item)}
            className="flex-shrink-0 flex flex-col items-center gap-1"
          >
            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#0066FF] to-[#00C853]">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                <Avatar
                  user={{ name: item.user.displayName || item.user.username || "Athlete", avatarUrl: item.user.avatarUrl }}
                  size="md"
                />
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 max-w-[56px] truncate">
              {item.user.displayName || item.user.username || "Athlete"}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer */}
      {activeStory && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6"
          onClick={() => setActiveStory(null)}
        >
          <div className="w-full max-w-sm bg-[#141414] rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar
                user={{ name: activeStory.user.displayName || activeStory.user.username || "Athlete", avatarUrl: activeStory.user.avatarUrl }}
                size="md"
              />
              <div>
                <div className="font-semibold">{activeStory.user.displayName || activeStory.user.username}</div>
                <div className="text-xs text-neutral-500">{timeAgo(activeStory.createdAt)}</div>
              </div>
            </div>
            <div className="text-lg font-bold">{feedTitle(activeStory)}</div>
            <div className="text-neutral-400 text-sm">{feedDescription(activeStory)}</div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Reaction Bar ─────────────────────────────────────────────────────────────

const REACTION_EMOJIS = ["🔥", "💪", "🏆", "❤️"];

function ReactionBar({
  activityId,
  reactions,
  commentCount,
  onComment,
}: {
  activityId: string;
  reactions: Reaction[];
  commentCount: number;
  onComment: () => void;
}) {
  const [localReactions, setLocalReactions] = useState<Reaction[]>(reactions);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleReaction(emoji: string) {
    if (busy) return;
    setBusy(emoji);

    const existing = localReactions.find(r => r.emoji === emoji);
    const reacted = existing?.reacted ?? false;

    // Optimistic update
    setLocalReactions(prev => {
      const updated = prev.filter(r => r.emoji !== emoji);
      if (!reacted) {
        updated.push({ emoji, count: (existing?.count ?? 0) + 1, reacted: true });
      } else if (existing && existing.count > 1) {
        updated.push({ emoji, count: existing.count - 1, reacted: false });
      }
      return updated.sort((a, b) => REACTION_EMOJIS.indexOf(a.emoji) - REACTION_EMOJIS.indexOf(b.emoji));
    });

    await fetch("/api/reactions", {
      method: reacted ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId, emoji }),
    }).catch(() => {});

    setBusy(null);
  }

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1a1a1a]">
      {REACTION_EMOJIS.map(emoji => {
        const r = localReactions.find(x => x.emoji === emoji);
        return (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all ${
              r?.reacted
                ? "bg-[#0066FF]/20 border border-[#0066FF]/50 text-white"
                : "bg-[#0a0a0a] border border-[#262626] text-neutral-400 hover:border-[#0066FF]/30"
            }`}
          >
            <span>{emoji}</span>
            {r && r.count > 0 && <span className="font-semibold">{r.count}</span>}
          </button>
        );
      })}
      <button
        onClick={onComment}
        className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[#0a0a0a] border border-[#262626] text-neutral-400 hover:border-[#0066FF]/30 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {commentCount > 0 && <span>{commentCount}</span>}
      </button>
    </div>
  );
}

// ─── Comments Sheet ────────────────────────────────────────────────────────────

function CommentsSheet({
  activityId,
  onClose,
}: {
  activityId: string;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch(`/api/reactions?activityId=${activityId}&type=comments`)
      .then(r => r.json())
      .then(d => setComments(d.comments || []))
      .finally(() => setLoading(false));
  }, [activityId]);

  async function postComment() {
    if (!text.trim() || posting) return;
    setPosting(true);
    const optimistic: FeedComment = {
      id: "temp-" + Date.now(),
      content: text.trim(),
      createdAt: new Date().toISOString(),
      user: { displayName: "You", avatarUrl: null, username: null },
    };
    setComments(prev => [...prev, optimistic]);
    const saved = text.trim();
    setText("");

    await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId, comment: saved }),
    }).catch(() => {});

    setPosting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-[#141414] border-t border-[#262626] rounded-t-3xl max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-[#404040] rounded-full mx-auto mt-3 mb-4" />
        <div className="px-5 pb-3 border-b border-[#262626]">
          <h3 className="font-bold">Comments</h3>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-6">No comments yet. Be first!</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex items-start gap-3">
                <Avatar
                  user={{ name: c.user.displayName || c.user.username || "Athlete", avatarUrl: c.user.avatarUrl }}
                  size="sm"
                />
                <div className="flex-1 bg-[#1a1a1a] rounded-2xl rounded-tl-sm px-3 py-2">
                  <span className="font-semibold text-xs text-neutral-300">
                    {c.user.displayName || c.user.username || "Athlete"}
                  </span>
                  <p className="text-sm mt-0.5">{c.content}</p>
                  <p className="text-[10px] text-neutral-600 mt-1">{timeAgo(c.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="px-5 py-4 border-t border-[#262626] flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && postComment()}
            placeholder="Add a comment..."
            className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0066FF]"
          />
          <button
            onClick={postComment}
            disabled={!text.trim() || posting}
            className="px-4 py-2.5 bg-[#0066FF] rounded-2xl text-sm font-semibold disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + "h ago";
  return Math.floor(diff / 86400000) + "d ago";
}

function feedTitle(item: FeedItem): string {
  const d = item.data;
  if (item.type === "workout_complete") return String(d.workoutName || "Workout") + " 💪";
  if (item.type === "pr") return `New ${String(d.exercise)} PR! 🏆`;
  if (item.type === "streak_milestone") return `${String(d.days)} Day Streak 🔥`;
  if (item.type === "challenge_complete") return `Challenge: ${String(d.challengeTitle)} 🎯`;
  return "Activity";
}

function feedDescription(item: FeedItem): string {
  const d = item.data;
  if (item.type === "workout_complete") {
    const parts: string[] = [];
    if (d.duration) parts.push(`${d.duration} min`);
    if (d.volume) parts.push(`${Number(d.volume).toLocaleString()} lbs`);
    if (d.exercises) parts.push(`${d.exercises} exercises`);
    return parts.join(" · ") || "Completed a workout";
  }
  if (item.type === "pr") return `${d.weight} lbs × ${d.reps} reps`;
  if (item.type === "streak_milestone") return `${d.days} days of consistent training`;
  return "";
}

// ─── Feed Item ─────────────────────────────────────────────────────────────────

function FeedCard({ item, onOpenComments }: { item: FeedItem; onOpenComments: (id: string) => void }) {
  const reactions = item.reactions || [];
  const commentCount = item.commentCount || 0;

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <Avatar
          user={{ name: item.user.displayName || item.user.username || "Athlete", avatarUrl: item.user.avatarUrl }}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">
              {item.user.displayName || item.user.username || "Athlete"}
            </span>
            <span className="text-xs text-neutral-600">·</span>
            <span className="text-xs text-neutral-600">{timeAgo(item.createdAt)}</span>
          </div>
          <p className="text-white font-medium text-sm mt-1">{feedTitle(item)}</p>
          {feedDescription(item) && (
            <p className="text-neutral-400 text-xs mt-0.5">{feedDescription(item)}</p>
          )}
          {typeof item.data.note === "string" && item.data.note && (
            <p className="text-neutral-300 text-sm mt-2 italic">&quot;{item.data.note}&quot;</p>
          )}
        </div>
      </div>
      <ReactionBar
        activityId={item.id}
        reactions={reactions}
        commentCount={commentCount}
        onComment={() => onOpenComments(item.id)}
      />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [tab, setTab] = useState<"feed" | "challenges" | "leaderboard">("feed");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [metric, setMetric] = useState("workouts");
  const [joining, setJoining] = useState<string | null>(null);
  const [commentActivity, setCommentActivity] = useState<string | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(false);

  const loadFeed = useCallback(async () => {
    setLoadingFeed(true);
    try {
      const r = await fetch("/api/social/feed");
      const d = await r.json();
      setFeed(d.activities || []);
    } catch { /* ignore */ } finally {
      setLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "challenges") {
      fetch("/api/challenges").then(r => r.json()).then(d => setChallenges(d.challenges || [])).catch(() => {});
    } else if (tab === "leaderboard") {
      fetch(`/api/leaderboard?metric=${metric}&type=weekly`).then(r => r.json()).then(d => setLeaders(d.entries || [])).catch(() => {});
    } else if (tab === "feed") {
      loadFeed();
    }
  }, [tab, metric, loadFeed]);

  async function joinChallenge(challengeId: string) {
    setJoining(challengeId);
    await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId }),
    }).catch(() => {});
    fetch("/api/challenges").then(r => r.json()).then(d => setChallenges(d.challenges || [])).catch(() => {});
    setJoining(null);
  }

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <header className="px-6 pt-8 pb-4">
        <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
        <h1 className="text-2xl font-bold mt-1">Community</h1>
      </header>

      {/* Tabs */}
      <div className="px-6 mb-4">
        <div className="flex bg-[#141414] rounded-2xl p-1 border border-[#262626]">
          {([["feed", "Feed"], ["challenges", "Challenges"], ["leaderboard", "Board"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === id ? "bg-[#0066FF] text-white" : "text-neutral-500"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-4">
        {/* Feed Tab */}
        {tab === "feed" && (
          <>
            {/* Stories Row */}
            {feed.length > 0 && <StoriesRow feed={feed} />}

            {loadingFeed ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : feed.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">👥</div>
                <p className="font-semibold text-neutral-300">No activity yet</p>
                <p className="text-sm text-neutral-500 mt-1">Follow athletes to see their workouts here</p>
              </div>
            ) : (
              feed.map(item => (
                <FeedCard key={item.id} item={item} onOpenComments={setCommentActivity} />
              ))
            )}
          </>
        )}

        {/* Challenges Tab */}
        {tab === "challenges" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {challenges.map(c => {
                const pct = c.myEntry ? Math.min(100, (c.myEntry.progress / c.target) * 100) : 0;
                const topUsers = c.entries.slice(0, 3);
                return (
                  <div key={c.id} className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-3">
                    <div className="font-semibold text-sm leading-snug">{c.title}</div>
                    <div className="text-xs text-neutral-500">{c.target} {c.unit}</div>
                    {c.myEntry ? (
                      <div className="space-y-1">
                        <div className="text-xs text-neutral-400">{Math.round(c.myEntry.progress)} / {c.target} {c.unit}</div>
                        <div className="h-1.5 bg-[#262626] rounded-full">
                          <div className="h-full bg-[#0066FF] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => joinChallenge(c.id)} disabled={joining === c.id}
                        className="w-full py-1.5 bg-[#0066FF] text-white text-xs font-bold rounded-lg disabled:opacity-50">
                        {joining === c.id ? "..." : "Join"}
                      </button>
                    )}
                    {topUsers.length > 0 && (
                      <div className="flex gap-1">
                        {topUsers.map((e, i) => (
                          <div key={i}>
                            <Avatar user={{ name: e.user.displayName || "Athlete", avatarUrl: e.user.avatarUrl }} size="xs" />
                          </div>
                        ))}
                        <span className="text-xs text-neutral-500 self-center ml-1">{c.entries.length} joined</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {challenges.length === 0 && (
              <p className="text-neutral-500 text-sm text-center py-8">No active challenges this week.</p>
            )}
          </>
        )}

        {/* Leaderboard Tab */}
        {tab === "leaderboard" && (
          <>
            <div className="flex gap-2">
              {(["workouts", "streak"] as const).map(m => (
                <button key={m} onClick={() => setMetric(m)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${metric === m ? "bg-[#0066FF] text-white" : "bg-[#141414] border border-[#262626] text-neutral-400"}`}>
                  {m === "workouts" ? "💪 Workouts" : "🔥 Streak"}
                </button>
              ))}
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
              {leaders.slice(0, 20).map(entry => (
                <div key={entry.rank} className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] last:border-0">
                  <div className={`w-7 text-center font-black ${entry.rank <= 3 ? ["text-yellow-400", "text-neutral-300", "text-orange-400"][entry.rank - 1] : "text-neutral-600"} text-sm`}>
                    {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                  </div>
                  <Avatar user={{ name: entry.user?.displayName || entry.user?.username || "Athlete", avatarUrl: entry.user?.avatarUrl }} size="sm" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{entry.user?.displayName || entry.user?.username || "Athlete"}</div>
                  </div>
                  <div className="font-black text-[#0066FF]">{entry.value}{metric === "streak" ? "🔥" : ""}</div>
                </div>
              ))}
              {leaders.length === 0 && <p className="text-neutral-500 text-sm text-center py-8">No data yet.</p>}
            </div>
          </>
        )}
      </div>

      {/* Comments Sheet */}
      {commentActivity && (
        <CommentsSheet
          activityId={commentActivity}
          onClose={() => setCommentActivity(null)}
        />
      )}

      <BottomNav active="home" />
    </main>
  );
}
