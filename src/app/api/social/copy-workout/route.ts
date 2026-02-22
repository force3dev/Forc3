import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sharedWorkoutId } = await req.json();
  if (!sharedWorkoutId) return NextResponse.json({ error: "sharedWorkoutId required" }, { status: 400 });

  const sharedWorkout = await prisma.sharedWorkout.findUnique({
    where: { id: sharedWorkoutId },
    include: {
      workout: {
        include: { exercises: true },
      },
    },
  });

  if (!sharedWorkout || !sharedWorkout.isPublic) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  // Get user's training plan
  const plan = await prisma.trainingPlan.findUnique({ where: { userId } });
  if (!plan) return NextResponse.json({ error: "No training plan" }, { status: 400 });

  const lastWorkout = await prisma.workout.findFirst({
    where: { planId: plan.id },
    orderBy: { order: "desc" },
  });
  const nextOrder = (lastWorkout?.order ?? -1) + 1;

  // Create a copy
  const newWorkout = await prisma.workout.create({
    data: {
      planId: plan.id,
      name: `${sharedWorkout.workout.name} (copy)`,
      order: nextOrder,
      exercises: {
        create: sharedWorkout.workout.exercises.map(ex => ({
          exerciseId: ex.exerciseId,
          order: ex.order,
          sets: ex.sets,
          repsMin: ex.repsMin,
          repsMax: ex.repsMax,
          restSeconds: ex.restSeconds,
        })),
      },
    },
  });

  // Record the copy
  await prisma.workoutCopy.create({
    data: { userId, sharedWorkoutId },
  });

  // Notify original creator
  if (sharedWorkout.userId !== userId) {
    await prisma.notification.create({
      data: {
        userId: sharedWorkout.userId,
        type: "workout_copied",
        data: { copiedByUserId: userId, sharedWorkoutId },
      },
    });
  }

  return NextResponse.json({ success: true, workoutId: newWorkout.id });
}
