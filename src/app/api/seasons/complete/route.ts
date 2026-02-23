import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const season = await prisma.season.findFirst({
    where: { userId, status: "active" },
  });
  if (!season) return NextResponse.json({ error: "No active season" }, { status: 404 });

  const benchmarks = season.benchmarkExercises as {
    exerciseId: string;
    name: string;
    baselineWeight: number;
    baselineReps: number;
  }[];

  // Get final PRs for comparison
  const finalResults = await Promise.all(
    benchmarks.map(async (b) => {
      const pr = await prisma.personalRecord.findFirst({
        where: { userId, exerciseId: b.exerciseId, type: "1rm" },
        orderBy: { value: "desc" },
      });
      const improvement = pr
        ? Math.round(((pr.value - b.baselineWeight) / Math.max(b.baselineWeight, 1)) * 100)
        : 0;
      return {
        name: b.name,
        baseline: b.baselineWeight,
        final: pr?.value || b.baselineWeight,
        improvementPct: improvement,
      };
    })
  );

  const updated = await prisma.season.update({
    where: { id: season.id },
    data: {
      status: "completed",
      finalResults,
    },
  });

  // Award XP for completing a season
  await prisma.streak.updateMany({
    where: { userId },
    data: { totalXP: { increment: 1000 } },
  });

  return NextResponse.json({ season: updated, finalResults });
}
