import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getProgressionSuggestions } from "@/lib/ai/progressionEngine";
import { generateWorkoutNotes } from "@/lib/ai/claude";

export const dynamic = "force-dynamic";

// Day of week order (0=Sun, 1=Mon, ..., 6=Sat)
// Map to workout order in plan (cycling through workouts)
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const plan = await prisma.trainingPlan.findUnique({
      where: { userId },
      include: {
        workouts: {
          orderBy: { order: "asc" },
          include: {
            exercises: {
              orderBy: { order: "asc" },
              include: { exercise: true },
            },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ needsOnboarding: true, error: "No plan found" }, { status: 404 });
    }

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun

    // Determine which workout to show today based on a cycle
    // We cycle through workouts based on the day of week and plan start date
    const daysSinceStart = Math.floor(
      (today.getTime() - plan.startedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Count training days this week (Mon-Sun)
    const mondayOfWeek = new Date(today);
    mondayOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    mondayOfWeek.setHours(0, 0, 0, 0);

    // Check if we already did a workout today
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todaysLogs = await prisma.workoutLog.findMany({
      where: {
        userId,
        startedAt: { gte: todayStart, lte: todayEnd },
      },
    });

    // Get how many workouts completed this week
    const weekLogs = await prisma.workoutLog.findMany({
      where: {
        userId,
        startedAt: { gte: mondayOfWeek },
        completedAt: { not: null },
      },
      orderBy: { startedAt: "asc" },
    });

    const workoutsThisWeek = weekLogs.length;
    const workoutIndex = workoutsThisWeek % plan.workouts.length;
    const todayWorkout = plan.workouts[workoutIndex];

    // Check if rest day: hit weekly goal, or already completed a workout today
    const isRestDay =
      workoutsThisWeek >= plan.daysPerWeek ||
      todaysLogs.some(l => l.completedAt !== null);

    if (isRestDay && !todaysLogs.some(l => l.completedAt === null)) {
      return NextResponse.json({
        isRestDay: true,
        currentWeek: plan.currentWeek,
        workoutsThisWeek,
        daysPerWeek: plan.daysPerWeek,
        message: workoutsThisWeek >= plan.daysPerWeek
          ? "Weekly goal hit! Rest and recover."
          : "Rest day. Your muscles grow when you rest.",
      });
    }

    // Get user profile for unit system
    const profile = await prisma.profile.findUnique({ where: { userId } });
    const unitSystem = profile?.unitSystem || "imperial";

    // Get progression suggestions for all exercises
    const exerciseInputs = todayWorkout.exercises.map(we => ({
      exerciseId: we.exerciseId,
      name: we.exercise.name,
      sets: we.sets,
      repsMin: we.repsMin,
      repsMax: we.repsMax,
      muscleGroups: JSON.parse(we.exercise.muscleGroups || "[]"),
    }));

    const progressionMap = await getProgressionSuggestions(
      userId,
      exerciseInputs,
      plan.currentWeek,
      plan.deloadFrequency,
      unitSystem
    );

    // Enhance exercises with previous performance data + progression
    const enhancedExercises = await Promise.all(
      todayWorkout.exercises.map(async (we) => {
        // Find last logged set for this exercise
        const lastLog = await prisma.exerciseLog.findFirst({
          where: {
            exerciseId: we.exerciseId,
            workoutLog: { userId },
          },
          orderBy: { createdAt: "desc" },
          include: {
            sets: { orderBy: { setNumber: "asc" } },
          },
        });

        const lastWeight = lastLog?.sets[0]?.weight || null;
        const lastSets = lastLog?.sets?.map(s => ({ reps: s.reps, weight: s.weight })) || [];

        const progression = progressionMap.get(we.exerciseId);

        return {
          id: we.id,
          exerciseId: we.exerciseId,
          name: we.exercise.name,
          sets: we.sets,
          repsMin: we.repsMin,
          repsMax: we.repsMax,
          rpe: we.rpe,
          restSeconds: we.restSeconds,
          muscleGroups: JSON.parse(we.exercise.muscleGroups || "[]"),
          gifUrl: we.exercise.gifUrl || null,
          secondaryMuscles: we.exercise.secondaryMuscles || "[]",
          formTips: we.exercise.formTips || "[]",
          commonMistakes: we.exercise.commonMistakes || "[]",
          coachingCues: we.exercise.coachingCues || "[]",
          alternatives: we.exercise.alternatives || "[]",
          instructions: we.exercise.instructions || null,
          category: we.exercise.category || "strength",
          lastWeight,
          lastSets,
          suggestedWeight: progression?.suggestedWeight || lastWeight || null,
          progressionBadge: progression?.badge || null,
          progressionReason: progression?.reason || null,
        };
      })
    );

    // Generate AI coaching notes (non-blocking — skip if no API key)
    let coachingNotes: string[] = [];
    if (process.env.CLAUDE_API_KEY) {
      try {
        coachingNotes = await generateWorkoutNotes(
          userId,
          todayWorkout.name,
          enhancedExercises.map(e => e.name)
        );
      } catch {
        // Non-critical — don't fail the whole request
      }
    }

    return NextResponse.json({
      isRestDay: false,
      currentWeek: plan.currentWeek,
      workoutsThisWeek,
      daysPerWeek: plan.daysPerWeek,
      workout: {
        id: todayWorkout.id,
        name: todayWorkout.name,
        order: todayWorkout.order,
        exercises: enhancedExercises,
        coachingNotes,
      },
      inProgressLog: todaysLogs.find(l => l.completedAt === null)?.id || null,
    });
  } catch (err) {
    console.error("Today workout error:", err);
    return NextResponse.json({ error: "Failed to load workout" }, { status: 500 });
  }
}
