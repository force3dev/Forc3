/**
 * Nutritionix API integration
 * Natural language + structured food search + barcode lookup
 */

const BASE = "https://trackapi.nutritionix.com/v2";

function headers() {
  return {
    "x-app-id": process.env.NUTRITIONIX_APP_ID || "",
    "x-app-key": process.env.NUTRITIONIX_API_KEY || "",
    "Content-Type": "application/json",
  };
}

export interface NutritionItem {
  name: string;
  servingQty: number;
  servingUnit: string;
  servingWeightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  imageUrl?: string;
  brandName?: string;
  source: string;
}

export async function searchNutritionix(query: string): Promise<NutritionItem[]> {
  if (!process.env.NUTRITIONIX_APP_ID || !process.env.NUTRITIONIX_API_KEY) return [];
  try {
    const res = await fetch(`${BASE}/search/instant?query=${encodeURIComponent(query)}&self=false&branded=true&common=true&detailed=true`, {
      headers: headers(),
    });
    if (!res.ok) return [];
    const data = await res.json();

    const items: NutritionItem[] = [];

    // Common foods (generic)
    for (const food of (data.common || []).slice(0, 5)) {
      items.push({
        name: food.food_name,
        servingQty: food.serving_qty,
        servingUnit: food.serving_unit,
        servingWeightGrams: food.serving_weight_grams || 100,
        calories: Math.round(food.full_nutrients?.find((n: any) => n.attr_id === 208)?.value || 0),
        protein: Math.round(food.full_nutrients?.find((n: any) => n.attr_id === 203)?.value || 0),
        carbs: Math.round(food.full_nutrients?.find((n: any) => n.attr_id === 205)?.value || 0),
        fat: Math.round(food.full_nutrients?.find((n: any) => n.attr_id === 204)?.value || 0),
        imageUrl: food.photo?.thumb,
        source: "nutritionix",
      });
    }

    // Branded foods
    for (const food of (data.branded || []).slice(0, 5)) {
      items.push({
        name: food.food_name,
        brandName: food.brand_name,
        servingQty: food.serving_qty,
        servingUnit: food.serving_unit,
        servingWeightGrams: food.serving_weight_grams || 100,
        calories: food.nf_calories || 0,
        protein: food.nf_protein || 0,
        carbs: food.nf_total_carbohydrate || 0,
        fat: food.nf_total_fat || 0,
        fiber: food.nf_dietary_fiber,
        sodium: food.nf_sodium,
        imageUrl: food.photo?.thumb,
        source: "nutritionix",
      });
    }

    return items;
  } catch {
    return [];
  }
}

export async function naturalLanguageLog(text: string): Promise<NutritionItem[]> {
  if (!process.env.NUTRITIONIX_APP_ID || !process.env.NUTRITIONIX_API_KEY) return [];
  try {
    const res = await fetch(`${BASE}/natural/nutrients`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ query: text }),
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.foods || []).map((food: any) => ({
      name: food.food_name,
      servingQty: food.serving_qty,
      servingUnit: food.serving_unit,
      servingWeightGrams: food.serving_weight_grams || 100,
      calories: Math.round(food.nf_calories || 0),
      protein: Math.round(food.nf_protein || 0),
      carbs: Math.round(food.nf_total_carbohydrate || 0),
      fat: Math.round(food.nf_total_fat || 0),
      fiber: food.nf_dietary_fiber,
      sugar: food.nf_sugars,
      sodium: food.nf_sodium,
      imageUrl: food.photo?.thumb,
      source: "nutritionix",
    }));
  } catch {
    return [];
  }
}

export async function lookupBarcode(upc: string): Promise<NutritionItem | null> {
  if (!process.env.NUTRITIONIX_APP_ID || !process.env.NUTRITIONIX_API_KEY) return null;
  try {
    const res = await fetch(`${BASE}/search/item?upc=${upc}`, { headers: headers() });
    if (!res.ok) return null;
    const data = await res.json();
    const food = data.foods?.[0];
    if (!food) return null;

    return {
      name: food.food_name,
      brandName: food.brand_name,
      servingQty: food.serving_qty,
      servingUnit: food.serving_unit,
      servingWeightGrams: food.serving_weight_grams || 100,
      calories: Math.round(food.nf_calories || 0),
      protein: Math.round(food.nf_protein || 0),
      carbs: Math.round(food.nf_total_carbohydrate || 0),
      fat: Math.round(food.nf_total_fat || 0),
      fiber: food.nf_dietary_fiber,
      sodium: food.nf_sodium,
      imageUrl: food.photo?.thumb,
      source: "nutritionix",
    };
  } catch {
    return null;
  }
}
