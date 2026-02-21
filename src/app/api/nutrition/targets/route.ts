import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId } });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    calories: profile.targetCalories || 2000,
    protein: profile.targetProtein || 150,
    carbs: profile.targetCarbs || 200,
    fat: profile.targetFat || 65,
    goal: profile.goal,
    unitSystem: profile.unitSystem,
  });
}
