import { NextRequest, NextResponse } from "next/server";
import { getFoodByBarcode } from "@/lib/nutrition/search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode");

  if (!barcode) return NextResponse.json({ food: null });

  try {
    const food = await getFoodByBarcode(barcode);
    return NextResponse.json({ food });
  } catch {
    return NextResponse.json({ food: null });
  }
}
