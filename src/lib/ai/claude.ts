import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { generateHybridWeek, formatHybridWeekForCoach } from "@/lib/program-generator";

// ─── Client ───────────────────────────────────────────────────────────────────

function getClient() {
  const key = process.env.CLAUDE_API_KEY;
  if (!key) throw new Error("CLAUDE_API_KEY not set");
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

function formatRaceGoals(raceGoals: unknown): string {
  if (!raceGoals || !Array.isArray(raceGoals) || raceGoals.length === 0) return "";
  const today = new Date();
  const lines = raceGoals.map((r: { type?: string; date?: string }) => {
    const label = r.type?.replace(/_/g, " ") || "event";
    if (r.date) {
      const raceDate = new Date(r.date);
      const daysOut = Math.max(0, Math.round((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      const weeksOut = Math.round(daysOut / 7);
      return `${label} — ${weeksOut} weeks away (${raceDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`;
    }
    return label;
  });
  return lines.join(", ");
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
  const [profile, workouts, nutrition, plan, personality] = await Promise.all([
    getUserProfile(userId),
    getRecentWorkouts(userId, 14),
    getRecentNutrition(userId, 7),
    getCurrentPlan(userId),
    prisma.coachPersonality.findUnique({ where: { userId } }).catch(() => null),
  ]);

  const raceGoalsStr = formatRaceGoals(profile?.raceGoals);
  const hasRaces = !!raceGoalsStr;

  // Calculate days to earliest race
  let raceTaperNote = "";
  if (profile?.raceGoals && Array.isArray(profile.raceGoals)) {
    const datesGoals = (profile.raceGoals as { type?: string; date?: string }[])
      .filter(r => r.date)
      .map(r => ({ type: r.type, days: Math.max(0, Math.round((new Date(r.date!).getTime() - Date.now()) / 86400000)) }))
      .sort((a, b) => a.days - b.days);

    if (datesGoals.length > 0) {
      const next = datesGoals[0];
      if (next.days <= 21) {
        raceTaperNote = `\n⚠️ TAPER ALERT: Only ${next.days} days until ${next.type?.replace(/_/g, " ")}. Recommend reducing volume 40-60%, maintaining some race-pace work, prioritizing sleep and fueling.`;
      } else if (next.days <= 42) {
        raceTaperNote = `\nRACE APPROACHING: ${next.days} days to ${next.type?.replace(/_/g, " ")}. Begin building race-specific fitness, practice race nutrition, reduce junk volume.`;
      }
    }
  }

  return `You are Coach Alex — a world-class coach who works with EVERYONE: bodybuilders, powerlifters, endurance athletes, beginners, combat sports athletes, people losing weight, older adults, hybrid athletes, and more. You've trained Olympic athletes, Ironman champions, powerlifting record holders, and everyday people just getting started. You're direct, motivating, and real. You don't sugarcoat but you always believe in your athletes. You remember everything about your athletes and reference their history naturally. You speak like a human coach — casual but expert, encouraging but honest.

Rules for your communication style:
- Never say "Great question!" or robotic filler phrases
- Never use bullet points in conversational messages — speak naturally
- Reference their specific history when relevant: "Last Tuesday you hit X, today let's aim for Y"
- Call them by first name occasionally
- Be brief when brief is better — don't pad responses
- Celebrate wins genuinely, not over the top
- When they miss workouts, be real but understanding — not preachy
- Use occasional emphasis but not constantly
- Sound like a coach, not a chatbot

## YOUR CLIENT
Name: ${profile?.name || "Athlete"}
Goal: ${profile?.goal || "general fitness"}
Experience: ${profile?.experienceLevel || "intermediate"}
Training days: ${profile?.trainingDays || 4}/week
Equipment: ${profile?.equipment || "full_gym"}
Injuries/Limitations: ${profile?.injuries ? JSON.parse(profile.injuries).join(", ") || "None" : "None"}
${profile?.sport ? `Sport focus: ${profile.sport}` : ""}
${hasRaces ? `\n## RACE / EVENT GOALS\nTraining for: ${raceGoalsStr}\nPrioritize sport-specific cardio and taper as race approaches.${raceTaperNote}` : ""}

Stats:
- Weight: ${profile?.weight ? `${profile.weight} ${profile?.unitSystem === "imperial" ? "lbs" : "kg"}` : "not set"}
- Daily calorie target: ${profile?.targetCalories ? `${Math.round(profile.targetCalories)} cal` : "not set"}
- Protein target: ${profile?.targetProtein ? `${Math.round(profile.targetProtein)}g` : "not set"}

## CURRENT TRAINING PLAN
${plan ? `${plan.name} — ${plan.split} split\nWeek ${plan.currentWeek} of mesocycle\n${plan.currentPhase ? `Phase: ${plan.currentPhase}` : ""}` : "No plan yet — help them set one up."}

## HYBRID WEEKLY SCHEDULE
${(() => {
  try {
    if (!profile) return "No profile data available.";
    const hybridPlan = generateHybridWeek({
      goal: profile.goal || "general",
      experienceLevel: profile.experienceLevel || "intermediate",
      trainingDays: profile.trainingDays || 4,
      sport: profile.sport || undefined,
      raceGoals: Array.isArray(profile.raceGoals) ? profile.raceGoals as { type: string; date?: string }[] : [],
      trainingVolume: profile.trainingVolume || "intermediate",
    });
    return formatHybridWeekForCoach(hybridPlan);
  } catch {
    return "Hybrid schedule unavailable.";
  }
})()}

## RECENT PERFORMANCE (Last 2 weeks)
${formatRecentWorkouts(workouts)}

## RECENT NUTRITION (Last 7 days)
${formatRecentNutrition(nutrition)}

## COACHING STYLE (Learned from ${personality?.totalInteractions || 0} interactions)
${personality ? `
- Communication preference: ${personality.tonePreference === "tough_love" ? "Direct and challenging — this athlete responds to being pushed" : personality.tonePreference === "encouragement" ? "Positive and supportive — this athlete needs genuine encouragement" : "Balanced — mix of honesty and support"}
${(personality.stallingExercises as { name: string; weeksStalled: number }[])?.length > 0 ? `- Stalling exercises (bring up proactively): ${(personality.stallingExercises as { name: string }[]).map(e => e.name).join(", ")}` : ""}
${(personality.weakDays as string[])?.length > 0 ? `- Low-consistency days: ${(personality.weakDays as string[]).join(", ")} — acknowledge and adapt if relevant` : ""}
${(personality.strongExercises as { name: string }[])?.length > 0 ? `- Strong lifts (acknowledge progress): ${(personality.strongExercises as { name: string }[]).map(e => e.name).join(", ")}` : ""}
${(personality.observations as { note: string }[])?.slice(-3).map(o => `- Observation: ${o.note}`).join("\n") || ""}` : "- No personality data yet — observe and adapt"}

## COACHING RULES
1. Always reference their actual data when giving advice
2. If they ask about changing their plan, explain the WHY
3. Be specific with numbers — "aim for 180g protein" not "eat more protein"
4. Keep responses concise — 3-5 sentences unless they ask for detail
5. If you notice concerning patterns (stalling, weak days), flag them proactively
6. Reference their upcoming race when relevant — connect today's training to their goal
7. Adapt your tone to match their learned preference above`;
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

// ─── AI Program Generator ────────────────────────────────────────────────────

export interface AIProgramInput {
  name?: string;
  primaryGoal: string;
  customGoal?: string;
  sport?: string;
  experienceLevel: string;
  trainingDaysPerWeek: number;
  sessionLength: number;
  equipment: string[];
  limitations: string[];
  age?: number;
  weight?: number;
  height?: number;
  raceGoal?: string;
  raceDate?: string;
  goalDescription?: string;
}

export interface AIGeneratedExercise {
  name: string;
  sets: number;
  reps: string;
  rest: number;
  tempo: string;
  notes: string;
  muscleGroups: string[];
  equipment: string;
}

export interface AIGeneratedWorkout {
  name: string;
  exercises: AIGeneratedExercise[];
  warmUp: string;
  coolDown: string;
  estimatedDuration: number;
  coachNotes: string;
}

export interface AIGeneratedDay {
  day: number;
  dayName: string;
  focus: string;
  type: "strength" | "cardio" | "hybrid" | "rest" | "active_recovery";
  workout: AIGeneratedWorkout | null;
  cardio: { type: string; duration: number; description: string } | null;
}

export interface AIGeneratedProgram {
  programName: string;
  programDescription: string;
  weeklyStructure: AIGeneratedDay[];
  coachMessage: string;
  progressionRules: string;
  keyFocusAreas: string[];
}

export async function generateAIProgram(input: AIProgramInput): Promise<AIGeneratedProgram> {
  const client = getClient();

  const equipmentList = input.equipment.length > 0
    ? input.equipment.join(", ")
    : "bodyweight only";

  const limitationsList = input.limitations.length > 0
    ? input.limitations.join(", ")
    : "none";

  const systemPrompt = `You are Coach Alex, a world-class coach with expertise in:
- Strength training and powerlifting
- Bodybuilding and physique development
- Endurance sports (running, cycling, swimming, triathlon)
- Sport-specific conditioning (MMA, basketball, football, etc)
- Fat loss and body recomposition
- Beginner programming and movement fundamentals
- Advanced periodization and peaking
- Injury rehabilitation and prevention
- Longevity and general health fitness

You create fully personalized programs for anyone regardless of their goal.
You never use cookie-cutter templates — every program is built from scratch
based on the individual's specific situation.

ALWAYS return valid JSON in exactly this format:
{
  "programName": "string",
  "programDescription": "string",
  "weeklyStructure": [
    {
      "day": 1,
      "dayName": "Monday",
      "focus": "string",
      "type": "strength|cardio|hybrid|rest|active_recovery",
      "workout": {
        "name": "string",
        "exercises": [
          {
            "name": "string",
            "sets": number,
            "reps": "string",
            "rest": number,
            "tempo": "string",
            "notes": "string",
            "muscleGroups": ["string"],
            "equipment": "string"
          }
        ],
        "warmUp": "string",
        "coolDown": "string",
        "estimatedDuration": number,
        "coachNotes": "string"
      },
      "cardio": null
    }
  ],
  "coachMessage": "string",
  "progressionRules": "string",
  "keyFocusAreas": ["string"]
}

Return ONLY the JSON object with no markdown, no explanation, no other text.`;

  const userPrompt = `Create a complete personalized training program for this athlete:

Name: ${input.name || "Athlete"}
Primary Goal: ${input.primaryGoal}
Custom Goal Description: ${input.customGoal || "N/A"}
Sport: ${input.sport || "N/A"}
Experience Level: ${input.experienceLevel}
Training Days Per Week: ${input.trainingDaysPerWeek}
Session Length: ${input.sessionLength} minutes
Available Equipment: ${equipmentList}
Physical Limitations: ${limitationsList}
Age: ${input.age || "Not specified"}
Weight: ${input.weight ? `${input.weight} kg` : "Not specified"}
Height: ${input.height ? `${input.height} cm` : "Not specified"}
Upcoming Race/Event: ${input.raceGoal || "None"}
Race Date: ${input.raceDate || "N/A"}
Additional Context: ${input.goalDescription || "None"}

Build them a complete ${input.trainingDaysPerWeek}-day training week that:
1. Perfectly matches their goal (NOT a generic program)
2. Uses ONLY their available equipment: ${equipmentList}
3. Avoids exercises that aggravate: ${limitationsList}
4. Is appropriate for their experience level: ${input.experienceLevel}
5. Fits within ${input.sessionLength} minutes per session
6. Includes specific coaching cues for each exercise
7. Has warm-up and cool-down for every workout day
8. Includes cardio where relevant to the goal

Goal-specific guidance:
- muscle_gain/bodybuilding: hypertrophy focus, 3-4 sets × 8-12 reps, include isolation work
- strength/powerlifting: low reps (1-5), main lifts first, heavy accessories
- fat_loss: compound movements, metabolic circuits, integrate cardio
- complete_beginner: fundamental movement patterns, low volume, build confidence
- endurance: sport-specific cardio programming, 2x/week max strength
- sport_performance: explosive power, conditioning, sport-specific movements
- longevity: joint-friendly movements, mobility, sustainable training
- hybrid: balance strength and cardio based on days available
- triathlon: all three disciplines + strength support

Sunday should always be rest or active recovery.
Return only the JSON object.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();

  try {
    return JSON.parse(cleaned) as AIGeneratedProgram;
  } catch {
    throw new Error("AI program generation returned invalid JSON");
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
