import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODELS } from "@/lib/ai/models";
import { generateHybridWeek, getTodayCardioFromPlan } from "@/lib/program-generator";

export const dynamic = "force-dynamic";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─── Missed Workout Check-In ───────────────────────────────────────────────────

async function getMissedWorkoutMessage(
  userId: string,
  client: Anthropic
): Promise<{ show: boolean; message: string; daysSince: number }> {
  const [profile, lastLog] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.workoutLog.findFirst({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      include: { workout: { select: { name: true } } },
    }),
  ]);

  if (!lastLog?.completedAt) return { show: false, message: "", daysSince: 0 };
  const daysSince = Math.floor((Date.now() - new Date(lastLog.completedAt).getTime()) / 86400000);
  if (daysSince < 2) return { show: false, message: "", daysSince };

  const athleteName = profile?.name?.split(" ")[0] || "Athlete";
  const goal = profile?.goal?.replace(/_/g, " ") || "your goal";
  const raceGoals = Array.isArray(profile?.raceGoals) ? profile.raceGoals as { type?: string; date?: string }[] : [];
  const nearest = raceGoals
    .filter(r => r.date)
    .map(r => ({ type: r.type, days: Math.max(0, Math.round((new Date(r.date!).getTime() - Date.now()) / 86400000)) }))
    .sort((a, b) => a.days - b.days)[0];

  const prompt = `${athleteName} missed their last ${daysSince} days of training.
Last workout was: ${lastLog.workout?.name || "a workout"}
Their current goal: ${goal}
${nearest ? `Race in ${nearest.days} days: ${nearest.type?.replace(/_/g, " ")}` : ""}

Write a brief, human check-in message (2-3 sentences max).
Be understanding, not preachy. Acknowledge life happens.
Suggest getting back on track with something manageable today.
Don't guilt trip. Be real and warm. Sound like Coach Alex.`;

  try {
    const response = await client.messages.create({
      model: AI_MODELS.BALANCED,
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });
    const message = response.content[0].type === "text" ? response.content[0].text : "";
    return { show: true, message, daysSince };
  } catch {
    return {
      show: true,
      message: `Hey ${athleteName} — life gets busy, I get it. Let's get back on track today with something manageable. Even a 20-minute session counts.`,
      daysSince,
    };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkMissed = searchParams.get("check") === "missed";
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = process.env.CLAUDE_API_KEY ? new Anthropic({ apiKey: process.env.CLAUDE_API_KEY }) : null;

  // Handle missed workout check separately
  if (checkMissed) {
    if (!client) return NextResponse.json({ show: false, message: "", daysSince: 0 });
    try {
      return NextResponse.json(await getMissedWorkoutMessage(userId, client));
    } catch {
      return NextResponse.json({ show: false, message: "", daysSince: 0 });
    }
  }

  let profile, sub;
  try {
    [profile, sub] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.subscription.findUnique({ where: { userId } }),
    ]);
  } catch {
    return NextResponse.json({ message: "Good morning! Today's plan is ready. Let's get after it. 💪", cached: false });
  }

  if (
    sub?.morningCheckinMessage &&
    sub?.morningCheckinDate &&
    isSameDay(new Date(), sub.morningCheckinDate)
  ) {
    return NextResponse.json({ message: sub.morningCheckinMessage, cached: true });
  }

  if (!client) {
    return NextResponse.json({
      message: "Good morning! Today's plan is ready. Let's get after it. 💪",
      cached: false,
    });
  }

  let todayWorkout = "Rest day";
  let todayCardio = "No cardio today";
  let daysUntilRace = "";
  let raceGoal = "";

  if (profile) {
    const raceGoals = Array.isArray(profile.raceGoals)
      ? (profile.raceGoals as { type: string; date?: string }[])
      : [];

    const plan = generateHybridWeek({
      goal: profile.goal || "general",
      experienceLevel: profile.experienceLevel || "intermediate",
      trainingDays: profile.trainingDays || 4,
      sport: profile.sport || undefined,
      raceGoals,
      trainingVolume: profile.trainingVolume || "intermediate",
    });

    const jsDay = new Date().getDay();
    const monIdx = jsDay === 0 ? 6 : jsDay - 1;
    const dayPlan = plan.days.find((d) => d.dayIndex === monIdx);
    if (dayPlan?.strengthLabel) todayWorkout = dayPlan.strengthLabel + " lift";

    const cardio = getTodayCardioFromPlan(plan);
    if (cardio) todayCardio = cardio.title + " (" + cardio.duration + " min, " + cardio.intensity + ")";

    if (raceGoals.length > 0) {
      const nearest = raceGoals
        .filter((r) => r.date)
        .map((r) => ({
          type: r.type,
          days: Math.max(0, Math.round((new Date(r.date!).getTime() - Date.now()) / 86400000)),
        }))
        .sort((a, b) => a.days - b.days)[0];
      if (nearest) {
        daysUntilRace = nearest.days + " days";
        raceGoal = nearest.type.replace(/_/g, " ");
      }
    }
  }

  const clientForCheckin = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY! });

  const prompt = `You are Coach Alex — a world-class hybrid athlete coach. Deliver a personalized morning training brief. Be direct, motivating, specific. Under 100 words. Sound like a real coach, not a bot.

Name: ${profile?.name || "Athlete"}
Today's workout: ${todayWorkout}
Today's cardio: ${todayCardio}
${daysUntilRace ? "Days until race: " + daysUntilRace : ""}
${raceGoal ? "Race goal: " + raceGoal : ""}

Generate a morning check-in that:
1. Acknowledges today's specific training
2. Gives one key coaching cue
3. Ends with a short motivating statement
Keep it punchy. No fluff.`;

  try {
    const response = await clientForCheckin.messages.create({
      model: AI_MODELS.BALANCED,
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const message = response.content[0].type === "text" ? response.content[0].text : "Let's get after it today!";

    const now = new Date();
    const usedToday = sub && isSameDay(now, sub.aiMessagesResetAt) ? sub.aiMessagesUsedToday : 0;

    if (sub) {
      await prisma.subscription.update({
        where: { userId },
        data: {
          morningCheckinMessage: message,
          morningCheckinDate: now,
          aiMessagesUsedToday: usedToday + 1,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId,
          tier: "free",
          status: "active",
          morningCheckinMessage: message,
          morningCheckinDate: now,
          aiMessagesUsedToday: 1,
          aiMessagesResetAt: now,
        },
      });
    }

    return NextResponse.json({ message, cached: false });
  } catch {
    return NextResponse.json({
      message: "Good morning! Today's plan is locked and loaded. Let's go. 💪",
      cached: false,
    });
  }
}
