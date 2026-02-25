import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [target, profile] = await Promise.all([
    prisma.nutritionTarget.findUnique({ where: { userId } }),
    prisma.profile.findUnique({ where: { userId }, select: { weight: true, height: true, age: true, gender: true, trainingDays: true, goal: true } }),
  ]);

  // Calculate TDEE suggestion if profile exists
  let tdee = 0;
  if (profile?.weight && profile?.height && profile?.age) {
    const bmr = profile.gender === "female"
      ? 10 * (profile.weight * 0.453592) + 6.25 * (profile.height * 2.54) - 5 * profile.age - 161
      : 10 * (profile.weight * 0.453592) + 6.25 * (profile.height * 2.54) - 5 * profile.age + 5;
    const actFactor = (profile.trainingDays || 4) >= 5 ? 1.725 : (profile.trainingDays || 4) >= 3 ? 1.55 : 1.375;
    tdee = Math.round(bmr * actFactor);
  }

  return NextResponse.json({ target, tdee, profile });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { calories, protein, carbs, fat, phase } = await request.json();

  const target = await prisma.nutritionTarget.upsert({
    where: { userId },
    update: { calories, protein, carbs, fat, phase },
    create: { userId, calories, protein, carbs, fat, phase: phase || "maintain" },
  });

  return NextResponse.json({ target });
}
