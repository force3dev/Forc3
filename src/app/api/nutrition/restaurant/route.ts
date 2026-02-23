import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

function getClient() {
  const key = process.env.CLAUDE_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { restaurant, mealType = "lunch" } = await req.json();
  if (!restaurant?.trim()) return NextResponse.json({ error: "Restaurant required" }, { status: 400 });

  const client = getClient();
  if (!client) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

  // Get today's remaining macros
  const target = await prisma.nutritionTarget.findUnique({ where: { userId } });
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const todayLogs = await prisma.nutritionLog.findMany({
    where: { userId, date: { gte: todayStart, lte: todayEnd } },
  });

  const consumed = todayLogs.reduce((acc, l) => ({
    calories: acc.calories + l.calories,
    protein: acc.protein + l.protein,
    carbs: acc.carbs + l.carbs,
    fat: acc.fat + l.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const remaining = {
    calories: Math.round((target?.calories || 2000) - consumed.calories),
    protein: Math.round((target?.protein || 150) - consumed.protein),
    carbs: Math.round((target?.carbs || 200) - consumed.carbs),
    fat: Math.round((target?.fat || 65) - consumed.fat),
  };

  const prompt = `I'm at ${restaurant} for ${mealType}. Build me the best order that fits my remaining macros for the day:
- Remaining calories: ${remaining.calories} kcal
- Remaining protein: ${remaining.protein}g
- Remaining carbs: ${remaining.carbs}g
- Remaining fat: ${remaining.fat}g

Return ONLY valid JSON:
{
  "order": [
    {"item": "item name", "customization": "any modifications like extra protein, light sauce", "qty": 1}
  ],
  "estimated": {"calories": 650, "protein": 45, "carbs": 55, "fat": 18},
  "tip": "brief macro-optimization tip"
}

Be specific with real menu items from ${restaurant}. Maximize protein while hitting calorie target.`;

  try {
    const resp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });
    const text = resp.content[0].type === "text" ? resp.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ restaurant, mealType, remaining, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to build order" }, { status: 500 });
  }
}
