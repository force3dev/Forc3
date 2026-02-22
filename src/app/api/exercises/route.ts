import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const muscle = searchParams.get("muscle") || "";

  const exercises = await prisma.exercise.findMany({
    orderBy: { name: "asc" },
  });

  const lowerQ = q.toLowerCase();
  const filtered = exercises.filter(ex => {
    const nameMatch = !q || ex.name.toLowerCase().includes(lowerQ);
    const muscles: string[] = JSON.parse(ex.muscleGroups || "[]");
    const muscleMatch = !muscle || muscle === "all" || muscles.some(m => m.toLowerCase().includes(muscle.toLowerCase()));
    return nameMatch && muscleMatch;
  });

  return NextResponse.json({
    exercises: filtered.slice(0, 50).map(ex => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      muscleGroups: JSON.parse(ex.muscleGroups || "[]"),
      equipment: JSON.parse(ex.equipment || "[]"),
    })),
  });
}
