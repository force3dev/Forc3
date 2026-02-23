
"use client";
import { useEffect, useState } from "react";
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

interface FeedItem {
  id: string; type: string; data: Record<string, unknown>; createdAt: string;
  user: { displayName: string | null; avatarUrl: string | null; username: string | null };
}

export default function CommunityPage() {
  const [tab, setTab] = useState<"challenges" | "leaderboard" | "feed">("challenges");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [metric, setMetric] = useState("workouts");
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "challenges") {
      fetch("/api/challenges").then(r => r.json()).then(d => setChallenges(d.challenges || [])).catch(() => {});
    } else if (tab === "leaderboard") {
      fetch(`/api/leaderboard?metric=${metric}&type=weekly`).then(r => r.json()).then(d => setLeaders(d.entries || [])).catch(() => {});
    } else if (tab === "feed") {
      fetch("/api/social/feed").then(r => r.json()).then(d => setFeed(d.activities || [])).catch(() => {});
    }
  }, [tab, metric]);

  async function joinChallenge(challengeId: string) {
    setJoining(challengeId);
    await fetch("/api/challenges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challengeId }) }).catch(() => {});
    fetch("/api/challenges").then(r => r.json()).then(d => setChallenges(d.challenges || [])).catch(() => {});
    setJoining(null);
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + "m ago";
    if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + "h ago";
    return Math.floor(diff / 86400000) + "d ago";
  }

  function feedDescription(item: FeedItem): string {
    const d = item.data;
    if (item.type === 'workout_complete') return `completed ${d.workoutName || 'a workout'} 💪`;
    if (item.type === 'pr') return `hit a new ${d.exercise} PR 🏆`;
    if (item.type === 'streak_milestone') return `is on a ${d.days} day streak 🔥`;
    if (item.type === 'challenge_complete') return `completed the ${d.challengeTitle} challenge 🎯`;
    return 'had an activity';
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
          {([["challenges", "Challenges"], ["leaderboard", "Leaderboard"], ["feed", "Feed"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === id ? 'bg-[#0066FF] text-white' : 'text-neutral-500'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-4">
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

        {tab === "leaderboard" && (
          <>
            <div className="flex gap-2">
              {(["workouts", "streak"] as const).map(m => (
                <button key={m} onClick={() => setMetric(m)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${metric === m ? 'bg-[#0066FF] text-white' : 'bg-[#141414] border border-[#262626] text-neutral-400'}`}>
                  {m === 'workouts' ? '💪 Workouts' : '🔥 Streak'}
                </button>
              ))}
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
              {leaders.slice(0, 20).map(entry => (
                <div key={entry.rank} className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] last:border-0">
                  <div className={`w-7 text-center font-black ${entry.rank <= 3 ? ['text-yellow-400', 'text-neutral-300', 'text-orange-400'][entry.rank - 1] : 'text-neutral-600'} text-sm`}>
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                  </div>
                  <Avatar user={{ name: entry.user?.displayName || entry.user?.username || "Athlete", avatarUrl: entry.user?.avatarUrl }} size="sm" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{entry.user?.displayName || entry.user?.username || 'Athlete'}</div>
                  </div>
                  <div className="font-black text-[#0066FF]">{entry.value}{metric === 'streak' ? '🔥' : ''}</div>
                </div>
              ))}
              {leaders.length === 0 && <p className="text-neutral-500 text-sm text-center py-8">No data yet.</p>}
            </div>
          </>
        )}

        {tab === "feed" && (
          <div className="space-y-3">
            {feed.map((item: FeedItem) => (
              <div key={item.id} className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex items-start gap-3">
                <Avatar user={{ name: item.user?.displayName || item.user?.username || "Athlete", avatarUrl: item.user?.avatarUrl }} size="md" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold">{item.user?.displayName || item.user?.username || 'Athlete'} </span>
                  <span className="text-neutral-400 text-sm">{feedDescription(item)}</span>
                  <div className="text-xs text-neutral-600 mt-1">{timeAgo(item.createdAt)}</div>
                </div>
              </div>
            ))}
            {feed.length === 0 && <p className="text-neutral-500 text-sm text-center py-8">No activity yet. Start training!</p>}
          </div>
        )}
      </div>

      <BottomNav active="home" />
    </main>
  );
}
