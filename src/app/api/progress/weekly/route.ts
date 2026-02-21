import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { analyzeWeek } from "@/lib/ai/weeklyAdaptation";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const analysis = await analyzeWeek(userId);
    return NextResponse.json(analysis);
  } catch (err) {
    console.error("Weekly analysis error:", err);
    return NextResponse.json({ error: "Failed to analyze week" }, { status: 500 });
  }
}
