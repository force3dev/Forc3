import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { askCoach } from "@/lib/ai/claude";
import { prisma } from "@/lib/prisma";
import { toSimpleTier, getRemainingMessages, LIMITS } from "@/lib/subscription";

export const dynamic = "force-dynamic";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // Check rate limit
  let sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) {
    sub = await prisma.subscription.create({ data: { userId, tier: "free", status: "active" } });
  }
  const tier = toSimpleTier(sub.tier);
  const now = new Date();
  const usedToday = isSameDay(now, sub.aiMessagesResetAt) ? sub.aiMessagesUsedToday : 0;
  const remaining = getRemainingMessages(tier, usedToday);

  if (remaining <= 0 && tier === "free") {
    return NextResponse.json({
      error: "limit_reached",
      message: "You've used your 1 daily AI message. Upgrade to Premium for unlimited coaching.",
      canSend: false,
    }, { status: 429 });
  }

  if (!process.env.CLAUDE_API_KEY) {
    return NextResponse.json({
      error: "Coach not configured",
      message: "Add CLAUDE_API_KEY to .env.local to enable the AI coach.",
    }, { status: 503 });
  }

  // Increment count for free users
  if (tier === "free") {
    const newUsed = usedToday + 1;
    await prisma.subscription.update({
      where: { userId },
      data: {
        aiMessagesUsedToday: newUsed,
        aiMessagesResetAt: isSameDay(now, sub.aiMessagesResetAt) ? undefined : now,
      },
    });
  }

  try {
    const response = await askCoach(userId, message);
    const newRemaining = tier === "free" ? Math.max(0, LIMITS.free.aiMessagesPerDay - (usedToday + 1)) : 999;
    return NextResponse.json({ response, remaining: newRemaining });
  } catch (err) {
    console.error("Coach error:", err);
    return NextResponse.json({ error: "Coach unavailable. Try again shortly." }, { status: 500 });
  }
}
