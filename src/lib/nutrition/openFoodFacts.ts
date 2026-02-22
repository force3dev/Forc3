export interface FoodSearchResult {
  id: string;
  name: string;
  brand?: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  image?: string;
  source: "openfoodfacts" | "usda" | "ai";
}

const OFF_BASE = "https://world.openfoodfacts.org";

export async function searchOpenFoodFacts(query: string): Promise<FoodSearchResult[]> {
  const url = `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=code,product_name,brands,nutriments,image_small_url,serving_size`;

  const res = await fetch(url, {
    headers: { "User-Agent": "FORC3-App/1.0 (contact@forc3.app)" },
    signal: AbortSignal.timeout(5000),
  });

  const data = await res.json();

  return (data.products || [])
    .filter((p: Record<string, unknown>) => {
      const n = p.nutriments as Record<string, number> | undefined;
      return n && (n["energy-kcal_100g"] || n["energy-kcal"]);
    })
    .map((p: Record<string, unknown>) => {
      const n = p.nutriments as Record<string, number>;
      return {
        id: `off_${p.code}`,
        name: (p.product_name as string) || "Unknown",
        brand: p.brands as string | undefined,
        servingSize: (p.serving_size as string) || "100g",
        calories: Math.round(n["energy-kcal_100g"] || n["energy-kcal"] || 0),
        protein: Math.round(n.proteins_100g || n.proteins || 0),
        carbs: Math.round(n.carbohydrates_100g || n.carbohydrates || 0),
        fat: Math.round(n.fat_100g || n.fat || 0),
        fiber: Math.round(n.fiber_100g || n.fiber || 0),
        image: p.image_small_url as string | undefined,
        source: "openfoodfacts" as const,
      };
    })
    .slice(0, 12);
}

export async function getFoodByBarcode(barcode: string): Promise<FoodSearchResult | null> {
  const res = await fetch(`${OFF_BASE}/api/v0/product/${barcode}.json`, {
    headers: { "User-Agent": "FORC3-App/1.0 (contact@forc3.app)" },
    signal: AbortSignal.timeout(5000),
  });
  const data = await res.json();
  if (data.status !== 1) return null;
  const p = data.product;
  const n = p.nutriments || {};
  return {
    id: `off_${p.code}`,
    name: p.product_name || "Unknown",
    brand: p.brands,
    servingSize: p.serving_size || "100g",
    calories: Math.round(n["energy-kcal_100g"] || 0),
    protein: Math.round(n.proteins_100g || 0),
    carbs: Math.round(n.carbohydrates_100g || 0),
    fat: Math.round(n.fat_100g || 0),
    fiber: Math.round(n.fiber_100g || 0),
    image: p.image_small_url,
    source: "openfoodfacts",
  };
}
