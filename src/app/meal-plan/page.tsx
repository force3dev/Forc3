"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

type MealFood = { name: string; qty: number; unit: string };
type Meal = { name: string; description?: string; calories: number; protein: number; carbs: number; fat: number; foods: MealFood[] };
type DayPlan = { day: string; meals: Meal[]; totalCalories: number; totalProtein: number };
type GroceryCategory = { category: string; items: { name: string; qty: number; unit: string }[] };

type MealPlan = {
  id: string;
  days: DayPlan[];
  groceryList: GroceryCategory[];
  calorieTarget: number;
  proteinTarget: number;
  generatedAt: string;
};

type RestaurantResult = {
  restaurant: string;
  order: { item: string; customization?: string; qty: number }[];
  estimated: { calories: number; protein: number; carbs: number; fat: number };
  tip: string;
};

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_COLORS: Record<string, string> = {
  Breakfast: "#FFB300",
  Lunch: "#0066FF",
  Dinner: "#7C3AED",
  Snack: "#00C853",
};

export default function MealPlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [showGrocery, setShowGrocery] = useState(false);
  const [showRestaurant, setShowRestaurant] = useState(false);
  const [restaurant, setRestaurant] = useState("");
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [restaurantResult, setRestaurantResult] = useState<RestaurantResult | null>(null);

  useEffect(() => {
    fetch("/api/nutrition/meal-plan")
      .then((r) => r.json())
      .then((d) => setPlan(d))
      .finally(() => setLoading(false));
  }, []);

  async function generate() {
    setGenerating(true);
    const res = await fetch("/api/nutrition/meal-plan", { method: "POST" });
    const data = await res.json();
    if (!data.error) setPlan(data);
    setGenerating(false);
  }

  async function getRestaurantOrder() {
    if (!restaurant.trim()) return;
    setRestaurantLoading(true);
    setRestaurantResult(null);
    const res = await fetch("/api/nutrition/restaurant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurant }),
    });
    const data = await res.json();
    setRestaurantResult(data);
    setRestaurantLoading(false);
  }

  const sortedDays = plan?.days ? [...plan.days].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)) : [];

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <header className="px-5 pt-8 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-neutral-400">←</button>
        <div>
          <p className="text-xs text-neutral-500 font-semibold tracking-widest">THIS WEEK</p>
          <h1 className="text-xl font-bold">Meal Plan</h1>
        </div>
        {plan && (
          <button onClick={() => setShowGrocery(true)} className="ml-auto text-xs bg-[#141414] border border-[#262626] px-3 py-1.5 rounded-lg">
            🛒 Grocery List
          </button>
        )}
      </header>

      <div className="px-5 space-y-4">
        {/* Restaurant Mode */}
        <button
          onClick={() => setShowRestaurant(true)}
          className="w-full bg-[#141414] border border-[#FFB300]/30 rounded-2xl p-4 flex items-center gap-3 text-left"
        >
          <span className="text-2xl">🍽️</span>
          <div>
            <p className="font-semibold text-sm">Restaurant Mode</p>
            <p className="text-xs text-neutral-500">Tell me where you&apos;re eating — I&apos;ll build your order</p>
          </div>
          <span className="ml-auto text-neutral-500">→</span>
        </button>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : plan ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-500">Generated {new Date(plan.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
              <button onClick={generate} disabled={generating} className="text-xs text-[#0066FF]">
                {generating ? "Regenerating..." : "Regenerate"}
              </button>
            </div>

            {/* Days */}
            {sortedDays.map((day) => (
              <div key={day.day} className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{day.day}</span>
                    <span className="text-xs text-neutral-500">{Math.round(day.totalCalories || 0)} kcal · {Math.round(day.totalProtein || 0)}g protein</span>
                  </div>
                  <span className="text-neutral-500 text-sm">{expandedDay === day.day ? "▲" : "▼"}</span>
                </button>

                {expandedDay === day.day && (
                  <div className="border-t border-[#262626] divide-y divide-[#1a1a1a]">
                    {day.meals.map((meal, i) => (
                      <div key={i} className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: MEAL_COLORS[meal.name] || "#666" }} />
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: MEAL_COLORS[meal.name] || "#999" }}>{meal.name}</span>
                          <span className="text-xs text-neutral-600 ml-auto">{Math.round(meal.calories)} kcal · P:{Math.round(meal.protein)}g</span>
                        </div>
                        {meal.description && <p className="text-sm text-neutral-300 mb-1">{meal.description}</p>}
                        {meal.foods?.length > 0 && (
                          <div className="space-y-0.5">
                            {meal.foods.map((f, j) => (
                              <p key={j} className="text-xs text-neutral-500">{f.qty}{f.unit} {f.name}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          /* No plan yet */
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">🍱</div>
            <h2 className="text-xl font-black">No Meal Plan Yet</h2>
            <p className="text-neutral-400 text-sm px-8">Generate a personalized 7-day meal plan that hits your exact macro targets.</p>
            <button
              onClick={generate}
              disabled={generating}
              className="px-8 py-3 bg-[#0066FF] rounded-2xl font-bold disabled:opacity-50"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating your plan...
                </span>
              ) : "Generate This Week's Plan →"}
            </button>
          </div>
        )}
      </div>

      {/* Grocery List Modal */}
      {showGrocery && plan && (
        <>
          <div className="fixed inset-0 bg-black/80 z-40" onClick={() => setShowGrocery(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#141414] rounded-t-3xl p-5 pb-10 max-h-[80vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#333] rounded-full mx-auto mb-5" />
            <h2 className="text-xl font-bold mb-4">🛒 Grocery List</h2>
            <div className="space-y-5">
              {(plan.groceryList as GroceryCategory[]).map((cat, i) => (
                <div key={i}>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-2">{cat.category}</p>
                  <div className="space-y-1.5">
                    {cat.items.map((item, j) => (
                      <div key={j} className="flex justify-between text-sm">
                        <span className="text-white">{item.name}</span>
                        <span className="text-neutral-400">{item.qty} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Restaurant Modal */}
      {showRestaurant && (
        <>
          <div className="fixed inset-0 bg-black/80 z-40" onClick={() => { setShowRestaurant(false); setRestaurantResult(null); }} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#141414] rounded-t-3xl p-5 pb-10">
            <div className="w-10 h-1 bg-[#333] rounded-full mx-auto mb-5" />
            <h2 className="text-xl font-bold mb-1">🍽️ Restaurant Mode</h2>
            <p className="text-sm text-neutral-400 mb-4">I&apos;ll build your order to hit your remaining macros.</p>

            <div className="flex gap-2 mb-4">
              <input
                value={restaurant}
                onChange={(e) => setRestaurant(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && getRestaurantOrder()}
                placeholder="e.g. Chipotle, McDonald's, Subway..."
                className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0066FF]"
              />
              <button
                onClick={getRestaurantOrder}
                disabled={restaurantLoading || !restaurant.trim()}
                className="px-4 py-2.5 bg-[#0066FF] rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {restaurantLoading ? "..." : "Go"}
              </button>
            </div>

            {restaurantLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-sm text-neutral-400">Building your order...</span>
              </div>
            )}

            {restaurantResult && !restaurantLoading && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Your Order</p>
                  {restaurantResult.order?.map((item, i) => (
                    <div key={i} className="bg-[#0a0a0a] rounded-xl p-3">
                      <p className="font-semibold text-sm">{item.qty > 1 ? `${item.qty}× ` : ""}{item.item}</p>
                      {item.customization && <p className="text-xs text-neutral-500 mt-0.5">{item.customization}</p>}
                    </div>
                  ))}
                </div>

                {restaurantResult.estimated && (
                  <div className="grid grid-cols-4 gap-2 bg-[#0a0a0a] rounded-xl p-3">
                    {[
                      { label: "Cal", value: restaurantResult.estimated.calories },
                      { label: "Protein", value: `${restaurantResult.estimated.protein}g` },
                      { label: "Carbs", value: `${restaurantResult.estimated.carbs}g` },
                      { label: "Fat", value: `${restaurantResult.estimated.fat}g` },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-xs text-neutral-500">{s.label}</p>
                        <p className="font-bold text-sm">{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {restaurantResult.tip && (
                  <div className="bg-[#FFB300]/10 border border-[#FFB300]/30 rounded-xl p-3">
                    <p className="text-xs text-[#FFB300]">💡 {restaurantResult.tip}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <BottomNav active="home" />
    </main>
  );
}
