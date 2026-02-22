import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workoutId, title, description, isPublic = true } = await req.json();
  if (!workoutId) return NextResponse.json({ error: "workoutId required" }, { status: 400 });

  // Verify ownership
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, plan: { userId } },
  });
  if (!workout) return NextResponse.json({ error: "Workout not found" }, { status: 404 });

  const shared = await prisma.sharedWorkout.upsert({
    where: { workoutId } as never,
    update: { title, description, isPublic },
    create: { userId, workoutId, title, description, isPublic },
  });

  return NextResponse.json({ id: shared.id });
}
