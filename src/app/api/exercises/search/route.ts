import { NextRequest, NextResponse } from "next/server";
import { searchExercises } from "@/lib/exercise-api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const muscleGroup = searchParams.get("muscle") || undefined;
  const equipment = searchParams.get("equipment") || undefined;
  const category = searchParams.get("category") || undefined;

  try {
    const results = await searchExercises(query, { muscleGroup, equipment, category });
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Exercise search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
