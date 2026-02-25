import type { FoodResult } from "./types";

export async function searchEdamam(query: string): Promise<FoodResult[]> {
  if (!process.env.EDAMAM_APP_ID || !process.env.EDAMAM_APP_KEY) return [];

  const response = await fetch(
    `https://api.edamam.com/api/food-database/v2/parser?app_id=${process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_APP_KEY}&ingr=${encodeURIComponent(query)}&nutrition-type=cooking`,
    { signal: AbortSignal.timeout(5000) }
  );
  const data = await response.json();

  return (data.hints || []).slice(0, 5).map((hint: any): FoodResult => {
    const food = hint.food;
    const nutrients = food.nutrients;
    return {
      id: `edamam-${food.foodId}`,
      name: food.label,
      brand: food.brand || undefined,
      calories: Math.round(nutrients.ENERC_KCAL || 0),
      protein: parseFloat((nutrients.PROCNT || 0).toFixed(1)),
      carbs: parseFloat((nutrients.CHOCDF || 0).toFixed(1)),
      fat: parseFloat((nutrients.FAT || 0).toFixed(1)),
      fiber: nutrients.FIBTG ? parseFloat(nutrients.FIBTG.toFixed(1)) : undefined,
      servingSize: 100,
      servingUnit: "g",
      source: "edamam",
      verified: true,
    };
  });
}
