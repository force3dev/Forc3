import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { estimateCalories } from "@/lib/ai/claude";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.CLAUDE_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const { description } = await req.json();
  if (!description?.trim()) {
    return NextResponse.json({ error: "Description required" }, { status: 400 });
  }

  try {
    const estimate = await estimateCalories(description);
    return NextResponse.json(estimate);
  } catch (err) {
    console.error("Estimate error:", err);
    return NextResponse.json({ error: "Estimation failed" }, { status: 500 });
  }
}
