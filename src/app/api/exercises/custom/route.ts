import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, muscleGroups = [] } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

    // Check for existing exercise with same name (SQLite is case-sensitive so compare lowercased)
    const allWithName = await prisma.exercise.findMany({
      where: { name: name.trim() },
    });
    const existing = allWithName[0] ?? null;
    if (existing) {
      return NextResponse.json({
        id: existing.id,
        name: existing.name,
        category: existing.category,
        muscleGroups: JSON.parse(existing.muscleGroups || "[]"),
        equipment: JSON.parse(existing.equipment || "[]"),
      });
    }

    const exercise = await prisma.exercise.create({
      data: {
        name: name.trim(),
        category: "isolation",
        muscleGroups: JSON.stringify(muscleGroups),
        equipment: JSON.stringify([]),
        fatigueRating: 1.0,
        skillLevel: "beginner",
      },
    });

    return NextResponse.json({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      muscleGroups,
      equipment: [],
    });
  } catch (error: any) {
    console.error("POST /api/exercises/custom error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
