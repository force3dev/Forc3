import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { calculateRecoveryScore } from "@/lib/recovery-score";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [recentLogs, weekLogs] = await Promise.all([
    prisma.workoutLog.findMany({
      where: { userId, startedAt: { gte: threeDaysAgo }, completedAt: { not: null } },
      select: { startedAt: true, overallRpe: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.workoutLog.findMany({
      where: { userId, startedAt: { gte: sevenDaysAgo }, completedAt: { not: null } },
      select: { startedAt: true },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const hardWorkouts = recentLogs.filter((l) => (l.overallRpe ?? 0) >= 8).length;
  const trainingDays = new Set(weekLogs.map((l) => l.startedAt.toISOString().slice(0, 10))).size;
  const restDaysLast7Days = 7 - trainingDays;

  let consecutiveTrainingDays = 0;
  const allDates = new Set(weekLogs.map((l) => l.startedAt.toISOString().slice(0, 10)));
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
    if (allDates.has(d)) consecutiveTrainingDays++;
    else break;
  }

  const result = calculateRecoveryScore({
    workoutsLast3Days: recentLogs.length,
    hardWorkoutsLast3Days: hardWorkouts,
    restDaysLast7Days,
    consecutiveTrainingDays,
  });

  return NextResponse.json(result);
}
