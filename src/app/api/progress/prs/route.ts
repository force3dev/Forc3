import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const exerciseId = searchParams.get("exerciseId");

    const prs = await prisma.personalRecord.findMany({
      where: {
        userId,
        ...(exerciseId ? { exerciseId } : {}),
      },
      include: { exercise: { select: { name: true } } },
      orderBy: { achievedAt: "desc" },
      take: 50,
    });

    // Group by exercise
    const byExercise: Record<string, typeof prs> = {};
    for (const pr of prs) {
      const name = pr.exercise.name;
      if (!byExercise[name]) byExercise[name] = [];
      byExercise[name].push(pr);
    }

    return NextResponse.json({ prs, byExercise });
  } catch (error: any) {
    console.error("GET /api/progress/prs error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
