import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "30"; // days
  const rangeDays = Math.min(365, parseInt(range));

  const since = new Date();
  since.setDate(since.getDate() - rangeDays);

  try {
    const logs = await prisma.workoutLog.findMany({
      where: {
        userId,
        startedAt: { gte: since },
        completedAt: { not: null },
      },
      include: {
        exerciseLogs: { include: { sets: true } },
      },
      orderBy: { startedAt: "asc" },
    });

    // Build daily volume series
    const volumeByDay: Record<string, number> = {};
    for (const log of logs) {
      const day = log.startedAt.toISOString().slice(0, 10);
      const vol = log.exerciseLogs.reduce((s, el) =>
        s + el.sets.reduce((ss, set) => ss + set.weight * set.reps, 0), 0
      );
      volumeByDay[day] = (volumeByDay[day] || 0) + vol;
    }

    const volumeSeries = Object.entries(volumeByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, volume]) => ({ date, volume: Math.round(volume) }));

    // Get PR history for top 3 exercises
    const topExercises = await prisma.personalRecord.groupBy({
      by: ["exerciseId"],
      where: { userId, type: "1rm" },
      _count: { exerciseId: true },
      orderBy: { _count: { exerciseId: "desc" } },
      take: 3,
    });

    const strengthSeries: Record<string, { date: string; value: number }[]> = {};
    for (const ex of topExercises) {
      const exercise = await prisma.exercise.findUnique({
        where: { id: ex.exerciseId },
        select: { name: true },
      });
      const prs = await prisma.personalRecord.findMany({
        where: { userId, exerciseId: ex.exerciseId, type: "1rm", achievedAt: { gte: since } },
        orderBy: { achievedAt: "asc" },
      });
      if (exercise && prs.length > 0) {
        strengthSeries[exercise.name] = prs.map(pr => ({
          date: pr.achievedAt.toISOString().slice(0, 10),
          value: Math.round(pr.value),
        }));
      }
    }

    // Weekly workout frequency
    const weeklyFreq: { week: string; count: number }[] = [];
    const weekMap: Record<string, number> = {};
    for (const log of logs) {
      const d = new Date(log.startedAt);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const weekKey = monday.toISOString().slice(0, 10);
      weekMap[weekKey] = (weekMap[weekKey] || 0) + 1;
    }
    for (const [week, count] of Object.entries(weekMap).sort()) {
      weeklyFreq.push({ week, count });
    }

    return NextResponse.json({
      volumeSeries,
      strengthSeries,
      weeklyFreq,
      totalWorkouts: logs.length,
      totalVolume: Math.round(volumeSeries.reduce((s, d) => s + d.volume, 0)),
    });
  } catch (error: any) {
    console.error("GET /api/progress/analytics error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
