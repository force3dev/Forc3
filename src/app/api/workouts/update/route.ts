import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PUT /api/workouts/update — update a workout's name + exercises
export async function PUT(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workoutId, name, exercises } = await req.json();
  if (!workoutId) return NextResponse.json({ error: "workoutId required" }, { status: 400 });

  // Verify ownership
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, plan: { userId } },
  });
  if (!workout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Update workout name if provided
  if (name !== undefined) {
    await prisma.workout.update({ where: { id: workoutId }, data: { name } });
  }

  // Replace all exercises
  if (exercises !== undefined) {
    await prisma.workoutExercise.deleteMany({ where: { workoutId } });

    if (exercises.length > 0) {
      await prisma.workoutExercise.createMany({
        data: exercises.map((ex: {
          exerciseId: string;
          order: number;
          sets: number;
          repsMin: number;
          repsMax: number;
          restSeconds?: number;
        }, idx: number) => ({
          workoutId,
          exerciseId: ex.exerciseId,
          order: ex.order ?? idx,
          sets: ex.sets ?? 3,
          repsMin: ex.repsMin ?? 8,
          repsMax: ex.repsMax ?? 12,
          restSeconds: ex.restSeconds ?? 120,
        })),
      });
    }
  }

  return NextResponse.json({ success: true });
}
