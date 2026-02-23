"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import BottomNav from "@/components/shared/BottomNav";

function epley(w: number, r: number) { return r === 1 ? w : Math.round(w * (1 + r / 30)); }
function brzycki(w: number, r: number) { return r === 1 ? w : r >= 37 ? w * 2 : Math.round(w * (36 / (37 - r))); }
function lombardi(w: number, r: number) { return Math.round(w * Math.pow(r, 0.1)); }

type ExerciseData = {
  exerciseId: string;
  name: string;
  history: { date: string; e1rm: number; weight: number; reps: number }[];
  current1RM: number;
};

export default function OneRMPage() {
  const router = useRouter();
  const [weight, setWeight] = useState(100);
  const [reps, setReps] = useState(5);
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [selected, setSelected] = useState<ExerciseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress/1rm")
      .then((r) => r.json())
      .then((d) => {
        setExercises(d.exercises || []);
        if (d.exercises?.length) setSelected(d.exercises[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const e = epley(weight, reps);
  const b = brzycki(weight, reps);
  const l = lombardi(weight, reps);
  const avg = Math.round((e + b + l) / 3);

  // Warmup sets based on average 1RM
  const warmupSets = [
    { pct: 40, reps: 10, weight: Math.round(avg * 0.4 / 2.5) * 2.5 },
    { pct: 60, reps: 6, weight: Math.round(avg * 0.6 / 2.5) * 2.5 },
    { pct: 75, reps: 3, weight: Math.round(avg * 0.75 / 2.5) * 2.5 },
    { pct: 90, reps: 1, weight: Math.round(avg * 0.9 / 2.5) * 2.5 },
  ];

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <header className="px-5 pt-8 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-neutral-400">←</button>
        <h1 className="text-xl font-bold">1RM Calculator</h1>
      </header>

      {/* Calculator */}
      <section className="px-5 space-y-4">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4">
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Input</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-500 mb-2">Weight (lbs)</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setWeight((w) => Math.max(10, w - 5))} className="w-8 h-8 bg-[#1a1a1a] rounded-lg font-bold">−</button>
                <span className="text-xl font-bold w-16 text-center">{weight}</span>
                <button onClick={() => setWeight((w) => w + 5)} className="w-8 h-8 bg-[#1a1a1a] rounded-lg font-bold">+</button>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-2">Reps</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setReps((r) => Math.max(1, r - 1))} className="w-8 h-8 bg-[#1a1a1a] rounded-lg font-bold">−</button>
                <span className="text-xl font-bold w-16 text-center">{reps}</span>
                <button onClick={() => setReps((r) => Math.min(20, r + 1))} className="w-8 h-8 bg-[#1a1a1a] rounded-lg font-bold">+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-4">Estimated 1RM</p>
          <div className="text-center mb-4">
            <p className="text-5xl font-black text-[#0066FF]">{avg}<span className="text-2xl text-neutral-400 ml-1">lbs</span></p>
            <p className="text-xs text-neutral-500 mt-1">Average of 3 formulas</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="bg-[#0a0a0a] rounded-xl p-3">
              <p className="text-neutral-400 text-xs mb-1">Epley</p>
              <p className="font-bold">{e}</p>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-3">
              <p className="text-neutral-400 text-xs mb-1">Brzycki</p>
              <p className="font-bold">{b}</p>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-3">
              <p className="text-neutral-400 text-xs mb-1">Lombardi</p>
              <p className="font-bold">{l}</p>
            </div>
          </div>
        </div>

        {/* Warmup Sets */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-4">Warmup Protocol</p>
          <div className="space-y-2">
            {warmupSets.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-[#0066FF]/20 text-[#0066FF] rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="text-neutral-400">{s.pct}% × {s.reps} reps</span>
                </div>
                <span className="font-bold text-white">{s.weight} lbs</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm pt-2 border-t border-[#262626]">
              <span className="font-semibold text-[#0066FF]">Working set</span>
              <span className="font-bold">{weight} lbs × {reps}+</span>
            </div>
          </div>
        </div>

        {/* Exercise History */}
        {!loading && exercises.length > 0 && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
            <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-3">Your 1RM History</p>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {exercises.map((ex) => (
                <button
                  key={ex.exerciseId}
                  onClick={() => setSelected(ex)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    selected?.exerciseId === ex.exerciseId
                      ? "bg-[#0066FF] border-[#0066FF] text-white"
                      : "bg-[#1a1a1a] border-[#262626] text-neutral-400"
                  }`}
                >
                  {ex.name}
                </button>
              ))}
            </div>

            {selected && (
              <>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-sm text-neutral-400">{selected.name}</span>
                  <span className="text-xl font-bold">{selected.current1RM} <span className="text-sm text-neutral-400">lbs e1RM</span></span>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={selected.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                    <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fill: "#666", fontSize: 10 }} domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 8 }}
                      labelStyle={{ color: "#999" }}
                      formatter={(v: number | undefined) => [`${v ?? 0} lbs`, "e1RM"]}
                    />
                    <Line type="monotone" dataKey="e1rm" stroke="#0066FF" strokeWidth={2} dot={{ fill: "#0066FF", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </section>

      <BottomNav active="workout" />
    </main>
  );
}
