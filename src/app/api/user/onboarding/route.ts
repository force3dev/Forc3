import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getSession, createSession, sessionCookieOptions } from "@/lib/auth";
import { generatePlan } from "@/lib/ai/planEngine";
import { calculateBMR, calculateTDEE, calculateMacros } from "@/lib/calculations/nutrition";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const {
      name,
      age,
      gender,
      weight,      // in kg
      height,      // in cm
      goal,
      experienceLevel,
      trainingDays,
      equipment,
      injuries,    // string[]
      sport,
      unitSystem,
    } = await req.json();

    // Calculate nutrition
    const bmr = calculateBMR(weight, height, age, gender || "male");
    const tdee = calculateTDEE(bmr, trainingDays);
    const macros = calculateMacros(tdee, goal, weight);

    // Generate training plan
    const planSpec = generatePlan({
      goal,
      experienceLevel,
      trainingDays,
      equipment,
      injuries: injuries || [],
      sport,
      gender,
    });

    // Save everything in a transaction
    await prisma.$transaction(async (tx) => {
      // Update profile
      await tx.profile.upsert({
        where: { userId },
        update: {
          name,
          age,
          gender,
          weight,
          height,
          goal,
          experienceLevel,
          trainingDays,
          equipment,
          injuries: JSON.stringify(injuries || []),
          sport,
          unitSystem,
          bmr,
          tdee,
          targetCalories: macros.calories,
          targetProtein: macros.protein,
          targetCarbs: macros.carbs,
          targetFat: macros.fat,
          onboardingDone: true,
        },
        create: {
          userId,
          name,
          age,
          gender,
          weight,
          height,
          goal,
          experienceLevel,
          trainingDays,
          equipment,
          injuries: JSON.stringify(injuries || []),
          sport,
          unitSystem,
          bmr,
          tdee,
          targetCalories: macros.calories,
          targetProtein: macros.protein,
          targetCarbs: macros.carbs,
          targetFat: macros.fat,
          onboardingDone: true,
        },
      });

      // Delete old plan if exists
      const oldPlan = await tx.trainingPlan.findUnique({ where: { userId } });
      if (oldPlan) {
        await tx.trainingPlan.delete({ where: { userId } });
      }

      // Create new training plan with workouts
      await tx.trainingPlan.create({
        data: {
          userId,
          name: planSpec.name,
          type: planSpec.type,
          split: planSpec.split,
          daysPerWeek: planSpec.daysPerWeek,
          currentWeek: 1,
          mesocycleLength: 4,
          deloadFrequency: 4,
          workouts: {
            create: planSpec.workouts.map(w => ({
              name: w.name,
              order: w.order,
              exercises: {
                create: w.exercises.map((ex, exIdx) => {
                  // Upsert exercise
                  return {
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
                          category: ex.sets <= 5 && ex.repsMin <= 5 ? "compound" : "compound",
                          muscleGroups: JSON.stringify(ex.muscleGroups),
                          secondaryMuscles: JSON.stringify([]),
                          equipment: JSON.stringify(ex.equipment || []),
                          fatigueRating: 1.5,
                          skillLevel: "intermediate",
                          avoidIfInjury: JSON.stringify([]),
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
    });

    // Update the JWT cookie with onboardingDone = true
    const currentSession = await getSession();
    if (currentSession) {
      const newToken = await createSession({
        userId: currentSession.userId,
        email: currentSession.email,
        onboardingDone: true,
      });
      const res = NextResponse.json({
        success: true,
        plan: {
          name: planSpec.name,
          split: planSpec.split,
          daysPerWeek: planSpec.daysPerWeek,
        },
        macros,
      });
      res.cookies.set(sessionCookieOptions(newToken));
      return res;
    }

    return NextResponse.json({
      success: true,
      plan: {
        name: planSpec.name,
        split: planSpec.split,
        daysPerWeek: planSpec.daysPerWeek,
      },
      macros,
    });
  } catch (err) {
    console.error("Onboarding error:", err);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
