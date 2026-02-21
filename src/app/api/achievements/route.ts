import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { seedAchievements } from "@/lib/gamification/achievements";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure achievements exist
  await seedAchievements();

  const [allAchievements, userAchievements] = await Promise.all([
    prisma.achievement.findMany({ orderBy: [{ category: "asc" }, { xpReward: "asc" }] }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    }),
  ]);

  const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

  const achievements = allAchievements.map(a => ({
    id: a.id,
    code: a.code,
    name: a.name,
    description: a.description,
    icon: a.icon,
    category: a.category,
    xpReward: a.xpReward,
    unlocked: unlockedIds.has(a.id),
    unlockedAt: userAchievements.find(ua => ua.achievementId === a.id)?.unlockedAt || null,
  }));

  const totalXP = userAchievements.reduce((s, ua) => s + ua.achievement.xpReward, 0);

  return NextResponse.json({ achievements, totalXP, unlockedCount: userAchievements.length });
}
