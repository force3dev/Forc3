import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Epley formula: weight * (1 + reps/30)
function epley(weight: number, reps: number) {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const prs = await prisma.personalRecord.findMany({
    where: { userId, achievedAt: { gte: ninetyDaysAgo } },
    include: { exercise: { select: { name: true, id: true } } },
    orderBy: { achievedAt: "asc" },
  });

  // Group by exercise
  const byExercise: Record<string, {
    exerciseId: string;
    name: string;
    history: { date: string; e1rm: number; weight: number; reps: number }[];
    current1RM: number;
  }> = {};

  for (const pr of prs) {
    const name = pr.exercise.name;
    const reps = pr.reps || 1;
    const e1rm = Math.round(epley(pr.value, reps));

    if (!byExercise[name]) {
      byExercise[name] = { exerciseId: pr.exerciseId, name, history: [], current1RM: 0 };
    }
    byExercise[name].history.push({
      date: pr.achievedAt.toISOString().slice(0, 10),
      e1rm,
      weight: pr.value,
      reps,
    });
    byExercise[name].current1RM = Math.max(byExercise[name].current1RM, e1rm);
  }

  const exercises = Object.values(byExercise).sort((a, b) => b.current1RM - a.current1RM);

  return NextResponse.json({ exercises });
}
