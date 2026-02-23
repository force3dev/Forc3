import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, value } = await req.json();
  // type: "workouts" | "volume" | "cardio_minutes" | "streak" | "prs"
  // value: number to add

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const boss = await prisma.bossBattle.findUnique({
    where: { month_year: { month, year } },
  });
  if (!boss) return NextResponse.json({ ok: false, reason: "No active boss" });

  const entry = await prisma.bossBattleEntry.findUnique({
    where: { userId_bossBattleId: { userId, bossBattleId: boss.id } },
  });
  if (!entry) return NextResponse.json({ ok: false, reason: "Not joined" });
  if (entry.defeated) return NextResponse.json({ ok: true, alreadyDefeated: true });

  const progress = (entry.progress as Record<string, number>) || {};
  progress[type] = (progress[type] || 0) + value;

  // Check if all requirements are met
  const requirements = boss.requirements as { type: string; target: number }[];
  const defeated = requirements.every((req) => (progress[req.type] || 0) >= req.target);

  const updated = await prisma.bossBattleEntry.update({
    where: { id: entry.id },
    data: {
      progress,
      defeated,
      defeatedAt: defeated && !entry.defeated ? new Date() : entry.defeatedAt,
    },
  });

  // Award XP on first defeat
  if (defeated && !entry.defeated) {
    await prisma.streak.updateMany({
      where: { userId },
      data: { totalXP: { increment: boss.xpReward } },
    });
  }

  return NextResponse.json({ entry: updated, newlyDefeated: defeated && !entry.defeated });
}
