import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Returns full month calendar data — strength + cardio + rest
export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  // month=YYYY-MM, defaults to current month
  const monthParam = searchParams.get("month");
  const now = new Date();
  const year = monthParam ? parseInt(monthParam.split("-")[0]) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam.split("-")[1]) - 1 : now.getMonth();

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  // Fetch strength plan workouts
  const plan = await prisma.trainingPlan.findUnique({
    where: { userId },
    include: {
      workouts: {
        include: { exercises: { include: { exercise: { select: { name: true } } } } },
      },
    },
  });

  // Fetch completed workout logs this month
  const workoutLogs = await prisma.workoutLog.findMany({
    where: { userId, startedAt: { gte: startOfMonth, lte: endOfMonth } },
    include: {
      workout: {
        select: {
          id: true,
          name: true,
          order: true,
          exercises: { select: { id: true } },
        },
      },
    },
    orderBy: { startedAt: "asc" },
  });

  // Fetch cardio logs this month — use date field if set, else createdAt
  const cardioLogs = await prisma.cardioActivity.findMany({
    where: {
      userId,
      OR: [
        { date: { gte: startOfMonth, lte: endOfMonth } },
        { date: null, createdAt: { gte: startOfMonth, lte: endOfMonth } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  // Build a day-by-day map
  const daysInMonth = endOfMonth.getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Map workout logs by date string
  const strengthByDate: Record<string, typeof workoutLogs[0][]> = {};
  for (const log of workoutLogs) {
    const d = log.startedAt.toISOString().slice(0, 10);
    if (!strengthByDate[d]) strengthByDate[d] = [];
    strengthByDate[d].push(log);
  }

  // Map cardio logs by date string — prefer date field over createdAt
  const cardioByDate: Record<string, typeof cardioLogs[0][]> = {};
  for (const log of cardioLogs) {
    const d = (log.date || log.createdAt).toISOString().slice(0, 10);
    if (!cardioByDate[d]) cardioByDate[d] = [];
    cardioByDate[d].push(log);
  }

  // Determine which days have scheduled strength workouts
  // If plan exists, the daysPerWeek tells us how many training days per week.
  // We map workout order to days of week (Monday=0 through Sunday=6).
  const scheduledWorkoutDays = plan
    ? plan.workouts.map((w, i) => ({ dayIndex: i % 7, workout: w }))
    : [];

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().slice(0, 10);
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon...
    const isToday = date.getTime() === today.getTime();
    const isPast = date < today;

    // Get actual logs for this day
    const dayStrength = strengthByDate[dateStr] || [];
    const dayCardio = cardioByDate[dateStr] || [];

    // Find scheduled strength workout for this day of week
    const scheduled = scheduledWorkoutDays.find(sw => {
      // Map plan day index: workout 0 = Monday, 1 = Tuesday, etc.
      const mappedDay = (sw.dayIndex + 1) % 7; // 0=Sun, 1=Mon...
      return mappedDay === dayOfWeek;
    });

    const hasStrengthCompleted = dayStrength.some(l => l.completedAt);
    const hasCardioCompleted = dayCardio.some(l => l.completed);
    const hasAnyCompleted = hasStrengthCompleted || hasCardioCompleted;

    // Determine type
    let type: "strength" | "cardio" | "hybrid" | "rest" | "active_recovery";
    if (dayStrength.length > 0 && dayCardio.length > 0) type = "hybrid";
    else if (dayStrength.length > 0) type = "strength";
    else if (dayCardio.length > 0) type = "cardio";
    else if (scheduled) type = "strength"; // planned but not done yet
    else if (dayOfWeek === 0) type = "active_recovery"; // Sunday default
    else type = "rest";

    // Strength info
    let strengthData = null;
    if (dayStrength.length > 0) {
      const log = dayStrength[0];
      strengthData = {
        name: log.workout?.name || "Strength",
        focus: log.workout?.name || "Strength",
        exerciseCount: log.workout?.exercises?.length || 0,
        estimatedDuration: log.duration || 45,
        completed: !!log.completedAt,
        logId: log.id,
        workoutId: log.workoutId,
      };
    } else if (scheduled) {
      const w = scheduled.workout;
      strengthData = {
        name: w.name,
        focus: w.name,
        exerciseCount: w.exercises.length,
        estimatedDuration: Math.round(w.exercises.length * 8 + 10),
        completed: false,
        workoutId: w.id,
      };
    }

    // Cardio info
    let cardioData = null;
    if (dayCardio.length > 0) {
      const log = dayCardio[0];
      const durationRaw = log.duration || 0;
      const durationMinutes = durationRaw > 240 ? Math.round(durationRaw / 60) : durationRaw;
      cardioData = {
        title: log.title || log.type,
        type: log.type,
        duration: durationMinutes,
        intensity: log.intensity || "moderate",
        completed: log.completed,
        logId: log.id,
      };
    }

    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    days.push({
      date: dateStr,
      dayNumber: d,
      dayOfWeek: DAY_NAMES[dayOfWeek],
      type,
      strength: strengthData,
      cardio: cardioData,
      completed: hasAnyCompleted,
      isToday,
      isPast,
    });
  }

  return NextResponse.json({ days, month: `${year}-${String(month + 1).padStart(2, "0")}` });
}
