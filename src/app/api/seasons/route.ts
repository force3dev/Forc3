import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const active = await prisma.season.findFirst({
    where: { userId, status: "active" },
    orderBy: { createdAt: "desc" },
  });

  const history = await prisma.season.findMany({
    where: { userId, status: { not: "active" } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Update weekNumber based on days elapsed
  if (active) {
    const daysElapsed = Math.floor(
      (Date.now() - active.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weekNumber = Math.min(12, Math.floor(daysElapsed / 7) + 1);
    if (weekNumber !== active.weekNumber) {
      await prisma.season.update({
        where: { id: active.id },
        data: { weekNumber },
      });
      active.weekNumber = weekNumber;
    }

    // Auto-complete if past end date
    if (new Date() > active.endDate) {
      await prisma.season.update({
        where: { id: active.id },
        data: { status: "completed" },
      });
      active.status = "completed";
    }
  }

  // Get current PR data to compare with benchmarks if active season exists
  let enrichedActive = active;
  if (active && Array.isArray(active.benchmarkExercises)) {
    const benchmarks = active.benchmarkExercises as {
      exerciseId: string;
      name: string;
      baselineWeight: number;
      baselineReps: number;
      currentWeight?: number;
      currentReps?: number;
    }[];

    for (const bench of benchmarks) {
      const pr = await prisma.personalRecord.findFirst({
        where: { userId, exerciseId: bench.exerciseId, type: "1rm" },
        orderBy: { value: "desc" },
      });
      if (pr) {
        bench.currentWeight = pr.value;
        bench.currentReps = pr.reps || 1;
      }
    }
    enrichedActive = { ...active, benchmarkExercises: benchmarks };
  }

  return NextResponse.json({ active: enrichedActive, history });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, goalDescription, benchmarkExercises, action } = await req.json();

  // Abandon current season
  if (action === "abandon") {
    await prisma.season.updateMany({
      where: { userId, status: "active" },
      data: { status: "abandoned" },
    });
    return NextResponse.json({ ok: true });
  }

  // Check no active season
  const existing = await prisma.season.findFirst({
    where: { userId, status: "active" },
  });
  if (existing) {
    return NextResponse.json({ error: "You already have an active season" }, { status: 400 });
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 84); // 12 weeks

  // Get baseline PRs for benchmark exercises
  const benchmarksWithBaseline = await Promise.all(
    (benchmarkExercises || []).map(async (b: { exerciseId: string; name: string }) => {
      const pr = await prisma.personalRecord.findFirst({
        where: { userId, exerciseId: b.exerciseId, type: "1rm" },
        orderBy: { value: "desc" },
      });
      return {
        exerciseId: b.exerciseId,
        name: b.name,
        baselineWeight: pr?.value || 0,
        baselineReps: pr?.reps || 1,
        currentWeight: pr?.value || 0,
        currentReps: pr?.reps || 1,
      };
    })
  );

  const season = await prisma.season.create({
    data: {
      userId,
      name: name || "Season 1",
      goalDescription: goalDescription || "Get stronger and more consistent",
      startDate,
      endDate,
      benchmarkExercises: benchmarksWithBaseline,
      weekNumber: 1,
    },
  });

  return NextResponse.json(season);
}
