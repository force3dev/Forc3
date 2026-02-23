import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateHybridWeek } from "@/lib/program-generator";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 404 });

  const raceGoals = Array.isArray(profile.raceGoals)
    ? (profile.raceGoals as { type: string; date?: string }[])
    : [];

  const plan = generateHybridWeek({
    goal: profile.goal || "general",
    experienceLevel: profile.experienceLevel || "intermediate",
    trainingDays: profile.trainingDays || 4,
    sport: profile.sport || undefined,
    raceGoals,
    trainingVolume: profile.trainingVolume || "intermediate",
  });

  return NextResponse.json(plan);
}
