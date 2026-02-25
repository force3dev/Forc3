import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [prs, workoutLogs, cardioActivities, streak, achievements] = await Promise.all([
      prisma.personalRecord.findMany({
        where: { userId },
        include: { exercise: { select: { name: true } } },
        orderBy: { achievedAt: "desc" },
        take: 100,
      }),
      prisma.workoutLog.findMany({
        where: { userId },
        include: {
          exerciseLogs: {
            include: { sets: { select: { weight: true, reps: true } } },
          },
        },
        orderBy: { startedAt: "desc" },
        take: 200,
      }),
      prisma.cardioActivity.findMany({
        where: { userId, completed: true },
        orderBy: { date: "desc" },
        take: 100,
      }),
      prisma.streak.findUnique({ where: { userId } }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
    ]);

    // Strength stats
    const prsByExercise: Record<string, { name: string; best: number; reps: number; date: string }> = {};
    for (const pr of prs) {
      const name = pr.exercise.name;
      if (!prsByExercise[name] || pr.value > prsByExercise[name].best) {
        prsByExercise[name] = { name, best: pr.value, reps: pr.reps || 1, date: pr.achievedAt.toISOString() };
      }
    }

    // Volume stats
    let totalVolume = 0, totalSets = 0;
    for (const log of workoutLogs) {
      for (const el of log.exerciseLogs) {
        for (const s of el.sets) {
          totalVolume += s.weight * s.reps;
          totalSets++;
        }
      }
    }

    // Cardio stats
    const cardioByType: Record<string, { count: number; totalDuration: number; totalDistance: number }> = {};
    for (const c of cardioActivities) {
      if (!cardioByType[c.type]) cardioByType[c.type] = { count: 0, totalDuration: 0, totalDistance: 0 };
      cardioByType[c.type].count++;
      cardioByType[c.type].totalDuration += c.duration || 0;
      cardioByType[c.type].totalDistance += c.distance || 0;
    }

    // Training frequency by hour
    const hourFreq: number[] = Array(24).fill(0);
    for (const log of workoutLogs) {
      const h = new Date(log.startedAt).getHours();
      hourFreq[h]++;
    }
    const peakHour = hourFreq.indexOf(Math.max(...hourFreq));

    return NextResponse.json({
      strength: {
        prsByExercise: Object.values(prsByExercise),
        totalVolume: Math.round(totalVolume),
        totalSets,
      },
      cardio: cardioByType,
      habits: {
        totalWorkouts: workoutLogs.length,
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
        totalXP: streak?.totalXP || 0,
        level: streak?.level || 1,
        peakHour,
      },
      achievements: achievements.map(ua => ({
        code: ua.achievement.code,
        name: ua.achievement.name,
        icon: ua.achievement.icon,
        unlockedAt: ua.unlockedAt,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/progress/stats error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
