import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { EXERCISE_DATABASE, getExerciseById } from "@/lib/exercise-database";

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Premium gate
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub || sub.tier === "free") {
    return NextResponse.json({ error: "premium_required" }, { status: 403 });
  }

  const { exerciseId, exerciseName, reason, workoutContext } = await req.json();
  const profile = await prisma.profile.findUnique({ where: { userId } });
  const equipment = profile?.equipment ?? "full_gym";
  const injuries = JSON.parse(profile?.injuries ?? "[]");

  const ex = getExerciseById(exerciseId);
  const altList = EXERCISE_DATABASE
    .filter(e => e.id !== exerciseId && e.muscleGroup.some(m => ex?.muscleGroup.includes(m)))
    .slice(0, 20)
    .map(e => e.name)
    .join(", ");

  const prompt = `The athlete wants to swap: ${exerciseName || ex?.name}
Reason: ${reason}
Equipment available: ${equipment}
Injuries/limitations: ${injuries.join(", ") || "none"}
Workout context: ${workoutContext || "general strength workout"}
Available alternatives in our database: ${altList}

Suggest exactly 3 alternative exercises. For each provide:
1. Exercise name (must be from the alternatives list or a well-known exercise)
2. Why it's a good swap (1 sentence)
3. One technique tip specific to this reason

Respond as JSON array: [{ "name": "...", "reason": "...", "tip": "..." }]`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });
  const text = (msg.content[0] as { text: string }).text;
  const json = text.match(/\[.*\]/s)?.[0] ?? "[]";
  const suggestions = JSON.parse(json);
  return NextResponse.json({ suggestions });
}
