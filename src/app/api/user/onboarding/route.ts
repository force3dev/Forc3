import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getSession, createSession, sessionCookieOptions } from "@/lib/auth";
import { generatePlan } from "@/lib/ai/planEngine";
import { generateAIProgram, AIProgramInput } from "@/lib/ai/claude";
import { calculateBMR, calculateTDEE, calculateMacros } from "@/lib/calculations/nutrition";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseReps(reps: string): { min: number; max: number } {
  const range = reps?.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (range) return { min: parseInt(range[1]), max: parseInt(range[2]) };
  const single = reps?.match(/^(\d+)$/);
  if (single) return { min: parseInt(single[1]), max: parseInt(single[1]) };
  if (/amrap/i.test(reps || "")) return { min: 1, max: 99 };
  return { min: 8, max: 12 };
}

function equipmentToLegacy(equipment: string[]): string {
  if (equipment.includes("full_gym")) return "full_gym";
  if (equipment.includes("barbell_home") || equipment.includes("home_gym")) return "home_gym";
  if (equipment.includes("dumbbells")) return "minimal";
  if (equipment.includes("bodyweight")) return "bodyweight";
  return "full_gym";
}

function inferSplit(programName: string, description: string): string {
  const text = `${programName} ${description}`.toLowerCase();
  if (/push.pull.leg|ppl/i.test(text)) return "ppl";
  if (/upper.lower/i.test(text)) return "upper_lower";
  if (/full.body/i.test(text)) return "full_body";
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

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      name,
      age,
      gender,
      weight,       // in kg
      height,       // in cm
      goal,
      customGoal,
      goalDescription,
      experienceLevel,
      trainingDays,
      sessionLength,
      equipment,    // string[] (new multi-select)
      limitations,  // string[] (renamed from injuries)
      sport,
      unitSystem,
      nutritionGoal,
      raceGoals,    // array of {type, date, priority}
      trainingVolume,
    } = body;

    // Support legacy single-string equipment from old clients
    const equipmentArray: string[] = Array.isArray(equipment)
      ? equipment
      : equipment
      ? [equipment]
      : [];

    const limitationsArray: string[] = Array.isArray(limitations)
      ? limitations
      : limitations
      ? [limitations]
      : [];

    // Calculate nutrition
    const bmr = calculateBMR(weight, height, age, gender || "male");
    const tdee = calculateTDEE(bmr, trainingDays);
    const macros = calculateMacros(tdee, nutritionGoal || goal, weight);

    // Save profile first
    await prisma.profile.upsert({
      where: { userId },
      update: {
        name,
        age,
        gender,
        weight,
        height,
        goal,
        customGoal: customGoal || null,
        goalDescription: goalDescription || null,
        experienceLevel,
        trainingDays,
        sessionLength: sessionLength || null,
        equipment: JSON.stringify(equipmentArray),
        injuries: JSON.stringify(limitationsArray),
        limitations: JSON.stringify(limitationsArray),
        sport,
        unitSystem,
        nutritionGoal: nutritionGoal || null,
        bmr,
        tdee,
        targetCalories: macros.calories,
        targetProtein: macros.protein,
        targetCarbs: macros.carbs,
        targetFat: macros.fat,
        onboardingDone: true,
        raceGoals: raceGoals?.length ? raceGoals : undefined,
        trainingVolume: trainingVolume || null,
      },
      create: {
        userId,
        name,
        age,
        gender,
        weight,
        height,
        goal,
        customGoal: customGoal || null,
        goalDescription: goalDescription || null,
        experienceLevel,
        trainingDays,
        sessionLength: sessionLength || null,
        equipment: JSON.stringify(equipmentArray),
        injuries: JSON.stringify(limitationsArray),
        limitations: JSON.stringify(limitationsArray),
        sport,
        unitSystem,
        nutritionGoal: nutritionGoal || null,
        bmr,
        tdee,
        targetCalories: macros.calories,
        targetProtein: macros.protein,
        targetCarbs: macros.carbs,
        targetFat: macros.fat,
        onboardingDone: true,
        raceGoals: raceGoals?.length ? raceGoals : undefined,
        trainingVolume: trainingVolume || null,
      },
    });

    // Delete old plan if exists
    const oldPlan = await prisma.trainingPlan.findUnique({ where: { userId } });
    if (oldPlan) {
      await prisma.trainingPlan.delete({ where: { userId } });
    }

    // Try AI program generation first
    let planName: string;
    let planSplit: string;
    let planType: string;

    try {
      const nextRace = Array.isArray(raceGoals) && raceGoals.length > 0 ? raceGoals[0] : null;

      const aiInput: AIProgramInput = {
        name,
        primaryGoal: goal,
        customGoal: customGoal || undefined,
        sport: sport || undefined,
        experienceLevel,
        trainingDaysPerWeek: trainingDays,
        sessionLength: sessionLength || 60,
        equipment: equipmentArray,
        limitations: limitationsArray,
        age,
        weight,
        height,
        raceGoal: nextRace?.type,
        raceDate: nextRace?.date,
        goalDescription: goalDescription || undefined,
      };

      const aiProgram = await generateAIProgram(aiInput);

      planSplit = inferSplit(aiProgram.programName, aiProgram.programDescription);
      planType = inferType(goal);
      planName = aiProgram.programName;

      // Build workouts from AI output
      const workoutDays = aiProgram.weeklyStructure.filter(
        d => d.type !== "rest" && d.workout && d.workout.exercises.length > 0
      );

      await prisma.trainingPlan.create({
        data: {
          userId,
          name: planName,
          type: planType,
          split: planSplit,
          daysPerWeek: trainingDays,
          currentWeek: 1,
          mesocycleLength: 4,
          deloadFrequency: 4,
          workouts: {
            create: workoutDays.map((day, idx) => ({
              name: day.workout!.name,
              order: idx + 1,
              exercises: {
                create: day.workout!.exercises.map((ex, exIdx) => {
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
    } catch (aiErr) {
      // Fall back to template generator
      console.warn("AI program generation failed, using template:", aiErr);

      const legacyEquipment = equipmentToLegacy(equipmentArray);
      const legacyExperience = experienceLevel === "complete_beginner" ? "beginner"
        : experienceLevel === "athlete" ? "advanced"
        : experienceLevel;

      const planSpec = generatePlan({
        goal: ["triathlon", "sport_performance", "longevity", "compete", "hybrid", "custom"].includes(goal)
          ? "general"
          : goal,
        experienceLevel: legacyExperience,
        trainingDays,
        equipment: legacyEquipment,
        injuries: limitationsArray,
        sport,
        gender,
      });

      planName = planSpec.name;
      planSplit = planSpec.split;
      planType = planSpec.type;

      await prisma.trainingPlan.create({
        data: {
          userId,
          name: planName,
          type: planType,
          split: planSplit,
          daysPerWeek: planSpec.daysPerWeek,
          currentWeek: 1,
          mesocycleLength: 4,
          deloadFrequency: 4,
          workouts: {
            create: planSpec.workouts.map(w => ({
              name: w.name,
              order: w.order,
              exercises: {
                create: w.exercises.map((ex, exIdx) => ({
                  order: exIdx + 1,
                  sets: ex.sets,
                  repsMin: ex.repsMin,
                  repsMax: ex.repsMax,
                  rpe: ex.rpe,
                  restSeconds: ex.restSeconds,
                  exercise: {
                    connectOrCreate: {
                      where: { name: ex.name },
                      create: {
                        name: ex.name,
                        category: "compound",
                        muscleGroups: JSON.stringify(ex.muscleGroups),
                        secondaryMuscles: JSON.stringify([]),
                        equipment: JSON.stringify(ex.equipment || []),
                        fatigueRating: 1.5,
                        skillLevel: "intermediate",
                        avoidIfInjury: JSON.stringify([]),
                        formTips: JSON.stringify([]),
                      },
                    },
                  },
                })),
              },
            })),
          },
        },
      });
    }

    // Update JWT cookie with onboardingDone = true
    const currentSession = await getSession();
    const res = NextResponse.json({
      success: true,
      plan: {
        name: planName!,
        split: planSplit!,
        daysPerWeek: trainingDays,
      },
      macros,
    });

    if (currentSession) {
      const newToken = await createSession({
        userId: currentSession.userId,
        email: currentSession.email,
        onboardingDone: true,
      });
      res.cookies.set(sessionCookieOptions(newToken));
    }

    return res;
  } catch (err) {
    console.error("Onboarding error:", err);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
