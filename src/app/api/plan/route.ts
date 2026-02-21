import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await prisma.trainingPlan.findUnique({
    where: { userId },
    include: {
      workouts: {
        orderBy: { order: "asc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: {
              exercise: { select: { name: true, muscleGroups: true } },
            },
          },
        },
      },
    },
  });

  if (!plan) return NextResponse.json({ plan: null });

  return NextResponse.json({ plan });
}
