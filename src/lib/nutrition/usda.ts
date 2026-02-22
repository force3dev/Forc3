import type { FoodSearchResult } from "./openFoodFacts";

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

export async function searchUSDA(query: string): Promise<FoodSearchResult[]> {
  const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
  const url = `${USDA_BASE}/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=15&dataType=Foundation,SR%20Legacy,Branded`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return [];
  const data = await res.json();

  const getNutrient = (nutrients: Array<{ nutrientName: string; value: number }>, name: string) =>
    nutrients.find(n => n.nutrientName === name)?.value || 0;

  return (data.foods || []).map((food: {
    fdcId: number;
    description: string;
    brandOwner?: string;
    servingSize?: number;
    servingSizeUnit?: string;
    foodNutrients: Array<{ nutrientName: string; value: number }>;
  }) => ({
    id: `usda_${food.fdcId}`,
    name: food.description,
    brand: food.brandOwner,
    servingSize: food.servingSize ? `${food.servingSize}${food.servingSizeUnit || "g"}` : "100g",
    calories: Math.round(getNutrient(food.foodNutrients, "Energy")),
    protein: Math.round(getNutrient(food.foodNutrients, "Protein")),
    carbs: Math.round(getNutrient(food.foodNutrients, "Carbohydrate, by difference")),
    fat: Math.round(getNutrient(food.foodNutrients, "Total lipid (fat)")),
    fiber: Math.round(getNutrient(food.foodNutrients, "Fiber, total dietary")),
    source: "usda" as const,
  }));
}
