import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

// ─── Client ───────────────────────────────────────────────────────────────────

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic({ apiKey: key });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CoachContext {
  recentWorkouts?: number;
  currentExercise?: string;
}

// ─── Data Helpers ─────────────────────────────────────────────────────────────

async function getUserProfile(userId: string) {
  return prisma.profile.findUnique({ where: { userId } });
}

async function getRecentWorkouts(userId: string, days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.workoutLog.findMany({
    where: { userId, startedAt: { gte: since }, completedAt: { not: null } },
    include: {
      workout: { select: { name: true } },
      exerciseLogs: {
        include: {
          exercise: { select: { name: true } },
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
    orderBy: { startedAt: "desc" },
    take: 10,
  });
}

async function getRecentNutrition(userId: string, days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.nutritionLog.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "desc" },
    take: 30,
  });
}

async function getCurrentPlan(userId: string) {
  return prisma.trainingPlan.findUnique({
    where: { userId },
    include: {
      workouts: {
        include: {
          exercises: { include: { exercise: { select: { name: true, muscleGroups: true } } } },
        },
      },
    },
  });
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatRecentWorkouts(workouts: Awaited<ReturnType<typeof getRecentWorkouts>>): string {
  if (workouts.length === 0) return "No workouts logged in this period.";
  return workouts.slice(0, 5).map(w => {
    const totalVolume = w.exerciseLogs.reduce((s, el) =>
      s + el.sets.reduce((ss, set) => ss + set.weight * set.reps, 0), 0
    );
    const topSets = w.exerciseLogs.slice(0, 3).map(el => {
      const best = el.sets.reduce((b, s) => s.weight > (b?.weight || 0) ? s : b, el.sets[0]);
      return best ? `${el.exercise.name}: ${best.weight}×${best.reps}` : "";
    }).filter(Boolean).join(", ");
    return `${new Date(w.startedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}: ${w.workout?.name || "Workout"} | ${Math.round(totalVolume)} lbs | ${topSets}`;
  }).join("\n");
}

function formatRecentNutrition(logs: Awaited<ReturnType<typeof getRecentNutrition>>): string {
  if (logs.length === 0) return "No nutrition logged.";
  // Group by day
  const byDay: Record<string, { cals: number; protein: number }> = {};
  for (const l of logs) {
    const day = l.date.toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { cals: 0, protein: 0 };
    byDay[day].cals += l.calories;
    byDay[day].protein += l.protein;
  }
  return Object.entries(byDay).slice(0, 5).map(([day, d]) =>
    `${day}: ${Math.round(d.cals)} cal, ${Math.round(d.protein)}g protein`
  ).join("\n");
}

// ─── System Prompt ────────────────────────────────────────────────────────────

async function buildCoachSystemPrompt(userId: string): Promise<string> {
  const [profile, workouts, nutrition, plan] = await Promise.all([
    getUserProfile(userId),
    getRecentWorkouts(userId, 14),
    getRecentNutrition(userId, 7),
    getCurrentPlan(userId),
  ]);

  return `You are FORC3 AI Coach — a world-class personal trainer and nutrition coach with PhD-level expertise in exercise science and sports nutrition.

## YOUR CLIENT
Name: ${profile?.name || "Athlete"}
Goal: ${profile?.goal || "general fitness"}
Experience: ${profile?.experienceLevel || "intermediate"}
Training days: ${profile?.trainingDays || 4}/week
Equipment: ${profile?.equipment || "full_gym"}
Injuries/Limitations: ${profile?.injuries ? JSON.parse(profile.injuries).join(", ") || "None" : "None"}
${profile?.sport ? `Sport focus: ${profile.sport}` : ""}

Stats:
- Weight: ${profile?.weight ? `${profile.weight} ${profile?.unitSystem === "imperial" ? "lbs" : "kg"}` : "not set"}
- Daily calorie target: ${profile?.targetCalories ? `${Math.round(profile.targetCalories)} cal` : "not set"}
- Protein target: ${profile?.targetProtein ? `${Math.round(profile.targetProtein)}g` : "not set"}

## CURRENT TRAINING PLAN
${plan ? `${plan.name} — ${plan.split} split\nWeek ${plan.currentWeek} of mesocycle\n${plan.currentPhase ? `Phase: ${plan.currentPhase}` : ""}` : "No plan yet — help them set one up."}

## RECENT PERFORMANCE (Last 2 weeks)
${formatRecentWorkouts(workouts)}

## RECENT NUTRITION (Last 7 days)
${formatRecentNutrition(nutrition)}

## YOUR COACHING STYLE
- Direct and concise — they're probably at the gym or on the go
- Evidence-based: cite real sports science principles when helpful
- Personalized: always reference THEIR actual numbers and data
- Motivating without being cheesy
- Specific: "add 5 lbs to your bench press" not "try going heavier"
- Flag concerning patterns (overtraining signs, undereating, etc.)

## RULES
1. Always reference their actual data when giving advice
2. If they ask about changing their plan, explain the WHY
3. Be specific with numbers — "aim for 180g protein" not "eat more protein"
4. Keep responses concise — 3-5 sentences unless they ask for detail
5. If you notice concerning patterns, flag them proactively`;
}

// ─── Main Ask Function ────────────────────────────────────────────────────────

export async function askCoach(userId: string, message: string): Promise<string> {
  const client = getClient();

  // Load recent conversation history (last 10 messages)
  const history = await prisma.coachMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  history.reverse();

  const systemPrompt = await buildCoachSystemPrompt(userId);

  const messages: Anthropic.MessageParam[] = [
    ...history.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const responseText = response.content[0].type === "text" ? response.content[0].text : "";

  // Save both messages
  await prisma.coachMessage.createMany({
    data: [
      { userId, role: "user", content: message },
      { userId, role: "assistant", content: responseText },
    ],
  });

  return responseText;
}

// ─── AI Calorie Estimation ────────────────────────────────────────────────────

export async function estimateCalories(description: string): Promise<{
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: "high" | "medium" | "low";
}> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `Estimate the nutrition for this food/meal: "${description}"

Respond in JSON only (no markdown):
{
  "name": "cleaned up food name",
  "servingSize": "estimated serving (e.g., '1 cup', '200g', '1 piece')",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "confidence": "high" or "medium" or "low"
}

Be realistic. If it's a meal, estimate the whole thing. Round to whole numbers.`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned);
}

// ─── Workout Notes ────────────────────────────────────────────────────────────

export async function generateWorkoutNotes(
  userId: string,
  workoutName: string,
  exercises: string[]
): Promise<string[]> {
  const client = getClient();

  const [profile, recentLogs] = await Promise.all([
    getUserProfile(userId),
    getRecentWorkouts(userId, 7),
  ]);

  const recentSummary = formatRecentWorkouts(recentLogs);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `Generate 2-3 short, personalized coaching tips for today's workout.

Workout: ${workoutName}
Exercises: ${exercises.join(", ")}
Recent performance: ${recentSummary}
Goal: ${profile?.goal || "general fitness"}
Experience: ${profile?.experienceLevel || "intermediate"}

Rules:
- Specific to TODAY's exercises
- Reference actual numbers if available
- Keep each tip under 20 words
- Motivating but practical

Respond as JSON array only: ["tip 1", "tip 2", "tip 3"]`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "[]";
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return ["Focus on form today.", "Push hard on your working sets.", "Stay hydrated!"];
  }
}

// ─── Recovery Detector ────────────────────────────────────────────────────────

export async function checkRecoveryStatus(userId: string): Promise<{
  status: "good" | "warning" | "critical";
  recommendation: string;
  signals: Record<string, boolean>;
}> {
  const [workouts, nutrition, profile] = await Promise.all([
    getRecentWorkouts(userId, 14),
    getRecentNutrition(userId, 7),
    getUserProfile(userId),
  ]);

  const signals: Record<string, boolean> = {
    rpeCreeping: false,
    performanceDropping: false,
    missedWorkouts: false,
    nutritionLow: false,
  };

  // Check RPE creep across sessions
  if (workouts.length >= 4) {
    const rpeSessions = workouts
      .filter(w => w.overallRpe !== null)
      .map(w => w.overallRpe as number);
    if (rpeSessions.length >= 3) {
      const firstHalf = rpeSessions.slice(Math.floor(rpeSessions.length / 2));
      const secondHalf = rpeSessions.slice(0, Math.floor(rpeSessions.length / 2));
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
      if (avg(firstHalf) - avg(secondHalf) > 1) signals.rpeCreeping = true;
    }
  }

  // Check if missing workouts
  const targetDays = profile?.trainingDays || 4;
  const thisWeekCount = workouts.filter(w => {
    const d = new Date(w.startedAt);
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return d >= monday;
  }).length;
  if (workouts.length === 0) signals.missedWorkouts = true;

  // Check nutrition
  if (nutrition.length > 0 && profile?.targetCalories) {
    const avgCals = nutrition.reduce((s, n) => s + n.calories, 0) / Math.max(nutrition.length, 1);
    if (avgCals < profile.targetCalories * 0.75) signals.nutritionLow = true;
  }

  const warningCount = Object.values(signals).filter(Boolean).length;

  if (warningCount >= 2) {
    return {
      status: "critical",
      signals,
      recommendation: "Multiple recovery signals are elevated. Prioritize sleep, eat more, and consider a light week.",
    };
  } else if (warningCount === 1) {
    return {
      status: "warning",
      signals,
      recommendation: signals.nutritionLow
        ? "You may be under-eating. Make sure to hit your calorie target."
        : "Some fatigue signals detected. Monitor closely and don't skip rest.",
    };
  }

  return {
    status: "good",
    signals,
    recommendation: "Recovery looks solid. Keep the intensity up!",
  };
}
