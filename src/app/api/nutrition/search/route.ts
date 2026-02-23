import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { searchOpenFoodFacts } from "@/lib/nutrition/openFoodFacts";
import { searchUSDA } from "@/lib/nutrition/usda";
import { searchNutritionix } from "@/lib/nutritionix";
import { searchEdamam } from "@/lib/edamam";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Search all databases in parallel, tolerate failures
  const [offResults, usdaResults, nixResults, edamamResults] = await Promise.all([
    searchOpenFoodFacts(query).catch(() => []),
    searchUSDA(query).catch(() => []),
    searchNutritionix(query).catch(() => []),
    searchEdamam(query).catch(() => []),
  ]);

  // Normalize Nutritionix + Edamam to FoodSearchResult format
  const nixNormalized = nixResults.map((n: any) => ({
    id: `nix_${n.name.replace(/\s/g, "_")}`,
    name: n.name,
    brand: n.brandName,
    servingSize: `${n.servingQty} ${n.servingUnit}`,
    calories: n.calories,
    protein: n.protein,
    carbs: n.carbs,
    fat: n.fat,
    fiber: n.fiber,
    image: n.imageUrl,
    source: "nutritionix" as const,
  }));

  const edamamNormalized = edamamResults.map((e: any) => ({
    id: `edamam_${e.name.replace(/\s/g, "_")}`,
    name: e.name,
    brand: e.brandName,
    servingSize: "100g",
    calories: e.calories,
    protein: e.protein,
    carbs: e.carbs,
    fat: e.fat,
    fiber: e.fiber,
    image: e.imageUrl,
    source: "edamam" as const,
  }));

  // Combine: prioritize USDA + Nutritionix (most reliable), then OFF + Edamam
  const combined = [...usdaResults, ...nixNormalized, ...offResults, ...edamamNormalized];
  const lowerQ = query.toLowerCase();
  combined.sort((a, b) => {
    const aExact = a.name.toLowerCase().startsWith(lowerQ);
    const bExact = b.name.toLowerCase().startsWith(lowerQ);
    const aContains = a.name.toLowerCase().includes(lowerQ);
    const bContains = b.name.toLowerCase().includes(lowerQ);
    if (aExact && !bExact) return -1;
    if (bExact && !aExact) return 1;
    if (aContains && !bContains) return -1;
    if (bContains && !aContains) return 1;
    return 0;
  });

  // Filter out entries with 0 calories (bad data)
  const filtered = combined.filter(f => f.calories > 0);

  return NextResponse.json({ results: filtered.slice(0, 20) });
}
