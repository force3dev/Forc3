import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  const key = process.env.CLAUDE_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

export async function detectStalling(userId: string) {
  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

  // Get all exercise logs from the past 3 weeks grouped by exercise
  const logs = await prisma.workoutLog.findMany({
    where: { userId, startedAt: { gte: threeWeeksAgo }, completedAt: { not: null } },
    include: {
      exerciseLogs: {
        include: {
          sets: { where: { isWarmup: false, isDropSet: false } },
          exercise: { select: { name: true } },
        },
      },
    },
    orderBy: { startedAt: "asc" },
  });

  // Group max weight per exercise per week
  const byExercise: Record<string, { week: number; maxWeight: number }[]> = {};

  for (const log of logs) {
    const week = Math.floor((Date.now() - log.startedAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
    for (const el of log.exerciseLogs) {
      const name = el.exercise.name;
      if (!byExercise[name]) byExercise[name] = [];
      const maxWeight = Math.max(...el.sets.map((s) => s.weight), 0);
      if (maxWeight > 0) byExercise[name].push({ week: 2 - week, maxWeight });
    }
  }

  const stalling: { name: string; weeksStalled: number }[] = [];
  for (const [name, entries] of Object.entries(byExercise)) {
    if (entries.length < 2) continue;
    const sorted = entries.sort((a, b) => a.week - b.week);
    const firstWeight = sorted[0].maxWeight;
    const lastWeight = sorted[sorted.length - 1].maxWeight;
    const progressPct = ((lastWeight - firstWeight) / firstWeight) * 100;
    if (progressPct < 2 && entries.length >= 2) {
      stalling.push({ name, weeksStalled: 3 });
    }
  }
  return stalling.slice(0, 5);
}

export async function detectWeakDays(userId: string) {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const logs = await prisma.workoutLog.findMany({
    where: { userId, startedAt: { gte: fourWeeksAgo }, completedAt: { not: null } },
    select: { startedAt: true },
  });

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const counts: Record<string, number> = {};
  for (const log of logs) {
    const day = dayNames[log.startedAt.getDay()];
    counts[day] = (counts[day] || 0) + 1;
  }

  // Find days with fewer than average workouts
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const avg = total / 7;
  return Object.entries(counts)
    .filter(([, c]) => c < avg * 0.6)
    .map(([day]) => day);
}

export async function detectStrongExercises(userId: string) {
  const prs = await prisma.personalRecord.findMany({
    where: { userId },
    include: { exercise: { select: { name: true } } },
    orderBy: { achievedAt: "desc" },
    take: 30,
  });

  // Count PRs per exercise in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentPRs = prs.filter((p) => p.achievedAt >= thirtyDaysAgo);

  const byExercise: Record<string, number> = {};
  for (const pr of recentPRs) {
    const name = pr.exercise.name;
    byExercise[name] = (byExercise[name] || 0) + 1;
  }

  return Object.entries(byExercise)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, rate: count }));
}

export async function analyzePersonality(userId: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  const messages = await prisma.coachMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  if (messages.length < 5) return;

  const conversation = messages
    .reverse()
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  try {
    const resp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Analyze this coaching conversation and return JSON only (no markdown):
{"tonePreference":"balanced","observation":"one key insight about this athlete"}

Tone options: "tough_love" (responds to directness/challenges), "encouragement" (needs positivity/support), "balanced" (mix works well).

Conversation:
${conversation.slice(0, 2000)}`,
        },
      ],
    });

    const text = resp.content[0].type === "text" ? resp.content[0].text.trim() : "";
    let parsed: { tonePreference?: string; observation?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      return;
    }

    const stalling = await detectStalling(userId);
    const weakDays = await detectWeakDays(userId);
    const strongExercises = await detectStrongExercises(userId);

    const existing = await prisma.coachPersonality.findUnique({ where: { userId } });
    const observations = Array.isArray(existing?.observations) ? (existing.observations as { date: string; note: string }[]) : [];
    if (parsed.observation) {
      observations.push({ date: new Date().toISOString(), note: parsed.observation });
    }

    await prisma.coachPersonality.upsert({
      where: { userId },
      create: {
        userId,
        tonePreference: parsed.tonePreference || "balanced",
        observations: observations.slice(-10),
        weakDays,
        stallingExercises: stalling,
        strongExercises,
        totalInteractions: messages.length,
        lastAnalyzed: new Date(),
      },
      update: {
        tonePreference: parsed.tonePreference || "balanced",
        observations: observations.slice(-10),
        weakDays,
        stallingExercises: stalling,
        strongExercises,
        totalInteractions: messages.length,
        lastAnalyzed: new Date(),
      },
    });
  } catch {
    // Silently fail — personality analysis is non-critical
  }
}
