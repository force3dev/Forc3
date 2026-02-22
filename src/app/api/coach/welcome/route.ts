import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI not configured" },
      { status: 503 }
    );
  }

  try {
    const [profile, plan] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.trainingPlan.findUnique({
        where: { userId },
        include: { workouts: { orderBy: { order: "asc" }, take: 3 } },
      }),
    ]);

    if (!profile || !plan) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const splits: Record<string, string> = {
      ppl: "Push / Pull / Legs",
      upper_lower: "Upper / Lower",
      full_body: "Full Body",
    };

    const goals: Record<string, string> = {
      fat_loss: "fat loss",
      muscle_gain: "building muscle",
      strength: "getting stronger",
      endurance: "improving endurance",
      general: "general fitness",
    };

    const firstName = profile.name?.split(" ")[0] || "there";
    const goalLabel = goals[profile.goal || "general"] || "reaching your goals";
    const splitLabel = splits[plan.split || "full_body"] || plan.split;
    const firstWorkouts = plan.workouts.map(w => w.name).join(", ");

    const prompt = `You are FORC3 AI Coach — direct, knowledgeable, and motivating. Write a personalized welcome message for a new user.

User profile:
- Name: ${firstName}
- Goal: ${goalLabel}
- Experience: ${profile.experienceLevel || "beginner"}
- Training: ${plan.daysPerWeek} days/week, ${splitLabel} split
- Equipment: ${profile.equipment || "full gym"}
${profile.goalDescription ? `- Their own words about their goal: "${profile.goalDescription}"` : ""}
- First workouts in their plan: ${firstWorkouts || "coming soon"}
- Daily calorie target: ${Math.round(profile.targetCalories || 2000)} kcal
- Daily protein target: ${Math.round(profile.targetProtein || 150)}g

Write a JSON object with exactly these 4 fields (no markdown, pure JSON):
{
  "greeting": "A 1-2 sentence personal welcome, use their first name, acknowledge their goal. Sound like a real coach who gets it.",
  "planSummary": "2-3 sentences explaining their specific program — mention the split, days per week, and what to expect in the first month.",
  "firstWeekFocus": "1-2 sentences on what to prioritize in week 1 — form, consistency, learning the movements. Keep it actionable.",
  "motivationalNote": "1 punchy sentence that resonates with their specific goal. Not generic — speak to their situation."
}`;

    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response");

    const welcome = JSON.parse(jsonMatch[0]);
    return NextResponse.json(welcome);
  } catch (err) {
    console.error("Welcome generation error:", err);
    // Graceful fallback
    return NextResponse.json({
      greeting: "Welcome to FORC3. Your personalized training program is ready.",
      planSummary: "Your plan has been built based on your goals, experience, and schedule. Follow it consistently and you'll see results.",
      firstWeekFocus: "Focus on learning the movements and building the habit. Don't miss the first week.",
      motivationalNote: "The hardest part is starting. You already did that.",
    });
  }
}
