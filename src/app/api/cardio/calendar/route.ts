import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CARDIO_TEMPLATES, CardioTemplate } from "@/lib/cardio-templates";

export const dynamic = "force-dynamic";

// Reuse the same suggestion logic as /api/cardio/today
function suggestCardioTemplate(
  goal: string | null,
  sport: string | null,
  raceGoals: unknown,
  dayOfWeek: number,
  workoutsThisWeek: number
): CardioTemplate | null {
  const hasRace = Array.isArray(raceGoals) && raceGoals.length > 0;
  const isTriathlete =
    hasRace &&
    Array.isArray(raceGoals) &&
    (raceGoals as { type: string }[]).some((r) =>
      ["sprint_tri", "olympic_tri", "half_ironman", "full_ironman"].includes(r.type)
    );
  const isRunner =
    sport === "running" ||
    (hasRace &&
      Array.isArray(raceGoals) &&
      (raceGoals as { type: string }[]).some((r) =>
        ["5k_10k", "half_marathon", "full_marathon"].includes(r.type)
      ));
  const isSwimmer =
    sport === "swimming" ||
    (hasRace &&
      Array.isArray(raceGoals) &&
      (raceGoals as { type: string }[]).some((r) => r.type === "swim_race"));

  if (dayOfWeek === 6) {
    if (isTriathlete || isRunner) return CARDIO_TEMPLATES.find((t) => t.id === "run-long") || null;
    if (isSwimmer) return CARDIO_TEMPLATES.find((t) => t.id === "swim-endurance") || null;
    return CARDIO_TEMPLATES.find((t) => t.id === "bike-endurance") || null;
  }
  if (dayOfWeek === 0) {
    return CARDIO_TEMPLATES.find((t) => t.id === "bike-recovery") || null;
  }

  if (isTriathlete) {
    const rotation: Record<number, string> = {
      1: "run-easy",
      2: "swim-drills",
      3: "run-tempo",
      4: "bike-endurance",
      5: "swim-pull",
    };
    const id = rotation[dayOfWeek];
    return id ? CARDIO_TEMPLATES.find((t) => t.id === id) || null : null;
  }

  if (isRunner) {
    const rotation: Record<number, string> = {
      1: "run-easy",
      2: "run-easy",
      3: "run-400-intervals",
      4: "run-easy",
      5: "run-tempo",
    };
    const id = rotation[dayOfWeek];
    return id ? CARDIO_TEMPLATES.find((t) => t.id === id) || null : null;
  }

  if (goal === "endurance") {
    const rotation: Record<number, string> = {
      1: "run-easy",
      2: "bike-endurance",
      3: "run-800-repeats",
      4: "row-steady-state",
      5: "run-tempo",
    };
    const id = rotation[dayOfWeek];
    return id ? CARDIO_TEMPLATES.find((t) => t.id === id) || null : null;
  }

  if (workoutsThisWeek >= 3) {
    return CARDIO_TEMPLATES.find((t) => t.id === "bike-recovery") || null;
  }

  const defaults = ["run-fartlek", "hiit-jump-rope-tabata", "row-steady-state"];
  return CARDIO_TEMPLATES.find((t) => t.id === defaults[dayOfWeek % defaults.length]) || null;
}

export interface CalendarDay {
  date: string; // ISO date string (YYYY-MM-DD)
  dayOfWeek: number; // 0=Sun ... 6=Sat
  isToday: boolean;
  isPast: boolean;
  activity: {
    id: string;
    type: string;
    title: string | null;
    intensity: string | null;
    duration: number;
    completed: boolean;
  } | null;
  suggestion: {
    templateId: string;
    type: string;
    title: string;
    intensity: string;
    duration: number;
  } | null;
}

// GET /api/cardio/calendar?offset=0
// offset: week offset from current week (0=this week, -1=last week, 1=next week)
export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  // Compute Monday of the target week
  const now = new Date();
  const todayMidnight = new Date(now);
  todayMidnight.setHours(0, 0, 0, 0);

  const monday = new Date(todayMidnight);
  const currentDay = monday.getDay(); // 0=Sun
  const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  monday.setDate(monday.getDate() + daysToMonday + offset * 7);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 7); // exclusive upper bound

  // Fetch all activities for the week
  const activities = await prisma.cardioActivity.findMany({
    where: {
      userId,
      createdAt: { gte: monday, lt: sunday },
    },
    orderBy: { createdAt: "asc" },
  });

  // Build a map from date string to activity
  const activityByDate = new Map<string, (typeof activities)[0]>();
  for (const act of activities) {
    const dateKey = (act.date ?? act.createdAt).toISOString().slice(0, 10);
    if (!activityByDate.has(dateKey)) activityByDate.set(dateKey, act);
  }

  // Fetch profile for suggestions
  const profile = await prisma.profile.findUnique({ where: { userId } });

  // Count this week's strength workouts (for suggestion logic)
  const weekLogs = await prisma.workoutLog.count({
    where: { userId, startedAt: { gte: monday, lt: sunday }, completedAt: { not: null } },
  });

  // Build 7-day calendar
  const days: CalendarDay[] = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);

    const dateKey = day.toISOString().slice(0, 10);
    const dayOfWeek = day.getDay();
    const isToday = dateKey === todayMidnight.toISOString().slice(0, 10);
    const isPast = day < todayMidnight;

    const act = activityByDate.get(dateKey) || null;

    let suggestion: CalendarDay["suggestion"] = null;
    if (!act && !isPast) {
      const template = suggestCardioTemplate(
        profile?.goal || null,
        profile?.sport || null,
        profile?.raceGoals || null,
        dayOfWeek,
        weekLogs
      );
      if (template) {
        suggestion = {
          templateId: template.id,
          type: template.type,
          title: template.title,
          intensity: template.intensity,
          duration: template.duration,
        };
      }
    }

    days.push({
      date: dateKey,
      dayOfWeek,
      isToday,
      isPast,
      activity: act
        ? {
            id: act.id,
            type: act.type,
            title: act.title,
            intensity: act.intensity,
            duration: act.duration,
            completed: act.completed,
          }
        : null,
      suggestion,
    });
  }

  return NextResponse.json({ days, weekOffset: offset });
}
