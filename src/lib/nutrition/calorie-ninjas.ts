import type { FoodResult } from "./types";

export async function searchCalorieNinjas(query: string): Promise<FoodResult[]> {
  if (!process.env.CALORIE_NINJAS_API_KEY) return [];

  const response = await fetch(
    `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`,
    {
      headers: { "X-Api-Key": process.env.CALORIE_NINJAS_API_KEY },
      signal: AbortSignal.timeout(5000),
    }
  );
  const data = await response.json();

  return (data.items || []).map((item: any): FoodResult => ({
    id: `cn-${item.name.replace(/\s/g, "-")}`,
    name: item.name,
    calories: Math.round(item.calories),
    protein: parseFloat(item.protein_g.toFixed(1)),
    carbs: parseFloat(item.carbohydrates_total_g.toFixed(1)),
    fat: parseFloat(item.fat_total_g.toFixed(1)),
    fiber: item.fiber_g ? parseFloat(item.fiber_g.toFixed(1)) : undefined,
    sugar: item.sugar_g ? parseFloat(item.sugar_g.toFixed(1)) : undefined,
    sodium: item.sodium_mg ? Math.round(item.sodium_mg) : undefined,
    servingSize: Math.round(item.serving_size_g || 100),
    servingUnit: "g",
    source: "calorieninjas",
    verified: true,
  }));
}
