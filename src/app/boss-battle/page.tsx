"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

type Requirement = {
  type: string;
  target: number;
  unit: string;
  label: string;
};

type BossBattle = {
  id: string;
  name: string;
  description: string;
  bossIcon: string;
  requirements: Requirement[];
  xpReward: number;
  month: number;
  year: number;
};

type Entry = {
  id: string;
  progress: Record<string, number>;
  defeated: boolean;
  defeatedAt?: string;
};

const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function BossBattlePage() {
  const router = useRouter();
  const [boss, setBoss] = useState<BossBattle | null>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [defeatedCount, setDefeatedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetch("/api/boss-battles")
      .then((r) => r.json())
      .then((d) => {
        setBoss(d.boss);
        setEntry(d.entry);
        setDefeatedCount(d.defeatedCount || 0);
      })
      .finally(() => setLoading(false));
  }, []);

  async function joinBattle() {
    setJoining(true);
    const res = await fetch("/api/boss-battles", { method: "POST" });
    const d = await res.json();
    setEntry(d.entry);
    setJoining(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!boss) return null;

  const requirements = boss.requirements as Requirement[];
  const progress = entry?.progress || {};

  // Calculate overall HP (0–100 where 100 = all requirements met)
  const hpPct = requirements.length === 0 ? 0 :
    Math.min(100, Math.round(
      requirements.reduce((sum, req) => {
        const pct = Math.min(1, (progress[req.type] || 0) / req.target);
        return sum + pct;
      }, 0) / requirements.length * 100
    ));

  const defeated = entry?.defeated ?? false;

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <header className="px-5 pt-8 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-neutral-400">←</button>
        <div>
          <p className="text-xs text-neutral-500 font-semibold tracking-widest">MONTHLY BOSS</p>
          <h1 className="text-xl font-bold">{MONTH_NAMES[boss.month]} {boss.year}</h1>
        </div>
      </header>

      <div className="px-5 space-y-5">
        {/* Boss Card */}
        <div className={`rounded-3xl border p-6 text-center relative overflow-hidden ${defeated ? "border-[#00C853]/40 bg-[#00C853]/5" : "border-red-500/30 bg-red-900/10"}`}>
          <div className="text-8xl mb-3 relative z-10">
            {defeated ? "💀" : boss.bossIcon}
          </div>
          <h2 className="text-2xl font-black">{boss.name}</h2>
          <p className="text-neutral-400 text-sm mt-1">{boss.description}</p>

          {/* HP Bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-neutral-500 mb-1">
              <span>{defeated ? "DEFEATED" : "BOSS HP"}</span>
              <span>{hpPct}% damage dealt</span>
            </div>
            <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${defeated ? "bg-[#00C853]" : hpPct >= 75 ? "bg-orange-400" : hpPct >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </div>

          {defeated && (
            <div className="mt-4 py-2 px-4 bg-[#00C853]/20 border border-[#00C853]/40 rounded-xl text-[#00C853] font-bold text-sm">
              +{boss.xpReward} XP Earned 🏆
            </div>
          )}
        </div>

        {/* Requirements */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-4">Requirements to Defeat</p>
          <div className="space-y-4">
            {requirements.map((req, i) => {
              const current = Math.min(req.target, progress[req.type] || 0);
              const pct = Math.min(100, Math.round((current / req.target) * 100));
              const done = current >= req.target;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className={done ? "text-[#00C853] font-semibold" : "text-white"}>
                      {done ? "✓ " : ""}{req.label}
                    </span>
                    <span className="text-neutral-400">
                      {req.type === "volume" ? `${Math.round(current / 1000)}k/${Math.round(req.target / 1000)}k` : `${Math.round(current)}/${req.target}`} {req.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${done ? "bg-[#00C853]" : "bg-[#0066FF]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Join or Status */}
        {!entry ? (
          <button
            onClick={joinBattle}
            disabled={joining}
            className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-bold text-lg transition-colors"
          >
            {joining ? "Joining..." : "⚔️ Accept the Challenge"}
          </button>
        ) : defeated ? (
          <div className="text-center py-4">
            <p className="text-[#00C853] font-bold text-lg">🎉 Boss Defeated!</p>
            <p className="text-neutral-400 text-sm mt-1">
              {entry.defeatedAt ? `Defeated on ${new Date(entry.defeatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
            </p>
          </div>
        ) : (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-center">
            <p className="text-sm text-neutral-400">Progress updates automatically as you train.</p>
            <p className="text-xs text-neutral-600 mt-1">Complete workouts and cardio sessions to deal damage.</p>
          </div>
        )}

        {/* Community */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Community Slayers</p>
            <p className="text-xs text-neutral-500 mt-0.5">{defeatedCount} athlete{defeatedCount !== 1 ? "s" : ""} defeated this boss</p>
          </div>
          <span className="text-2xl">⚔️</span>
        </div>
      </div>

      <BottomNav active="discover" />
    </main>
  );
}
