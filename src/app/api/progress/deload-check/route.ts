import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { needsDeload, detectPlateau, getPlateauProtocol } from "@/lib/progressive-overload";

export const dynamic = "force-dynamic";

/**
 * GET /api/progress/deload-check
 * Returns:
 * - deloadNeeded: boolean + reason
 * - plateaus: array of stalled lifts with protocol suggestions
 */
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const sixWeeksAgo = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000);

    // 1. Check recovery scores from recent health data
    const recentHealth = await prisma.healthData.findMany({
      where: { userId, date: { gte: twoWeeksAgo } },
      select: { sleepQuality: true, energyLevel: true },
      orderBy: { date: "desc" },
      take: 14,
    });

    const recoveryScores = recentHealth.map((h) => {
      const sleep = h.sleepQuality || 5;
      const energy = h.energyLevel || 5;
      return Math.round((sleep / 10) * 55 + (energy / 10) * 45);
    });

    const deloadNeeded = needsDeload(recoveryScores);

    // 2. Check injury flag count
    const injuryFlagCount = await prisma.injuryFlag.count({
      where: { userId, acknowledged: false, createdAt: { gte: twoWeeksAgo } },
    });

    const deloadReason = deloadNeeded
      ? "Your recovery scores have averaged below 60 for the past two weeks."
      : injuryFlagCount >= 3
      ? "Multiple injury flags detected. A deload week will help you recover."
      : null;

    // 3. Detect plateaus per exercise (look at last 6 weeks of logs)
    const exerciseLogs = await prisma.exerciseLog.findMany({
      where: {
        workoutLog: {
          userId,
          completedAt: { gte: sixWeeksAgo, not: null },
        },
      },
      include: {
        sets: { orderBy: { setNumber: "asc" }, take: 1 },
        exercise: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by exercise, collect top-set weights in order
    const byExercise = new Map<string, { name: string; weights: number[] }>();
    for (const log of exerciseLogs) {
      const topSet = log.sets[0];
      if (!topSet || topSet.weight <= 0) continue;
      const existing = byExercise.get(log.exerciseId) || { name: log.exercise.name, weights: [] };
      existing.weights.push(topSet.weight);
      byExercise.set(log.exerciseId, existing);
    }

    const plateaus: Array<{
      exercise: string;
      weeksStuck: number;
      stuckWeight: number;
      protocol: { week1: string; week2: string; week3: string; week4: string };
    }> = [];

    for (const [, data] of byExercise) {
      if (data.weights.length < 3) continue;
      const check = detectPlateau(data.weights);
      if (check.isPlateaued && check.stuckWeight !== null) {
        plateaus.push({
          exercise: data.name,
          weeksStuck: check.weeksStuck,
          stuckWeight: check.stuckWeight,
          protocol: getPlateauProtocol(data.name),
        });
      }
    }

    return NextResponse.json({
      deloadNeeded: deloadNeeded || injuryFlagCount >= 3,
      deloadReason,
      recoveryAvg: recoveryScores.length > 0
        ? Math.round(recoveryScores.reduce((a, b) => a + b, 0) / recoveryScores.length)
        : null,
      plateaus: plateaus.slice(0, 3), // top 3 most important
    });
  } catch (error: any) {
    console.error("GET /api/progress/deload-check error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
