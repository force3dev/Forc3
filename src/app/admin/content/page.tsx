"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  xpReward: number;
  weekStart: string;
  active: boolean;
}

interface BossBattle {
  id: string;
  name: string;
  description: string;
  targetReps: number;
  xpReward: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

export default function AdminContentPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"challenges" | "bossbattles" | "tips">("challenges");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [bossBattles, setBossBattles] = useState<BossBattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Challenge form
  const [challengeForm, setChallengeForm] = useState({
    title: "",
    description: "",
    type: "workout_count",
    xpReward: 100,
    targetValue: 3,
  });

  // Boss battle form
  const [bossForm, setBossForm] = useState({
    name: "",
    description: "",
    targetReps: 10000,
    xpReward: 500,
    startDate: "",
    endDate: "",
  });

  // Tips state
  const [tipText, setTipText] = useState("");
  const [savedTips, setSavedTips] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [cRes, bRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/stats"),
        ]);
        if (!cRes.ok) { router.push("/dashboard"); return; }

        // Load challenges and boss battles from their respective APIs
        const [chRes, bbRes] = await Promise.all([
          fetch("/api/challenges"),
          fetch("/api/challenges"), // reuse same endpoint for now
        ]);
        if (chRes.ok) {
          const d = await chRes.json();
          setChallenges(d.challenges || []);
        }
        if (bbRes.ok) {
          const d = await bbRes.json();
          setBossBattles(d.bossBattles || []);
        }

        const stored = localStorage.getItem("admin_tips");
        if (stored) setSavedTips(JSON.parse(stored));
      } catch {
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function createChallenge() {
    setSaving(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: challengeForm.title,
          description: challengeForm.description,
          type: challengeForm.type,
          xpReward: challengeForm.xpReward,
          targetValue: challengeForm.targetValue,
          weekStart: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setChallenges((prev) => [d.challenge, ...prev]);
        setChallengeForm({ title: "", description: "", type: "workout_count", xpReward: 100, targetValue: 3 });
      }
    } finally {
      setSaving(false);
    }
  }

  function saveTip() {
    if (!tipText.trim()) return;
    const updated = [tipText.trim(), ...savedTips].slice(0, 20);
    setSavedTips(updated);
    localStorage.setItem("admin_tips", JSON.stringify(updated));
    setTipText("");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white pb-10">
      <header className="px-6 pt-8 pb-4 flex items-center gap-4 border-b border-[#1a1a1a]">
        <Link href="/admin" className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400 hover:text-white">
          ←
        </Link>
        <h1 className="text-xl font-bold">Content Management</h1>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 pb-2">
        {(["challenges", "bossbattles", "tips"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
              tab === t ? "bg-[#0066FF] text-white" : "bg-[#1a1a1a] text-neutral-400"
            }`}
          >
            {t === "bossbattles" ? "Boss Battles" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-6 space-y-6 mt-4">
        {/* ─── CHALLENGES TAB ───────────────────────────────────────── */}
        {tab === "challenges" && (
          <>
            {/* Create challenge form */}
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-sm text-[#0066FF] uppercase tracking-wide">Create Weekly Challenge</h2>

              <input
                className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#0066FF]"
                placeholder="Challenge title (e.g. Week Warrior)"
                value={challengeForm.title}
                onChange={(e) => setChallengeForm((f) => ({ ...f, title: e.target.value }))}
              />
              <input
                className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#0066FF]"
                placeholder="Description (e.g. Complete 3 workouts this week)"
                value={challengeForm.description}
                onChange={(e) => setChallengeForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Type</label>
                  <select
                    className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#0066FF]"
                    value={challengeForm.type}
                    onChange={(e) => setChallengeForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    <option value="workout_count">Workout Count</option>
                    <option value="cardio_km">Cardio KM</option>
                    <option value="streak_days">Streak Days</option>
                    <option value="volume_kg">Total Volume</option>
                    <option value="protein_days">Protein Days</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Target Value</label>
                  <input
                    type="number"
                    className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#0066FF]"
                    value={challengeForm.targetValue}
                    onChange={(e) => setChallengeForm((f) => ({ ...f, targetValue: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">XP Reward</label>
                <input
                  type="number"
                  className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#0066FF]"
                  value={challengeForm.xpReward}
                  onChange={(e) => setChallengeForm((f) => ({ ...f, xpReward: Number(e.target.value) }))}
                />
              </div>
              <button
                onClick={createChallenge}
                disabled={saving || !challengeForm.title}
                className="w-full py-3 bg-[#0066FF] text-white font-bold rounded-xl disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Challenge"}
              </button>
            </div>

            {/* Existing challenges */}
            <div>
              <h2 className="font-semibold text-sm text-neutral-400 mb-3">Active Challenges ({challenges.length})</h2>
              {challenges.length === 0 ? (
                <div className="text-center py-10 text-neutral-600 text-sm">No challenges yet.</div>
              ) : (
                <div className="space-y-3">
                  {challenges.map((c) => (
                    <div key={c.id} className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{c.title}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">{c.description}</div>
                        <div className="text-xs text-[#FFB300] mt-1">+{c.xpReward} XP · {c.type}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${c.active ? "bg-[#00C853]/20 text-[#00C853]" : "bg-neutral-800 text-neutral-500"}`}>
                        {c.active ? "Active" : "Ended"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── BOSS BATTLES TAB ─────────────────────────────────────── */}
        {tab === "bossbattles" && (
          <>
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-sm text-[#FF6B00] uppercase tracking-wide">Create Monthly Boss Battle</h2>

              <input
                className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#FF6B00]"
                placeholder="Boss name (e.g. Iron Golem — Month 3)"
                value={bossForm.name}
                onChange={(e) => setBossForm((f) => ({ ...f, name: e.target.value }))}
              />
              <textarea
                className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#FF6B00] resize-none"
                placeholder="Boss description — what the community is fighting for"
                rows={3}
                value={bossForm.description}
                onChange={(e) => setBossForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Target Reps (community total)</label>
                  <input
                    type="number"
                    className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    value={bossForm.targetReps}
                    onChange={(e) => setBossForm((f) => ({ ...f, targetReps: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">XP Reward (each)</label>
                  <input
                    type="number"
                    className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    value={bossForm.xpReward}
                    onChange={(e) => setBossForm((f) => ({ ...f, xpReward: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    value={bossForm.startDate}
                    onChange={(e) => setBossForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">End Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    value={bossForm.endDate}
                    onChange={(e) => setBossForm((f) => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <button
                className="w-full py-3 bg-[#FF6B00] text-white font-bold rounded-xl disabled:opacity-50"
                disabled={saving || !bossForm.name}
                onClick={async () => {
                  setSaving(true);
                  try {
                    const res = await fetch("/api/boss-battles", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(bossForm),
                    });
                    if (res.ok) {
                      const d = await res.json();
                      setBossBattles((prev) => [d.boss, ...prev]);
                      setBossForm({ name: "", description: "", targetReps: 10000, xpReward: 500, startDate: "", endDate: "" });
                    }
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Creating..." : "Create Boss Battle"}
              </button>
            </div>

            {bossBattles.length === 0 && (
              <div className="text-center py-10 text-neutral-600 text-sm">No boss battles yet.</div>
            )}
          </>
        )}

        {/* ─── TIPS TAB ─────────────────────────────────────────────── */}
        {tab === "tips" && (
          <>
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-sm text-[#00C853] uppercase tracking-wide">Weekly Educational Tips</h2>
              <textarea
                className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#00C853] resize-none"
                placeholder="Write a training tip, science fact, or motivational insight..."
                rows={4}
                value={tipText}
                onChange={(e) => setTipText(e.target.value)}
              />
              <button
                onClick={saveTip}
                disabled={!tipText.trim()}
                className="w-full py-3 bg-[#00C853] text-black font-bold rounded-xl disabled:opacity-50"
              >
                Save Tip
              </button>
            </div>

            <div className="space-y-3">
              {savedTips.map((tip, i) => (
                <div key={i} className="bg-[#141414] border border-[#262626] rounded-xl p-4">
                  <p className="text-sm text-neutral-300 leading-relaxed">{tip}</p>
                  <button
                    onClick={() => {
                      const updated = savedTips.filter((_, j) => j !== i);
                      setSavedTips(updated);
                      localStorage.setItem("admin_tips", JSON.stringify(updated));
                    }}
                    className="text-xs text-red-500 mt-2 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              ))}
              {savedTips.length === 0 && (
                <div className="text-center py-10 text-neutral-600 text-sm">No tips saved yet.</div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
