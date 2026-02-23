import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CARDIO_TEMPLATES } from "@/lib/cardio-templates";
import { calculateRecoveryScore } from "@/lib/recovery-score";

export const dynamic = "force-dynamic";

const TYPE_ORDER = ["run", "swim", "bike", "row", "hiit"] as const;

function scoreTemplate(template: (typeof CARDIO_TEMPLATES)[number], dayOfWeek: number, hardYesterday: boolean, recoveryScore: number) {
  let score = 0;
  if (template.intensity === "easy") score += 20;
  if (template.intensity === "moderate") score += 14;
  if (template.intensity === "hard") score += 8;
  if (template.intensity === "max") score += 4;
  if (hardYesterday && (template.intensity === "hard" || template.intensity === "max")) score -= 30;
  if (recoveryScore < 55 && (template.intensity === "hard" || template.intensity === "max")) score -= 35;
  if (recoveryScore > 75 && template.intensity === "hard") score += 10;
  if (dayOfWeek === 6 && template.id.includes("long")) score += 30; // Saturday long session
  return score;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [profile, yesterdayCardio, recentLogs, weekLogs] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.cardioActivity.findMany({
      where: { userId, completed: true, completedAt: { gte: yesterday, lte: yesterdayEnd } },
      select: { intensity: true },
    }),
    prisma.workoutLog.findMany({
      where: { userId, startedAt: { gte: threeDaysAgo }, completedAt: { not: null } },
      select: { startedAt: true, overallRpe: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.workoutLog.findMany({
      where: { userId, startedAt: { gte: sevenDaysAgo }, completedAt: { not: null } },
      select: { startedAt: true },
    }),
  ]);

  const hardYesterday =
    yesterdayCardio.some((a) => ["hard", "max"].includes((a.intensity || "").toLowerCase())) ||
    recentLogs.some((l) => l.startedAt >= yesterday && (l.overallRpe ?? 0) >= 8);

  const hardWorkouts = recentLogs.filter((l) => (l.overallRpe ?? 0) >= 8).length;
  const trainingDays = new Set(weekLogs.map((l) => l.startedAt.toISOString().slice(0, 10))).size;
  const recovery = calculateRecoveryScore({
    workoutsLast3Days: recentLogs.length,
    hardWorkoutsLast3Days: hardWorkouts,
    restDaysLast7Days: 7 - trainingDays,
    consecutiveTrainingDays: 0,
  });

  const ranked = CARDIO_TEMPLATES.map((template) => ({
    ...template,
    score: scoreTemplate(template, now.getDay(), hardYesterday, recovery.score),
  })).sort((a, b) => b.score - a.score);

  const recommendedId = ranked[0]?.id;

  const grouped = TYPE_ORDER.map((type) => {
    const options = ranked.filter((t) => t.type === type || (type === "run" && t.type === "sprint"));
    return {
      type,
      options: options.map((o) => ({
        id: o.id,
        title: o.title,
        description: o.description,
        duration: o.duration,
        intensity: o.intensity,
        recommended: o.id === recommendedId,
      })),
    };
  }).filter((group) => group.options.length > 0);

  return NextResponse.json({
    date: now.toISOString().slice(0, 10),
    recoveryScore: recovery.score,
    recommendedWorkoutId: recommendedId,
    goal: profile?.goal || null,
    groups: grouped,
  });
}
