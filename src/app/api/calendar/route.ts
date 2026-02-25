import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format, isToday, isPast, isFuture } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "week";
    const dateParam = searchParams.get("date") || new Date().toISOString();
    const currentDate = new Date(dateParam);

    let rangeStart: Date;
    let rangeEnd: Date;

    if (view === "month") {
      rangeStart = startOfMonth(currentDate);
      rangeEnd = endOfMonth(currentDate);
    } else {
      rangeStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      rangeEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    }

    const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Fetch ALL data for the range in parallel
    const [plan, workoutLogs, cardioActivities, nutritionLogs, checkIns] = await Promise.all([
      prisma.trainingPlan.findUnique({
        where: { userId },
        include: {
          workouts: {
            include: {
              exercises: { include: { exercise: { select: { name: true } } } },
            },
          },
        },
      }),
      prisma.workoutLog.findMany({
        where: {
          userId,
          startedAt: { gte: rangeStart, lte: rangeEnd },
        },
        include: {
          workout: { select: { name: true, dayOfWeek: true } },
          exerciseLogs: {
            include: {
              exercise: { select: { name: true } },
              sets: { select: { weight: true, reps: true } },
            },
          },
        },
        orderBy: { startedAt: "asc" },
      }),
      prisma.cardioActivity.findMany({
        where: {
          userId,
          OR: [
            { date: { gte: rangeStart, lte: rangeEnd } },
            { createdAt: { gte: rangeStart, lte: rangeEnd } },
          ],
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.nutritionLog.findMany({
        where: { userId, date: { gte: rangeStart, lte: rangeEnd } },
        select: { date: true, calories: true, protein: true },
      }),
      prisma.morningCheckIn.findMany({
        where: { userId, date: { gte: rangeStart, lte: rangeEnd } },
        select: { date: true, recoveryScore: true, sleepHours: true },
      }),
    ]);

    // Build nutrition per-day map
    const nutritionByDay: Record<string, { calories: number; protein: number }> = {};
    for (const n of nutritionLogs) {
      const dateKey = format(n.date, "yyyy-MM-dd");
      if (!nutritionByDay[dateKey]) nutritionByDay[dateKey] = { calories: 0, protein: 0 };
      nutritionByDay[dateKey].calories += n.calories || 0;
      nutritionByDay[dateKey].protein += n.protein || 0;
    }

    // Build check-in per-day map
    const checkInByDay: Record<string, { recoveryScore: number | null; sleepHours: number | null }> = {};
    for (const c of checkIns) {
      const dateKey = format(c.date, "yyyy-MM-dd");
      checkInByDay[dateKey] = { recoveryScore: c.recoveryScore, sleepHours: c.sleepHours };
    }

    // Build workout logs per-day map
    const workoutLogsByDay: Record<string, typeof workoutLogs> = {};
    for (const log of workoutLogs) {
      const dateKey = format(log.startedAt, "yyyy-MM-dd");
      if (!workoutLogsByDay[dateKey]) workoutLogsByDay[dateKey] = [];
      workoutLogsByDay[dateKey].push(log);
    }

    // Build cardio per-day map
    const cardioByDay: Record<string, typeof cardioActivities> = {};
    for (const c of cardioActivities) {
      const dateKey = c.date ? format(c.date, "yyyy-MM-dd") : format(c.createdAt, "yyyy-MM-dd");
      if (!cardioByDay[dateKey]) cardioByDay[dateKey] = [];
      cardioByDay[dateKey].push(c);
    }

    // Build calendar days
    const calendarDays = allDays.map(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayOfWeek = day.getDay();
      const dayName = dayNames[dayOfWeek];

      // Find planned workout for this day of week
      const plannedWorkout = plan?.workouts.find(w => w.dayOfWeek === dayOfWeek) || null;

      // Find planned cardio for this day of week (from cardio activities without a specific date)
      const plannedCardio = cardioActivities.find(c =>
        !c.completed && c.date && format(c.date, "yyyy-MM-dd") === dateStr
      ) || null;

      // Find actual logs for this date
      const dayWorkoutLogs = workoutLogsByDay[dateStr] || [];
      const dayCardioLogs = (cardioByDay[dateStr] || []).filter(c => c.completed);

      const completedWorkoutLog = dayWorkoutLogs.find(l => !!l.completedAt) || null;
      const completedCardioLog = dayCardioLogs[0] || null;

      // Compute volume for completed workout
      let totalVolume = 0;
      if (completedWorkoutLog) {
        totalVolume = completedWorkoutLog.exerciseLogs.reduce(
          (sum, el) => sum + el.sets.reduce((s, set) => s + set.weight * set.reps, 0),
          0
        );
      }

      // Determine status
      const hasPlannedActivity = !!plannedWorkout || !!plannedCardio;
      const hasCompletedActivity = !!completedWorkoutLog || !!completedCardioLog;
      const dayIsToday = isToday(day);
      const dayIsPast = isPast(day) && !dayIsToday;
      const dayIsFuture = isFuture(day) && !dayIsToday;

      let status: "completed" | "partial" | "missed" | "today" | "upcoming" | "rest";
      if (!hasPlannedActivity && !hasCompletedActivity) {
        status = "rest";
      } else if (dayIsToday) {
        status = hasCompletedActivity ? "completed" : "today";
      } else if (dayIsPast) {
        status = hasCompletedActivity ? "completed" : hasPlannedActivity ? "missed" : "rest";
      } else {
        status = hasPlannedActivity ? "upcoming" : "rest";
      }

      return {
        date: dateStr,
        dayName,
        dayShort: dayName.slice(0, 3),
        dayNumber: day.getDate(),
        month: format(day, "MMM"),
        isToday: dayIsToday,
        isPast: dayIsPast,
        isFuture: dayIsFuture,
        status,
        workout: plannedWorkout ? {
          id: plannedWorkout.id,
          name: plannedWorkout.name,
          focus: plannedWorkout.name,
          estimatedDuration: 60,
          exerciseCount: plannedWorkout.exercises.length,
          completed: !!completedWorkoutLog,
          type: "strength",
        } : null,
        cardio: plannedCardio ? {
          id: plannedCardio.id,
          title: plannedCardio.title || plannedCardio.type,
          type: plannedCardio.type,
          duration: plannedCardio.duration || 0,
          intensity: plannedCardio.intensity || "moderate",
          completed: plannedCardio.completed,
        } : null,
        workoutLog: completedWorkoutLog ? {
          id: completedWorkoutLog.id,
          name: completedWorkoutLog.workout?.name || "Workout",
          duration: completedWorkoutLog.duration,
          totalVolume: Math.round(totalVolume),
          exerciseCount: completedWorkoutLog.exerciseLogs.length,
        } : null,
        cardioLog: completedCardioLog ? {
          id: completedCardioLog.id,
          type: completedCardioLog.type,
          duration: completedCardioLog.duration,
          distance: completedCardioLog.distance,
        } : null,
        nutrition: nutritionByDay[dateStr] ? {
          calories: Math.round(nutritionByDay[dateStr].calories),
          protein: Math.round(nutritionByDay[dateStr].protein),
        } : null,
        checkIn: checkInByDay[dateStr] || null,
      };
    });

    // Summary stats
    const completedWorkouts = calendarDays.filter(d => d.workoutLog).length;
    const plannedWorkouts = calendarDays.filter(d => d.workout && d.status !== "rest").length;
    const missedWorkouts = calendarDays.filter(d => d.status === "missed").length;

    return NextResponse.json({
      days: calendarDays,
      view,
      currentDate: format(currentDate, "yyyy-MM-dd"),
      rangeStart: format(rangeStart, "yyyy-MM-dd"),
      rangeEnd: format(rangeEnd, "yyyy-MM-dd"),
      summary: {
        completedWorkouts,
        plannedWorkouts,
        missedWorkouts,
        completionRate: plannedWorkouts > 0 ? Math.round((completedWorkouts / plannedWorkouts) * 100) : 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Calendar error:", message);
    return NextResponse.json({ error: "Calendar unavailable" }, { status: 503 });
  }
}
