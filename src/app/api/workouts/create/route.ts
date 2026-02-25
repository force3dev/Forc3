import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/workouts/create — create a brand-new workout inside the user's plan
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, exercises } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  try {
    const plan = await prisma.trainingPlan.findUnique({ where: { userId } });
    if (!plan) return NextResponse.json({ error: "No training plan found" }, { status: 404 });

    // Get highest current order
    const lastWorkout = await prisma.workout.findFirst({
      where: { planId: plan.id },
      orderBy: { order: "desc" },
    });
    const order = (lastWorkout?.order ?? -1) + 1;

    const workout = await prisma.workout.create({
      data: {
        planId: plan.id,
        name: name.trim(),
        order,
      },
    });

    if (exercises && exercises.length > 0) {
      await prisma.workoutExercise.createMany({
        data: exercises.map((ex: {
          exerciseId: string;
          order: number;
          sets: number;
          repsMin: number;
          repsMax: number;
          restSeconds?: number;
        }, idx: number) => ({
          workoutId: workout.id,
          exerciseId: ex.exerciseId,
          order: ex.order ?? idx,
          sets: ex.sets ?? 3,
          repsMin: ex.repsMin ?? 8,
          repsMax: ex.repsMax ?? 12,
          restSeconds: ex.restSeconds ?? 120,
        })),
      });
    }

    return NextResponse.json({ id: workout.id, name: workout.name });
  } catch (error: any) {
    console.error("POST /api/workouts/create error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
