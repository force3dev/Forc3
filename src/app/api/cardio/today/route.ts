import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CARDIO_TEMPLATES, CardioTemplate } from "@/lib/cardio-templates";

export const dynamic = "force-dynamic";

// ─── Hybrid Programming Logic ─────────────────────────────────────────────────
// Returns a suggested cardio template based on user profile and day of week.

function suggestCardioTemplate(
  goal: string | null,
  sport: string | null,
  raceGoals: unknown,
  dayOfWeek: number, // 0=Sun, 1=Mon ... 6=Sat
  workoutsThisWeek: number
): CardioTemplate | null {
  const hasRace = Array.isArray(raceGoals) && raceGoals.length > 0;
  const isTriathlete = hasRace && (
    Array.isArray(raceGoals) &&
    (raceGoals as {type: string}[]).some(r =>
      ["sprint_tri", "olympic_tri", "half_ironman", "full_ironman"].includes(r.type)
    )
  );
  const isRunner = sport === "running" || (
    hasRace && Array.isArray(raceGoals) &&
    (raceGoals as {type: string}[]).some(r =>
      ["5k_10k", "half_marathon", "full_marathon"].includes(r.type)
    )
  );
  const isSwimmer = sport === "swimming" || (
    hasRace && Array.isArray(raceGoals) &&
    (raceGoals as {type: string}[]).some(r => r.type === "swim_race")
  );

  // Weekend: long aerobic session
  if (dayOfWeek === 6) { // Saturday
    if (isTriathlete || isRunner) return CARDIO_TEMPLATES.find(t => t.id === "run-long") || null;
    if (isSwimmer) return CARDIO_TEMPLATES.find(t => t.id === "swim-endurance") || null;
    return CARDIO_TEMPLATES.find(t => t.id === "bike-endurance") || null;
  }
  if (dayOfWeek === 0) { // Sunday — active recovery or rest
    return CARDIO_TEMPLATES.find(t => t.id === "bike-recovery") || null;
  }

  // Weekday rotation based on day
  if (isTriathlete) {
    const rotation: Record<number, string> = {
      1: "run-easy",        // Mon: easy run
      2: "swim-drills",     // Tue: swim
      3: "run-tempo",       // Wed: tempo
      4: "bike-endurance",  // Thu: bike
      5: "swim-pull",       // Fri: swim strength
    };
    const id = rotation[dayOfWeek];
    return id ? CARDIO_TEMPLATES.find(t => t.id === id) || null : null;
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
    return id ? CARDIO_TEMPLATES.find(t => t.id === id) || null : null;
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
    return id ? CARDIO_TEMPLATES.find(t => t.id === id) || null : null;
  }

  // General / strength focused — lighter cardio
  if (workoutsThisWeek >= 3) {
    // After several lifting days, suggest recovery cardio
    return CARDIO_TEMPLATES.find(t => t.id === "bike-recovery") || null;
  }

  // Default: easy fartlek or HIIT
  const defaults = ["run-fartlek", "hiit-jump-rope-tabata", "row-steady-state"];
  return CARDIO_TEMPLATES.find(t => t.id === defaults[dayOfWeek % defaults.length]) || null;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check for existing planned cardio today
    const existingActivity = await prisma.cardioActivity.findFirst({
      where: {
        userId,
        date: { gte: today, lt: tomorrow },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingActivity) {
      return NextResponse.json({ activity: existingActivity, isPlanned: true });
    }

    // No planned activity — suggest one based on profile
    const profile = await prisma.profile.findUnique({ where: { userId } });

    // Count this week's workouts
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const weekLogs = await prisma.workoutLog.count({
      where: { userId, startedAt: { gte: monday }, completedAt: { not: null } },
    });

    const dayOfWeek = new Date().getDay();
    const template = suggestCardioTemplate(
      profile?.goal || null,
      profile?.sport || null,
      profile?.raceGoals || null,
      dayOfWeek,
      weekLogs
    );

    if (!template) {
      return NextResponse.json({ activity: null });
    }

    return NextResponse.json({
      activity: null,
      suggestion: {
        templateId: template.id,
        type: template.type,
        title: template.title,
        description: template.description,
        duration: template.duration,
        intensity: template.intensity,
        intervals: template.intervals || null,
      },
    });
  } catch (err) {
    console.error("cardio/today GET error:", err);
    return NextResponse.json({ activity: null });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, templateId, activityId, duration } = await req.json();

  if (action === "start") {
    // Create a CardioActivity from a template
    const template = CARDIO_TEMPLATES.find(t => t.id === templateId);
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    const today = new Date();
    const activity = await prisma.cardioActivity.create({
      data: {
        userId,
        type: template.type,
        title: template.title,
        description: template.description,
        intensity: template.intensity,
        duration: template.duration, // minutes
        intervals: template.intervals ? JSON.parse(JSON.stringify(template.intervals)) : null,
        date: today,
        completed: false,
      },
    });
    return NextResponse.json({ activity });
  }

  if (action === "complete") {
    const activity = await prisma.cardioActivity.update({
      where: { id: activityId },
      data: {
        completed: true,
        completedAt: new Date(),
        duration: duration ?? undefined,
      },
    });

    // Log to activity feed
    await prisma.activity.create({
      data: {
        userId,
        type: "cardio_completed",
        data: {
          cardioType: activity.type,
          title: activity.title,
          duration: activity.duration,
          intensity: activity.intensity,
        },
        isPublic: true,
      },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
