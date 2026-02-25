import type { FoodResult } from "./types";

export async function searchNutritionix(query: string): Promise<FoodResult[]> {
  if (!process.env.NUTRITIONIX_APP_ID || !process.env.NUTRITIONIX_API_KEY) return [];

  const response = await fetch("https://trackapi.nutritionix.com/v2/search/instant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-id": process.env.NUTRITIONIX_APP_ID,
      "x-app-key": process.env.NUTRITIONIX_API_KEY,
    },
    body: JSON.stringify({ query, detailed: true }),
    signal: AbortSignal.timeout(5000),
  });
  const data = await response.json();

  const mapItem = (item: any, source: string): FoodResult => ({
    id: `nix-${item.nix_item_id || item.food_name}`,
    name: item.food_name,
    brand: item.brand_name || undefined,
    calories: Math.round(item.nf_calories || 0),
    protein: parseFloat((item.nf_protein || 0).toFixed(1)),
    carbs: parseFloat((item.nf_total_carbohydrate || 0).toFixed(1)),
    fat: parseFloat((item.nf_total_fat || 0).toFixed(1)),
    fiber: item.nf_dietary_fiber,
    sugar: item.nf_sugars,
    sodium: item.nf_sodium,
    servingSize: item.serving_qty || 1,
    servingUnit: item.serving_unit || "serving",
    servingDescription: item.serving_weight_grams ? `${item.serving_weight_grams}g` : undefined,
    source,
    verified: true,
  });

  return [
    ...(data.branded || []).map((i: any) => mapItem(i, "nutritionix-branded")),
    ...(data.common || []).map((i: any) => mapItem(i, "nutritionix-common")),
  ];
}

export async function logNaturalLanguage(text: string): Promise<FoodResult[]> {
  if (!process.env.NUTRITIONIX_APP_ID || !process.env.NUTRITIONIX_API_KEY) return [];

  const response = await fetch("https://trackapi.nutritionix.com/v2/natural/nutrients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-id": process.env.NUTRITIONIX_APP_ID,
      "x-app-key": process.env.NUTRITIONIX_API_KEY,
    },
    body: JSON.stringify({ query: text }),
    signal: AbortSignal.timeout(8000),
  });
  const data = await response.json();

  return (data.foods || []).map((item: any): FoodResult => ({
    id: `nix-nlp-${item.food_name}`,
    name: item.food_name,
    calories: Math.round(item.nf_calories || 0),
    protein: parseFloat((item.nf_protein || 0).toFixed(1)),
    carbs: parseFloat((item.nf_total_carbohydrate || 0).toFixed(1)),
    fat: parseFloat((item.nf_total_fat || 0).toFixed(1)),
    fiber: item.nf_dietary_fiber,
    servingSize: item.serving_qty || 1,
    servingUnit: item.serving_unit || "serving",
    source: "nutritionix-nlp",
    verified: true,
  }));
}
