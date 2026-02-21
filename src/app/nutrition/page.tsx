"use client";
import { useEffect, useState } from "react";
import BottomNav from "@/components/shared/BottomNav";

interface NutritionLog {
  id: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealName?: string;
  foodDescription?: string;
}

interface NutritionData {
  logs: NutritionLog[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  targets: { calories: number; protein: number; carbs: number; fat: number };
}

const MEAL_PRESETS = [
  { name: "Breakfast", cal: 400, protein: 30, carbs: 45, fat: 12 },
  { name: "Lunch", cal: 600, protein: 45, carbs: 60, fat: 18 },
  { name: "Dinner", cal: 700, protein: 50, carbs: 65, fat: 22 },
  { name: "Protein Shake", cal: 200, protein: 40, carbs: 10, fat: 3 },
  { name: "Snack", cal: 250, protein: 15, carbs: 25, fat: 8 },
];

export default function NutritionPage() {
  const [data, setData] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [logging, setLogging] = useState(false);

  // Form state
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  async function loadData() {
    try {
      const res = await fetch("/api/nutrition");
      if (res.ok) setData(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    if (!calories) return;
    setLogging(true);
    try {
      await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealName: mealName || null,
          calories: parseFloat(calories),
          protein: parseFloat(protein) || 0,
          carbs: parseFloat(carbs) || 0,
          fat: parseFloat(fat) || 0,
        }),
      });
      setMealName(""); setCalories(""); setProtein(""); setCarbs(""); setFat("");
      setShowForm(false);
      loadData();
    } finally {
      setLogging(false);
    }
  }

  async function deleteLog(id: string) {
    await fetch(`/api/nutrition?id=${id}`, { method: "DELETE" });
    loadData();
  }

  const applyPreset = (p: typeof MEAL_PRESETS[0]) => {
    setMealName(p.name);
    setCalories(p.cal.toString());
    setProtein(p.protein.toString());
    setCarbs(p.carbs.toString());
    setFat(p.fat.toString());
  };

  const t = data?.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const tgt = data?.targets ?? { calories: 2000, protein: 150, carbs: 200, fat: 65 };

  const calPct = Math.min(100, (t.calories / tgt.calories) * 100);
  const protPct = Math.min(100, (t.protein / tgt.protein) * 100);
  const carbPct = Math.min(100, (t.carbs / tgt.carbs) * 100);
  const fatPct = Math.min(100, (t.fat / tgt.fat) * 100);

  const remaining = {
    calories: Math.max(0, tgt.calories - t.calories),
    protein: Math.max(0, tgt.protein - t.protein),
  };

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <header className="px-6 pt-8 pb-4">
        <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
        <h1 className="text-2xl font-bold mt-1">Nutrition</h1>
        <p className="text-sm text-neutral-500">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </p>
      </header>

      <div className="px-6 space-y-5">
        {/* Macro Summary Ring-style */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          {/* Calories big number */}
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="text-4xl font-bold tabular-nums">{Math.round(t.calories)}</div>
              <div className="text-xs text-neutral-500 mt-1">of {Math.round(tgt.calories)} kcal</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-[#0066FF]">{Math.round(remaining.calories)}</div>
              <div className="text-xs text-neutral-500">remaining</div>
            </div>
          </div>

          {/* Progress bar - Calories */}
          <div className="h-3 bg-[#0a0a0a] rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-[#0066FF] rounded-full transition-all"
              style={{ width: `${calPct}%` }}
            />
          </div>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Protein", value: t.protein, target: tgt.protein, pct: protPct, color: "#00C853", unit: "g" },
              { label: "Carbs", value: t.carbs, target: tgt.carbs, pct: carbPct, color: "#0066FF", unit: "g" },
              { label: "Fat", value: t.fat, target: tgt.fat, pct: fatPct, color: "#FFB300", unit: "g" },
            ].map(macro => (
              <div key={macro.label} className="bg-[#0a0a0a] rounded-xl p-3">
                <div className="text-xs text-neutral-500 mb-1">{macro.label}</div>
                <div className="text-lg font-bold tabular-nums">{Math.round(macro.value)}<span className="text-xs text-neutral-500 font-normal">{macro.unit}</span></div>
                <div className="text-xs text-neutral-600 mb-2">/ {Math.round(macro.target)}{macro.unit}</div>
                <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${macro.pct}%`, background: macro.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Protein reminder */}
          {remaining.protein > 0 && (
            <div className="mt-4 p-3 bg-[#00C853]/10 border border-[#00C853]/20 rounded-xl">
              <p className="text-xs text-[#00C853]">
                {Math.round(remaining.protein)}g protein remaining — prioritize protein at each meal
              </p>
            </div>
          )}
        </div>

        {/* Log Meal Button / Form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 bg-[#0066FF] text-white font-bold rounded-2xl hover:bg-[#0052CC] transition-colors"
          >
            + Log Meal
          </button>
        ) : (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Log a Meal</h3>
              <button onClick={() => setShowForm(false)} className="text-neutral-500 text-lg">✕</button>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {MEAL_PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className="flex-shrink-0 px-3 py-1.5 bg-[#0a0a0a] border border-[#262626] rounded-xl text-xs text-neutral-400 hover:border-[#0066FF] hover:text-white transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>

            <form onSubmit={handleLog} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400">What did you eat?</label>
                <input
                  type="text"
                  value={mealName}
                  onChange={e => setMealName(e.target.value)}
                  placeholder="e.g. Chicken and rice"
                  className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400">Calories *</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={e => setCalories(e.target.value)}
                    placeholder="500"
                    required
                    className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400">Protein (g)</label>
                  <input
                    type="number"
                    value={protein}
                    onChange={e => setProtein(e.target.value)}
                    placeholder="40"
                    className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400">Carbs (g)</label>
                  <input
                    type="number"
                    value={carbs}
                    onChange={e => setCarbs(e.target.value)}
                    placeholder="60"
                    className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400">Fat (g)</label>
                  <input
                    type="number"
                    value={fat}
                    onChange={e => setFat(e.target.value)}
                    placeholder="15"
                    className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={logging || !calories}
                className={`w-full py-3 font-bold rounded-xl transition-all ${
                  logging || !calories
                    ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                    : "bg-[#0066FF] text-white hover:bg-[#0052CC]"
                }`}
              >
                {logging ? "Logging..." : "Log Meal"}
              </button>
            </form>
          </div>
        )}

        {/* Meals logged today */}
        {(data?.logs?.length ?? 0) > 0 && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#262626]">
              <h3 className="text-sm font-semibold text-neutral-300">Today&apos;s Meals</h3>
            </div>
            <div className="divide-y divide-[#1a1a1a]">
              {data!.logs.map(log => (
                <div key={log.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{log.mealName || "Meal"}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {log.protein > 0 && `${Math.round(log.protein)}g P`}
                      {log.carbs > 0 && ` · ${Math.round(log.carbs)}g C`}
                      {log.fat > 0 && ` · ${Math.round(log.fat)}g F`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className="font-semibold tabular-nums">{Math.round(log.calories)}</span>
                    <button
                      onClick={() => deleteLog(log.id)}
                      className="text-neutral-600 hover:text-red-400 transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <BottomNav active="nutrition" />
    </main>
  );
}
