import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { getFoodByBarcode } from "@/lib/nutrition/openFoodFacts";
import { lookupBarcode } from "@/lib/nutritionix";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const barcode = searchParams.get("upc");

  if (!barcode || !/^\d{8,14}$/.test(barcode)) {
    return NextResponse.json({ error: "Invalid barcode" }, { status: 400 });
  }

  // Try Nutritionix first (has branded food database), then Open Food Facts
  const [nixResult, offResult] = await Promise.allSettled([
    lookupBarcode(barcode),
    getFoodByBarcode(barcode),
  ]);

  const nix = nixResult.status === "fulfilled" ? nixResult.value : null;
  const off = offResult.status === "fulfilled" ? offResult.value : null;

  if (nix) {
    return NextResponse.json({
      food: {
        id: `nix_${barcode}`,
        name: nix.name,
        brand: nix.brandName,
        servingSize: `${nix.servingQty} ${nix.servingUnit}`,
        calories: nix.calories,
        protein: nix.protein,
        carbs: nix.carbs,
        fat: nix.fat,
        fiber: nix.fiber,
        image: nix.imageUrl,
        source: "nutritionix",
      },
    });
  }

  if (off) {
    return NextResponse.json({ food: off });
  }

  return NextResponse.json({ error: "Product not found" }, { status: 404 });
}
