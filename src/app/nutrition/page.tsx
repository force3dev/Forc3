"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import BottomNav from "@/components/shared/BottomNav";

interface NutritionLog {
  id: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealName?: string;
}

interface NutritionData {
  logs: NutritionLog[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  targets: { calories: number; protein: number; carbs: number; fat: number };
}

interface FoodResult {
  id: string;
  name: string;
  brand?: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  source: "openfoodfacts" | "usda" | "ai";
}

interface FavoriteMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timesUsed: number;
}

type AddMode = "search" | "quick" | "favorites";

function SourceBadge({ source }: { source: FoodResult["source"] }) {
  const map = {
    usda: { label: "USDA", color: "text-green-400 bg-green-400/10" },
    openfoodfacts: { label: "OFF", color: "text-blue-400 bg-blue-400/10" },
    ai: { label: "AI", color: "text-purple-400 bg-purple-400/10" },
  };
  const { label, color } = map[source];
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color}`}>{label}</span>
  );
}

function FoodResultItem({
  food,
  onSelect,
}: {
  food: FoodResult;
  onSelect: (food: FoodResult) => void;
}) {
  return (
    <button
      onClick={() => onSelect(food)}
      className="w-full text-left px-4 py-3 hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a] last:border-0"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{food.name}</span>
            <SourceBadge source={food.source} />
          </div>
          {food.brand && (
            <div className="text-xs text-neutral-500 truncate">{food.brand}</div>
          )}
          <div className="text-xs text-neutral-500 mt-0.5">{food.servingSize}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-sm">{food.calories}</div>
          <div className="text-[10px] text-neutral-500">kcal</div>
        </div>
      </div>
      <div className="flex gap-3 mt-1.5">
        {[
          { label: "P", value: food.protein, color: "text-[#00C853]" },
          { label: "C", value: food.carbs, color: "text-[#0066FF]" },
          { label: "F", value: food.fat, color: "text-[#FFB300]" },
        ].map(m => (
          <span key={m.label} className={`text-xs ${m.color}`}>
            {m.value}g {m.label}
          </span>
        ))}
      </div>
    </button>
  );
}

function ServingAdjust({
  food,
  onLog,
  onBack,
  logging,
}: {
  food: FoodResult;
  onLog: (food: FoodResult, multiplier: number, saveFavorite: boolean) => void;
  onBack: () => void;
  logging: boolean;
}) {
  const [servings, setServings] = useState("1");
  const [saveFav, setSaveFav] = useState(false);
  const mult = parseFloat(servings) || 1;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#262626]">
        <button onClick={onBack} className="text-neutral-400 hover:text-white">
          ← Back
        </button>
        <h3 className="font-bold flex-1">Adjust Serving</h3>
      </div>

      <div className="flex-1 px-5 py-4 space-y-5 overflow-y-auto">
        <div>
          <div className="font-semibold">{food.name}</div>
          {food.brand && <div className="text-sm text-neutral-500">{food.brand}</div>}
          <div className="text-xs text-neutral-600 mt-1">Per {food.servingSize}</div>
        </div>

        <div>
          <label className="text-xs text-neutral-400">Number of servings</label>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => setServings(s => String(Math.max(0.25, (parseFloat(s) || 1) - 0.25)))}
              className="w-10 h-10 rounded-xl bg-[#1a1a1a] text-xl font-bold hover:bg-[#262626] transition-colors"
            >
              −
            </button>
            <input
              type="number"
              value={servings}
              onChange={e => setServings(e.target.value)}
              min="0.1"
              step="0.25"
              className="flex-1 text-center py-2.5 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none font-bold text-lg"
            />
            <button
              onClick={() => setServings(s => String((parseFloat(s) || 1) + 0.25))}
              className="w-10 h-10 rounded-xl bg-[#1a1a1a] text-xl font-bold hover:bg-[#262626] transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Calculated macros */}
        <div className="bg-[#0a0a0a] rounded-2xl p-4">
          <div className="text-xs text-neutral-500 mb-3">Nutrition for {servings || 1} serving(s)</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-2xl font-bold">{Math.round(food.calories * mult)}</div>
              <div className="text-xs text-neutral-500">calories</div>
            </div>
            {[
              { label: "Protein", value: food.protein, color: "text-[#00C853]" },
              { label: "Carbs", value: food.carbs, color: "text-[#0066FF]" },
              { label: "Fat", value: food.fat, color: "text-[#FFB300]" },
            ].map(m => (
              <div key={m.label}>
                <div className={`text-xl font-bold ${m.color}`}>{Math.round(m.value * mult)}g</div>
                <div className="text-xs text-neutral-500">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setSaveFav(s => !s)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              saveFav ? "bg-[#0066FF] border-[#0066FF]" : "border-[#404040]"
            }`}
          >
            {saveFav && <span className="text-white text-xs">✓</span>}
          </div>
          <span className="text-sm text-neutral-300">Save to favorites</span>
        </label>
      </div>

      <div className="px-5 py-4 border-t border-[#262626]">
        <button
          onClick={() => onLog(food, mult, saveFav)}
          disabled={logging}
          className={`w-full py-3.5 font-bold rounded-xl transition-all ${
            logging
              ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
              : "bg-[#0066FF] hover:bg-[#0052CC] text-white"
          }`}
        >
          {logging ? "Logging..." : `Log ${Math.round(food.calories * mult)} kcal`}
        </button>
      </div>
    </div>
  );
}

function AddFoodModal({
  onClose,
  onLogged,
}: {
  onClose: () => void;
  onLogged: () => void;
}) {
  const [mode, setMode] = useState<AddMode>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null);
  const [logging, setLogging] = useState(false);

  // Quick AI mode
  const [aiDescription, setAiDescription] = useState("");
  const [aiResult, setAiResult] = useState<FoodResult | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [aiError, setAiError] = useState("");

  // Favorites mode
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [favLoading, setFavLoading] = useState(false);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/nutrition/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => doSearch(query), 400);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [query, doSearch]);

  useEffect(() => {
    if (mode === "favorites" && favorites.length === 0) {
      setFavLoading(true);
      fetch("/api/nutrition/favorites")
        .then(r => r.json())
        .then(d => setFavorites(d.favorites || []))
        .finally(() => setFavLoading(false));
    }
  }, [mode, favorites.length]);

  async function handleEstimate() {
    if (!aiDescription.trim()) return;
    setEstimating(true);
    setAiError("");
    setAiResult(null);
    try {
      const res = await fetch("/api/nutrition/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiDescription }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Estimation failed");
        return;
      }
      setAiResult({ ...data, id: "ai_estimate", source: "ai" as const });
    } catch {
      setAiError("Failed to estimate — check your connection");
    } finally {
      setEstimating(false);
    }
  }

  async function handleLog(food: FoodResult, multiplier: number, saveFavorite: boolean) {
    setLogging(true);
    try {
      await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealName: food.name,
          calories: Math.round(food.calories * multiplier),
          protein: Math.round(food.protein * multiplier),
          carbs: Math.round(food.carbs * multiplier),
          fat: Math.round(food.fat * multiplier),
        }),
      });
      if (saveFavorite) {
        await fetch("/api/nutrition/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: food.name,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
          }),
        });
      }
      onLogged();
      onClose();
    } finally {
      setLogging(false);
    }
  }

  async function logFavorite(fav: FavoriteMeal) {
    setLogging(true);
    try {
      await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealName: fav.name,
          calories: fav.calories,
          protein: fav.protein,
          carbs: fav.carbs,
          fat: fav.fat,
        }),
      });
      onLogged();
      onClose();
    } finally {
      setLogging(false);
    }
  }

  if (selectedFood) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
        <ServingAdjust
          food={selectedFood}
          onLog={handleLog}
          onBack={() => setSelectedFood(null)}
          logging={logging}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4">
        <h2 className="text-xl font-bold">Add Food</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 px-5 mb-4">
        {(["search", "quick", "favorites"] as AddMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === m
                ? "bg-[#0066FF] text-white"
                : "bg-[#1a1a1a] text-neutral-400 hover:text-white"
            }`}
          >
            {m === "search" ? "Search" : m === "quick" ? "Quick AI" : "Favorites"}
          </button>
        ))}
      </div>

      {/* Search mode */}
      {mode === "search" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 pb-3">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search food database..."
                autoFocus
                className="w-full py-3 pl-4 pr-10 bg-[#141414] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {query.length > 0 && (
              <p className="text-xs text-neutral-600 mt-2">
                {results.length > 0
                  ? `${results.length} results — USDA + OpenFoodFacts`
                  : searching
                  ? "Searching..."
                  : "No results found"}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {results.length > 0 ? (
              <div className="bg-[#141414] border border-[#262626] mx-5 rounded-2xl overflow-hidden">
                {results.map(food => (
                  <FoodResultItem
                    key={food.id}
                    food={food}
                    onSelect={setSelectedFood}
                  />
                ))}
              </div>
            ) : query.length < 2 ? (
              <div className="px-5 space-y-3">
                <p className="text-sm text-neutral-500 mb-4">Popular searches</p>
                {["Chicken breast", "Oats", "Eggs", "Rice", "Greek yogurt"].map(s => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="w-full text-left px-4 py-3 bg-[#141414] border border-[#262626] rounded-xl text-sm text-neutral-300 hover:border-[#0066FF] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Quick AI mode */}
      {mode === "quick" && (
        <div className="flex-1 px-5 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <p className="text-xs text-neutral-400 mb-3">
              Describe what you ate — AI will estimate the nutrition
            </p>
            <textarea
              value={aiDescription}
              onChange={e => setAiDescription(e.target.value)}
              placeholder="e.g. 2 scrambled eggs with 2 strips of bacon and a slice of toast with butter"
              rows={4}
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl p-3 text-sm focus:border-[#0066FF] focus:outline-none resize-none"
            />
            <button
              onClick={handleEstimate}
              disabled={estimating || !aiDescription.trim()}
              className={`w-full mt-3 py-3 font-bold rounded-xl transition-all ${
                estimating || !aiDescription.trim()
                  ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-500 text-white"
              }`}
            >
              {estimating ? "Estimating..." : "✨ Estimate with AI"}
            </button>
          </div>

          {aiError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              {aiError}
            </div>
          )}

          {aiResult && (
            <div className="bg-[#141414] border border-purple-500/30 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#262626] flex items-center gap-2">
                <span className="text-purple-400 text-sm font-semibold">AI Estimate</span>
                <span className="text-xs text-neutral-600">· tap to log</span>
              </div>
              <FoodResultItem food={aiResult} onSelect={setSelectedFood} />
            </div>
          )}
        </div>
      )}

      {/* Favorites mode */}
      {mode === "favorites" && (
        <div className="flex-1 px-5 overflow-y-auto">
          {favLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3">⭐</div>
              <p className="font-semibold text-neutral-300">No favorites yet</p>
              <p className="text-sm text-neutral-500 mt-1">
                Log a food and check &quot;Save to favorites&quot; to build your list
              </p>
            </div>
          ) : (
            <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
              {favorites.map(fav => (
                <div
                  key={fav.id}
                  className="px-4 py-3 border-b border-[#1a1a1a] last:border-0 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{fav.name}</div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-[#00C853]">{fav.protein}g P</span>
                      <span className="text-xs text-[#0066FF]">{fav.carbs}g C</span>
                      <span className="text-xs text-[#FFB300]">{fav.fat}g F</span>
                    </div>
                    {fav.timesUsed > 0 && (
                      <div className="text-xs text-neutral-600 mt-0.5">Used {fav.timesUsed}×</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold">{fav.calories}</div>
                      <div className="text-xs text-neutral-500">kcal</div>
                    </div>
                    <button
                      onClick={() => logFavorite(fav)}
                      disabled={logging}
                      className="px-3 py-2 bg-[#0066FF] rounded-xl text-sm font-semibold hover:bg-[#0052CC] transition-colors"
                    >
                      + Log
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NutritionPage() {
  const [data, setData] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function loadData() {
    try {
      const res = await fetch("/api/nutrition");
      if (res.ok) setData(await res.json());
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function deleteLog(id: string) {
    await fetch(`/api/nutrition?id=${id}`, { method: "DELETE" });
    loadData();
  }

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
    <>
      <main className="min-h-screen bg-black text-white pb-28">
        <header className="px-6 pt-8 pb-4">
          <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
          <h1 className="text-2xl font-bold mt-1">Nutrition</h1>
          <p className="text-sm text-neutral-500">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </header>

        <div className="px-6 space-y-5">
          {/* Macro Summary */}
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="text-4xl font-bold tabular-nums">{Math.round(t.calories)}</div>
                <div className="text-xs text-neutral-500 mt-1">of {Math.round(tgt.calories)} kcal</div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${remaining.calories > 0 ? "text-[#0066FF]" : "text-red-400"}`}>
                  {remaining.calories > 0 ? Math.round(remaining.calories) : "Over"}
                </div>
                <div className="text-xs text-neutral-500">
                  {remaining.calories > 0 ? "remaining" : `by ${Math.round(Math.abs(remaining.calories))} kcal`}
                </div>
              </div>
            </div>

            <div className="h-3 bg-[#0a0a0a] rounded-full overflow-hidden mb-5">
              <div
                className={`h-full rounded-full transition-all ${calPct >= 100 ? "bg-red-500" : "bg-[#0066FF]"}`}
                style={{ width: `${calPct}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Protein", value: t.protein, target: tgt.protein, pct: protPct, color: "#00C853", unit: "g" },
                { label: "Carbs", value: t.carbs, target: tgt.carbs, pct: carbPct, color: "#0066FF", unit: "g" },
                { label: "Fat", value: t.fat, target: tgt.fat, pct: fatPct, color: "#FFB300", unit: "g" },
              ].map(macro => (
                <div key={macro.label} className="bg-[#0a0a0a] rounded-xl p-3">
                  <div className="text-xs text-neutral-500 mb-1">{macro.label}</div>
                  <div className="text-lg font-bold tabular-nums">
                    {Math.round(macro.value)}
                    <span className="text-xs text-neutral-500 font-normal">{macro.unit}</span>
                  </div>
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

            {remaining.protein > 0 && (
              <div className="mt-4 p-3 bg-[#00C853]/10 border border-[#00C853]/20 rounded-xl">
                <p className="text-xs text-[#00C853]">
                  {Math.round(remaining.protein)}g protein remaining — prioritize protein at each meal
                </p>
              </div>
            )}
          </div>

          {/* Log Food CTA */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-4 bg-[#0066FF] text-white font-bold rounded-2xl hover:bg-[#0052CC] transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            <span>Log Food</span>
          </button>

          {/* Today's Meals */}
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (data?.logs?.length ?? 0) > 0 ? (
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
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-[#141414] border border-[#262626] rounded-2xl">
              <div className="text-4xl mb-3">🥗</div>
              <p className="font-semibold text-neutral-300">No meals logged yet</p>
              <p className="text-sm text-neutral-500 mt-1">Tap Log Food to get started</p>
            </div>
          )}
        </div>

        <BottomNav active="nutrition" />
      </main>

      {showModal && (
        <AddFoodModal
          onClose={() => setShowModal(false)}
          onLogged={loadData}
        />
      )}
    </>
  );
}
