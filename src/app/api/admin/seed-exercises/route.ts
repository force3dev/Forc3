import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

async function fetchExercisesFromAPI(): Promise<any[]> {
  if (!process.env.RAPIDAPI_KEY) return [];

  const response = await fetch(
    "https://exercisedb.p.rapidapi.com/exercises?limit=1300&offset=0",
    {
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
      signal: AbortSignal.timeout(30000),
    }
  );
  return response.json();
}

function mapCategory(bodyPart: string): string {
  const map: Record<string, string> = {
    chest: "strength",
    back: "strength",
    shoulders: "strength",
    "upper arms": "strength",
    "lower arms": "strength",
    "upper legs": "strength",
    "lower legs": "strength",
    waist: "strength",
    cardio: "cardio",
  };
  return map[bodyPart] || "strength";
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    if (!process.env.RAPIDAPI_KEY) {
      return NextResponse.json({
        error: "RAPIDAPI_KEY not set. Get your free key at rapidapi.com",
        seeded: 0,
      });
    }

    const exercises = await fetchExercisesFromAPI();

    if (!Array.isArray(exercises)) {
      return NextResponse.json({ error: "Failed to fetch exercises from API", seeded: 0 });
    }

    let seeded = 0;
    let skipped = 0;

    for (const ex of exercises) {
      try {
        await prisma.exercise.upsert({
          where: { slug: ex.id },
          update: {
            gifUrl: ex.gifUrl,
          },
          create: {
            name: ex.name,
            slug: ex.id,
            category: mapCategory(ex.bodyPart),
            muscleGroups: JSON.stringify([ex.target].filter(Boolean)),
            secondaryMuscles: JSON.stringify(ex.secondaryMuscles || []),
            equipment: JSON.stringify([ex.equipment].filter(Boolean)),
            gifUrl: ex.gifUrl,
            formTips: JSON.stringify(ex.instructions || []),
            skillLevel: "intermediate",
            movementPattern: "compound",
            externalId: ex.id,
            source: "exercisedb",
            coachingCues: "[]",
            commonMistakes: "[]",
            alternatives: "[]",
            avoidIfInjury: "[]",
          },
        });
        seeded++;
      } catch {
        skipped++;
      }
    }

    return NextResponse.json({ seeded, skipped, total: exercises.length });
  } catch (error: any) {
    console.error("Seed exercises error:", error?.message);
    return NextResponse.json(
      { error: "Failed to seed exercises", message: error?.message },
      { status: 500 }
    );
  }
}
