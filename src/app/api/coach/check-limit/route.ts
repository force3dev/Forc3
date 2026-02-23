import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
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

async function getOrCreateSubscription(userId: string) {
  let sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) {
    sub = await prisma.subscription.create({
      data: { userId, tier: "free", status: "active" },
    });
  }
  return sub;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getOrCreateSubscription(userId);
  const tier = toSimpleTier(sub.tier);

  const now = new Date();
  const resetAt = sub.aiMessagesResetAt;
  const usedToday = isSameDay(now, resetAt) ? sub.aiMessagesUsedToday : 0;

  const remaining = getRemainingMessages(tier, usedToday);
  return NextResponse.json({ remaining, canSend: remaining > 0 || tier === "premium" });
}

export async function POST(_req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getOrCreateSubscription(userId);
  const tier = toSimpleTier(sub.tier);

  const now = new Date();
  const resetAt = sub.aiMessagesResetAt;
  const usedToday = isSameDay(now, resetAt) ? sub.aiMessagesUsedToday : 0;
  const limit = LIMITS[tier].aiMessagesPerDay;

  if (usedToday >= limit && tier === "free") {
    return NextResponse.json({ remaining: 0, canSend: false });
  }

  const newUsed = usedToday + 1;
  await prisma.subscription.update({
    where: { userId },
    data: {
      aiMessagesUsedToday: newUsed,
      aiMessagesResetAt: isSameDay(now, resetAt) ? undefined : now,
    },
  });

  const remaining = getRemainingMessages(tier, newUsed);
  return NextResponse.json({ remaining, canSend: remaining > 0 || tier === "premium" });
}
