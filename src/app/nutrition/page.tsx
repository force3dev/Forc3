"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface MealLog {
  id: string;
  date: string;
  mealName?: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

export default function NutritionPage() {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const fetchMeals = () => {
    fetch("/api/nutrition")
      .then(r => r.json())
      .then(d => setMeals(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMeals(); }, []);

  // Today's meals only
  const today = new Date().toDateString();
  const todayMeals = meals.filter(m => new Date(m.date).toDateString() === today);

  const totals = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + (m.proteinG || 0),
      carbs: acc.carbs + (m.carbsG || 0),
      fat: acc.fat + (m.fatG || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calories) return;
    setLogging(true);

    try {
      await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealName: mealName || undefined,
          calories: parseInt(calories),
          proteinG: protein ? parseInt(protein) : undefined,
          carbsG: carbs ? parseInt(carbs) : undefined,
          fatG: fat ? parseInt(fat) : undefined,
        }),
      });

      setMealName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setShowForm(false);
      fetchMeals();
    } catch {
      // silent fail
    } finally {
      setLogging(false);
    }
  };

  const MacroBar = ({ label, value, target, color }: { label: string; value: number; target: number; color: string }) => (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-neutral-400">{label}</span>
        <span>{value}g</span>
      </div>
      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, target > 0 ? (value / target) * 100 : 0)}%` }}
        />
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <header className="p-6 pb-4">
        <div className="text-xs font-semibold tracking-widest text-neutral-500">FORCE3</div>
        <h1 className="text-xl font-semibold mt-1">Nutrition</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      </header>

      <div className="px-6 space-y-4">
        {/* Today's Summary */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <div className="text-xs text-neutral-500 uppercase tracking-wide mb-4">Today</div>

          {/* Calories */}
          <div className="mb-5">
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="text-3xl font-semibold">{totals.calories}</div>
                <div className="text-xs text-neutral-500 mt-0.5">calories consumed</div>
              </div>
            </div>
          </div>

          {/* Macros */}
          <div className="space-y-3">
            <MacroBar label="Protein" value={totals.protein} target={180} color="bg-emerald-500" />
            <MacroBar label="Carbs" value={totals.carbs} target={220} color="bg-blue-500" />
            <MacroBar label="Fat" value={totals.fat} target={70} color="bg-amber-500" />
          </div>
        </div>

        {/* Log a Meal */}
        {showForm ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="text-xs text-neutral-500 uppercase tracking-wide mb-4">Log Meal</div>
            <form onSubmit={handleLogMeal} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400">Meal name (optional)</label>
                <input
                  type="text"
                  value={mealName}
                  onChange={e => setMealName(e.target.value)}
                  placeholder="e.g. Chicken rice bowl"
                  className="mt-1.5 w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:border-white focus:outline-none text-sm transition-colors"
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
                    className="mt-1.5 w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:border-white focus:outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400">Protein (g)</label>
                  <input
                    type="number"
                    value={protein}
                    onChange={e => setProtein(e.target.value)}
                    placeholder="40"
                    className="mt-1.5 w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:border-white focus:outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400">Carbs (g)</label>
                  <input
                    type="number"
                    value={carbs}
                    onChange={e => setCarbs(e.target.value)}
                    placeholder="60"
                    className="mt-1.5 w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:border-white focus:outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400">Fat (g)</label>
                  <input
                    type="number"
                    value={fat}
                    onChange={e => setFat(e.target.value)}
                    placeholder="15"
                    className="mt-1.5 w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:border-white focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 border border-neutral-700 text-sm rounded-xl hover:border-neutral-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={logging || !calories}
                  className="flex-1 py-3 bg-white text-black text-sm font-semibold rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {logging ? "Logging..." : "Log Meal"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-sm font-medium hover:border-neutral-600 transition-colors"
          >
            + Log a Meal
          </button>
        )}

        {/* Today's Meals */}
        {todayMeals.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800">
              <div className="text-xs text-neutral-500 uppercase tracking-wide">Meals Logged Today</div>
            </div>
            <div className="divide-y divide-neutral-800">
              {todayMeals.map(meal => (
                <div key={meal.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{meal.mealName || "Meal"}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {[
                        meal.proteinG ? `${meal.proteinG}g protein` : null,
                        meal.carbsG ? `${meal.carbsG}g carbs` : null,
                        meal.fatG ? `${meal.fatG}g fat` : null,
                      ].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{meal.calories} cal</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center text-neutral-600 text-sm py-4">Loading...</div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-neutral-900 px-6 py-4">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link href="/dashboard" className="flex flex-col items-center text-neutral-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/plan" className="flex flex-col items-center text-neutral-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs mt-1">Plan</span>
          </Link>
          <Link href="/nutrition" className="flex flex-col items-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs mt-1">Nutrition</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center text-neutral-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
