import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { analyzeWeek } from "@/lib/ai/weeklyAdaptation";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const includeRecap = searchParams.get("recap") === "true";

  try {
    const analysis = await analyzeWeek(userId);

    if (!includeRecap || !process.env.CLAUDE_API_KEY) {
      return NextResponse.json(analysis);
    }

    // Generate Coach Alex weekly recap text
    const profile = await prisma.profile.findUnique({ where: { userId } });
    const athleteName = profile?.name?.split(" ")[0] || "Athlete";
    const streak = await prisma.streak.findUnique({ where: { userId } });

    const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

    const prompt = `Generate a weekly training recap for ${athleteName}.

This week's data:
- Workouts completed: ${analysis.workoutsCompleted} of ${analysis.targetWorkouts} planned
- Strength volume: ${Math.round(analysis.totalVolume)} lbs total volume lifted
- PRs this week: ${analysis.prsHit}
- Compliance rate: ${Math.round(analysis.complianceRate * 100)}%
- Current streak: ${streak?.currentStreak || 0} days
- Volume trend: ${analysis.volumeTrend}
- Recovery score: ${analysis.recoveryScore}/10

Write a 3-4 sentence recap in Coach Alex's voice.
Highlight wins. Note any patterns. Set the tone for next week.
Be real and specific. Reference actual numbers.
End with one key focus for next week.`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 250,
      messages: [{ role: "user", content: prompt }],
    });

    const recapText = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ ...analysis, recapText, streakDays: streak?.currentStreak || 0 });
  } catch (err) {
    console.error("Weekly analysis error:", err);
    return NextResponse.json({ error: "Failed to analyze week" }, { status: 500 });
  }
}
