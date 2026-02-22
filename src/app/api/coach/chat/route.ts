import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { askCoach } from "@/lib/ai/claude";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      error: "Coach not configured",
      message: "Add ANTHROPIC_API_KEY to .env to enable the AI coach.",
    }, { status: 503 });
  }

  try {
    const response = await askCoach(userId, message);
    return NextResponse.json({ response });
  } catch (err) {
    console.error("Coach error:", err);
    return NextResponse.json({ error: "Coach unavailable. Try again shortly." }, { status: 500 });
  }
}
