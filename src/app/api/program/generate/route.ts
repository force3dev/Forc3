import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateAIProgram, AIProgramInput, AIGeneratedExercise } from "@/lib/ai/claude";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseReps(reps: string): { min: number; max: number } {
  if (!reps) return { min: 8, max: 12 };
  const range = reps.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (range) return { min: parseInt(range[1]), max: parseInt(range[2]) };
  const single = reps.match(/^(\d+)$/);
  if (single) return { min: parseInt(single[1]), max: parseInt(single[1]) };
  if (/amrap/i.test(reps)) return { min: 1, max: 99 };
  return { min: 8, max: 12 };
}

function inferSplit(programName: string, programDescription: string): string {
  const text = `${programName} ${programDescription}`.toLowerCase();
  if (/push.pull.leg|ppl/i.test(text)) return "ppl";
  if (/upper.lower/i.test(text)) return "upper_lower";
  if (/full.body/i.test(text)) return "full_body";
  if (/powerlifting|squat.bench.dead/i.test(text)) return "strength";
  return "custom";
}

function inferType(goal: string): string {
  const map: Record<string, string> = {
    muscle_gain: "hypertrophy",
    strength: "strength",
    fat_loss: "fat_loss",
    endurance: "endurance",
    triathlon: "sport_specific",
    general: "general",
    sport_performance: "sport_specific",
    longevity: "general",
    compete: "sport_specific",
    hybrid: "hypertrophy",
    custom: "general",
  };
  return map[goal] || "general";
}

async function saveGeneratedProgram(
  userId: string,
  aiProgram: Awaited<ReturnType<typeof generateAIProgram>>,
  goal: string,
  trainingDays: number
) {
  // Delete old plan
  const oldPlan = await prisma.trainingPlan.findUnique({ where: { userId } });
  if (oldPlan) {
    await prisma.trainingPlan.delete({ where: { userId } });
  }

  const split = inferSplit(aiProgram.programName, aiProgram.programDescription);
  const type = inferType(goal);

  // Build workout days (skip rest days)
  const workoutDays = aiProgram.weeklyStructure.filter(
    d => d.type !== "rest" && d.workout && d.workout.exercises.length > 0
  );

  await prisma.trainingPlan.create({
    data: {
      userId,
      name: aiProgram.programName,
      type,
      split,
      daysPerWeek: trainingDays,
      currentWeek: 1,
      mesocycleLength: 4,
      deloadFrequency: 4,
      workouts: {
        create: workoutDays.map((day, idx) => ({
          name: day.workout!.name,
          order: idx + 1,
          exercises: {
            create: day.workout!.exercises.map((ex: AIGeneratedExercise, exIdx: number) => {
              const { min, max } = parseReps(ex.reps);
              return {
                order: exIdx + 1,
                sets: ex.sets,
                repsMin: min,
                repsMax: max,
                restSeconds: ex.rest || 90,
                exercise: {
                  connectOrCreate: {
                    where: { name: ex.name },
                    create: {
                      name: ex.name,
                      category: "compound",
                      muscleGroups: JSON.stringify(ex.muscleGroups || []),
                      secondaryMuscles: JSON.stringify([]),
                      equipment: JSON.stringify(ex.equipment ? [ex.equipment] : []),
                      fatigueRating: 1.5,
                      skillLevel: "intermediate",
                      avoidIfInjury: JSON.stringify([]),
                      formTips: JSON.stringify(ex.notes ? [ex.notes] : []),
                    },
                  },
                },
              };
            }),
          },
        })),
      },
    },
  });

  return { name: aiProgram.programName, split, daysPerWeek: trainingDays };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get user profile to build input
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found. Complete onboarding first." }, { status: 400 });
    }

    // Allow overrides from request body
    const body = await req.json().catch(() => ({}));

    const equipmentRaw = profile.equipment || "[]";
    let equipment: string[] = [];
    try {
      const parsed = JSON.parse(equipmentRaw);
      equipment = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      equipment = equipmentRaw ? [equipmentRaw] : [];
    }

    const limitationsRaw = profile.limitations || profile.injuries || "[]";
    let limitations: string[] = [];
    try {
      limitations = JSON.parse(limitationsRaw);
    } catch {
      limitations = [];
    }

    const raceGoals = Array.isArray(profile.raceGoals) ? profile.raceGoals as { type: string; date?: string }[] : [];
    const nextRace = raceGoals[0];

    const input: AIProgramInput = {
      name: profile.name || undefined,
      primaryGoal: body.goal || profile.goal || "general",
      customGoal: body.customGoal || profile.customGoal || undefined,
      sport: body.sport || profile.sport || undefined,
      experienceLevel: body.experienceLevel || profile.experienceLevel || "beginner",
      trainingDaysPerWeek: body.trainingDays || profile.trainingDays || 4,
      sessionLength: body.sessionLength || profile.sessionLength || 60,
      equipment,
      limitations,
      age: profile.age || undefined,
      weight: profile.weight || undefined,
      height: profile.height || undefined,
      raceGoal: nextRace?.type,
      raceDate: nextRace?.date,
      goalDescription: body.goalDescription || profile.goalDescription || undefined,
    };

    const aiProgram = await generateAIProgram(input);
    const planSpec = await saveGeneratedProgram(userId, aiProgram, input.primaryGoal, input.trainingDaysPerWeek);

    return NextResponse.json({
      success: true,
      plan: planSpec,
      coachMessage: aiProgram.coachMessage,
      keyFocusAreas: aiProgram.keyFocusAreas,
      progressionRules: aiProgram.progressionRules,
    });
  } catch (err) {
    console.error("Program generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate program" },
      { status: 500 }
    );
  }
}
