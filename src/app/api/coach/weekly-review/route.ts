import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODELS } from "@/lib/ai/models";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = process.env.CLAUDE_API_KEY;
  if (!key) return NextResponse.json({ review: null });

  // Only show on Mondays (or within 24h of Monday)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
  if (dayOfWeek !== 1 && dayOfWeek !== 0) {
    return NextResponse.json({ review: null, reason: "not_monday" });
  }

  // Get last week's data
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - (dayOfWeek === 1 ? 7 : 8));
  lastMonday.setHours(0, 0, 0, 0);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 7);

  const [profile, logs, prs] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.workoutLog.findMany({
      where: { userId, startedAt: { gte: lastMonday, lt: lastSunday }, completedAt: { not: null } },
      include: { workout: { select: { name: true } } },
    }),
    prisma.personalRecord.findMany({
      where: { userId, achievedAt: { gte: lastMonday, lt: lastSunday } },
      include: { exercise: { select: { name: true } } },
    }),
  ]);

  const plannedDays = profile?.trainingDays || 4;
  const completed = logs.length;
  const completionRate = Math.round((completed / plannedDays) * 100);
  const prCount = prs.length;

  const athleteName = profile?.name?.split(" ")[0] || "Athlete";

  const prompt = `You are Coach Alex reviewing ${athleteName}'s training week.

Last week's data:
- Planned workouts: ${plannedDays}
- Completed workouts: ${completed} (${completionRate}%)
- PRs set: ${prCount}${prCount > 0 ? " — " + prs.map(p => p.exercise.name).join(", ") : ""}
- Workouts: ${logs.map(l => l.workout?.name || "Workout").join(", ") || "None"}

Based on this:
1. Write a 2-3 sentence honest summary of their week
2. Identify 1 thing they did great (be specific)
3. Identify 1 thing to focus on next week
4. Close with a short motivating line

Keep it under 120 words total. Sound like a real coach. No bullet points — write as flowing text.`;

  try {
    const client = new Anthropic({ apiKey: key });
    const resp = await client.messages.create({
      model: AI_MODELS.BALANCED,
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });
    const review = resp.content[0].type === "text" ? resp.content[0].text : null;
    return NextResponse.json({ review, completed, plannedDays, prCount });
  } catch {
    return NextResponse.json({ review: null });
  }
}
