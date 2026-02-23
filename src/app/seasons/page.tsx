"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

type Benchmark = {
  exerciseId: string;
  name: string;
  baselineWeight: number;
  baselineReps: number;
  currentWeight?: number;
  currentReps?: number;
};

type Season = {
  id: string;
  name: string;
  goalDescription: string;
  startDate: string;
  endDate: string;
  weekNumber: number;
  status: string;
  benchmarkExercises: Benchmark[];
  finalResults?: { name: string; baseline: number; final: number; improvementPct: number }[];
};

const POPULAR_BENCHMARKS = [
  { exerciseId: "", name: "Barbell Back Squat" },
  { exerciseId: "", name: "Barbell Bench Press" },
  { exerciseId: "", name: "Conventional Deadlift" },
  { exerciseId: "", name: "Overhead Press" },
  { exerciseId: "", name: "Pull Up" },
];

export default function SeasonsPage() {
  const router = useRouter();
  const [active, setActive] = useState<Season | null>(null);
  const [history, setHistory] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [seasonName, setSeasonName] = useState("Season 1");
  const [goal, setGoal] = useState("");
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/seasons")
      .then((r) => r.json())
      .then((d) => {
        setActive(d.active);
        setHistory(d.history || []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function createSeason() {
    setCreating(true);
    const res = await fetch("/api/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: seasonName,
        goalDescription: goal,
        benchmarkExercises: selectedBenchmarks.map((name) => ({ exerciseId: name, name })),
      }),
    });
    const data = await res.json();
    if (!data.error) { setActive(data); setShowForm(false); }
    setCreating(false);
  }

  async function abandonSeason() {
    if (!confirm("Abandon this season? Your progress won't be saved.")) return;
    setAbandoning(true);
    await fetch("/api/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "abandon" }),
    });
    setActive(null);
    setAbandoning(false);
  }

  async function completeSeason() {
    const res = await fetch("/api/seasons/complete", { method: "POST" });
    const data = await res.json();
    setActive(null);
    setHistory((prev) => [data.season, ...prev]);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <header className="px-5 pt-8 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-neutral-400">←</button>
        <div>
          <p className="text-xs text-neutral-500 font-semibold tracking-widest">12-WEEK BLOCKS</p>
          <h1 className="text-xl font-bold">Training Seasons</h1>
        </div>
      </header>

      <div className="px-5 space-y-5">
        {/* Active Season */}
        {active && !showForm ? (
          <>
            {/* Season Header */}
            <div className="bg-gradient-to-br from-[#0066FF]/20 to-[#003399]/10 border border-[#0066FF]/30 rounded-3xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-[#8bb7ff] font-semibold tracking-widest">ACTIVE SEASON</p>
                  <h2 className="text-2xl font-black mt-1">{active.name}</h2>
                  <p className="text-sm text-neutral-400 mt-1">{active.goalDescription}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-[#0066FF]">{active.weekNumber}</p>
                  <p className="text-xs text-neutral-500">of 12 weeks</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0066FF] rounded-full transition-all"
                    style={{ width: `${Math.min(100, (active.weekNumber / 12) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {12 - active.weekNumber} weeks remaining · Ends {new Date(active.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* Benchmarks */}
            {active.benchmarkExercises.length > 0 && (
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-4">Benchmark Lifts</p>
                <div className="space-y-3">
                  {active.benchmarkExercises.map((b, i) => {
                    const current = b.currentWeight || b.baselineWeight;
                    const gain = b.baselineWeight > 0 ? Math.round(((current - b.baselineWeight) / b.baselineWeight) * 100) : 0;
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{b.name}</p>
                          <p className="text-xs text-neutral-500">Baseline: {b.baselineWeight} lbs</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{current} lbs</p>
                          {gain !== 0 && (
                            <p className={`text-xs font-semibold ${gain > 0 ? "text-[#00C853]" : "text-red-400"}`}>
                              {gain > 0 ? "+" : ""}{gain}%
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              {active.weekNumber >= 12 && (
                <button onClick={completeSeason} className="col-span-2 py-3 bg-[#00C853] text-black font-bold rounded-2xl">
                  🏆 Complete Season
                </button>
              )}
              <button onClick={abandonSeason} disabled={abandoning} className="py-3 bg-[#1a1a1a] border border-[#262626] rounded-2xl text-sm text-neutral-400">
                {abandoning ? "..." : "Abandon"}
              </button>
              <button onClick={() => router.push("/dashboard")} className="py-3 bg-[#0066FF] rounded-2xl text-sm font-semibold">
                Train Now
              </button>
            </div>
          </>
        ) : showForm ? (
          /* Create Season Form */
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4">
            <p className="font-bold text-lg">Start a New Season</p>

            <div>
              <p className="text-xs text-neutral-500 mb-1.5">Season Name</p>
              <input
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0066FF]"
                placeholder="e.g. Strength Block Q1"
              />
            </div>

            <div>
              <p className="text-xs text-neutral-500 mb-1.5">Goal (12-week outcome)</p>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={2}
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0066FF] resize-none"
                placeholder="e.g. Add 20 lbs to my squat and run a 5K"
              />
            </div>

            <div>
              <p className="text-xs text-neutral-500 mb-2">Benchmark Exercises (track progress)</p>
              <div className="space-y-2">
                {POPULAR_BENCHMARKS.map((b) => {
                  const sel = selectedBenchmarks.includes(b.name);
                  return (
                    <button
                      key={b.name}
                      onClick={() =>
                        setSelectedBenchmarks((prev) =>
                          sel ? prev.filter((n) => n !== b.name) : [...prev, b.name]
                        )
                      }
                      className={`w-full py-2.5 px-4 rounded-xl border text-sm text-left transition-colors ${
                        sel ? "border-[#0066FF] bg-[#0066FF]/10 text-white" : "border-[#262626] bg-[#0a0a0a] text-neutral-400"
                      }`}
                    >
                      {sel ? "✓ " : ""}{b.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="py-3 bg-[#1a1a1a] border border-[#262626] rounded-2xl text-sm">Cancel</button>
              <button onClick={createSeason} disabled={creating || !goal.trim()} className="py-3 bg-[#0066FF] rounded-2xl text-sm font-bold disabled:opacity-50">
                {creating ? "Creating..." : "Start Season →"}
              </button>
            </div>
          </div>
        ) : (
          /* No Active Season */
          <div className="text-center py-8 space-y-4">
            <div className="text-6xl">🏆</div>
            <h2 className="text-2xl font-black">No Active Season</h2>
            <p className="text-neutral-400 text-sm px-8">Define a 12-week goal, track benchmark lifts, and finish with a season finale workout.</p>
            <button onClick={() => setShowForm(true)} className="px-8 py-3 bg-[#0066FF] rounded-2xl font-bold">
              Start Your Season →
            </button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Past Seasons</p>
            {history.map((s) => (
              <div key={s.id} className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{s.goalDescription}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${s.status === "completed" ? "bg-[#00C853]/20 text-[#00C853]" : "bg-[#1a1a1a] text-neutral-500"}`}>
                    {s.status}
                  </span>
                </div>
                {s.finalResults && s.finalResults.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {s.finalResults.slice(0, 2).map((r, i) => (
                      <p key={i} className="text-xs text-neutral-400">
                        {r.name}: {r.baseline} → {r.final} lbs
                        {r.improvementPct > 0 && <span className="text-[#00C853] ml-1">(+{r.improvementPct}%)</span>}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="profile" />
    </main>
  );
}
