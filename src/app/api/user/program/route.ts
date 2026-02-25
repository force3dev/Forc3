import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [plan, cardioActivities] = await Promise.all([
      prisma.trainingPlan.findUnique({
        where: { userId },
        include: {
          workouts: {
            orderBy: { order: "asc" },
            include: {
              exercises: {
                orderBy: { order: "asc" },
                include: { exercise: { select: { name: true } } },
              },
            },
          },
        },
      }),
      prisma.cardioActivity.findMany({
        where: { userId, completed: false },
        select: { id: true, type: true, title: true, duration: true, intensity: true, date: true },
      }),
    ]);

    if (!plan) {
      return NextResponse.json({ plan: null, weekSchedule: [], workoutPlans: [], cardioActivities: [] });
    }

    const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    // Map JS getDay() (0=Sun,1=Mon...6=Sat) to day name
    const jsDayToName: Record<number, string> = {
      0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
      4: "Thursday", 5: "Friday", 6: "Saturday",
    };

    // Build lookup of workouts by day name
    const workoutsByDay: Record<string, typeof plan.workouts[number]> = {};
    for (const w of plan.workouts) {
      if (w.dayOfWeek !== null && w.dayOfWeek !== undefined) {
        const dayName = jsDayToName[w.dayOfWeek];
        if (dayName) workoutsByDay[dayName] = w;
      }
    }

    // Build full week view
    const weekSchedule = DAY_ORDER.map(day => ({
      dayName: day,
      workout: workoutsByDay[day] ? {
        id: workoutsByDay[day].id,
        name: workoutsByDay[day].name,
        focus: workoutsByDay[day].name,
        estimatedDuration: 60,
        exercises: workoutsByDay[day].exercises.map(e => ({
          name: e.exercise?.name || "Exercise",
          sets: e.sets,
          repsMin: e.repsMin,
          repsMax: e.repsMax,
        })),
      } : null,
      cardio: null as { id: string; type: string; title: string | null; duration: number | null; intensity: string | null } | null,
      isRestDay: !workoutsByDay[day],
    }));

    return NextResponse.json({
      plan: {
        id: plan.id,
        name: plan.name,
        type: plan.type,
        split: plan.split,
        daysPerWeek: plan.daysPerWeek,
        description: plan.name,
      },
      weekSchedule,
      cardioActivities,
    });
  } catch (err) {
    console.error("Program API error:", err);
    return NextResponse.json({ error: "Failed to load program" }, { status: 500 });
  }
}
