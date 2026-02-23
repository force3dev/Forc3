/**
 * Edamam Food Database API integration
 */

const BASE = "https://api.edamam.com/api/food-database/v2";

import { NutritionItem } from "./nutritionix";

export async function searchEdamam(query: string): Promise<NutritionItem[]> {
  const appId = process.env.EDAMAM_FOOD_APP_ID;
  const appKey = process.env.EDAMAM_FOOD_APP_KEY;
  if (!appId || !appKey) return [];

  try {
    const url = `${BASE}/parser?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(query)}&nutrition-type=logging`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.hints || []).slice(0, 8).map((hint: any) => {
      const food = hint.food;
      const nutrients = food.nutrients || {};
      return {
        name: food.label,
        brandName: food.brand,
        servingQty: 1,
        servingUnit: "serving",
        servingWeightGrams: 100,
        calories: Math.round(nutrients.ENERC_KCAL || 0),
        protein: Math.round(nutrients.PROCNT || 0),
        carbs: Math.round(nutrients.CHOCDF || 0),
        fat: Math.round(nutrients.FAT || 0),
        fiber: nutrients.FIBTG ? Math.round(nutrients.FIBTG) : undefined,
        imageUrl: food.image,
        source: "edamam",
      };
    });
  } catch {
    return [];
  }
}

export async function edamamNutritionAnalysis(ingredient: string): Promise<NutritionItem | null> {
  const appId = process.env.EDAMAM_NUTRITION_APP_ID;
  const appKey = process.env.EDAMAM_NUTRITION_APP_KEY;
  if (!appId || !appKey) return null;

  try {
    const res = await fetch(
      `https://api.edamam.com/api/nutrition-data?app_id=${appId}&app_key=${appKey}&nutrition-type=cooking&ingr=${encodeURIComponent(ingredient)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const n = data.totalNutrients || {};

    return {
      name: ingredient,
      servingQty: 1,
      servingUnit: "serving",
      servingWeightGrams: data.totalWeight || 100,
      calories: Math.round(n.ENERC_KCAL?.quantity || 0),
      protein: Math.round(n.PROCNT?.quantity || 0),
      carbs: Math.round(n.CHOCDF?.quantity || 0),
      fat: Math.round(n.FAT?.quantity || 0),
      fiber: n.FIBTG ? Math.round(n.FIBTG.quantity) : undefined,
      source: "edamam",
    };
  } catch {
    return null;
  }
}
