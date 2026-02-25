import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODELS } from "@/lib/ai/models";

export const dynamic = "force-dynamic";

interface WeeklyReport {
  avgCalories: number;
  avgProtein: number;
  patterns: string[];
  recommendations: string[];
  score: number;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const logs = await prisma.nutritionLog.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: "asc" },
    });

    if (logs.length === 0) {
      return NextResponse.json(
        { error: "No nutrition data found for the last 7 days" },
        { status: 404 }
      );
    }

    // Group logs by day to calculate per-day averages
    const dailyTotals = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();

    for (const log of logs) {
      const dayKey = new Date(log.createdAt).toISOString().slice(0, 10);
      const existing = dailyTotals.get(dayKey) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      dailyTotals.set(dayKey, {
        calories: existing.calories + log.calories,
        protein: existing.protein + log.protein,
        carbs: existing.carbs + log.carbs,
        fat: existing.fat + log.fat,
      });
    }

    const daysLogged = dailyTotals.size;
    const totals = Array.from(dailyTotals.values()).reduce(
      (acc, day) => ({
        calories: acc.calories + day.calories,
        protein: acc.protein + day.protein,
        carbs: acc.carbs + day.carbs,
        fat: acc.fat + day.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const avgCalories = Math.round(totals.calories / daysLogged);
    const avgProtein = Math.round(totals.protein / daysLogged);
    const avgCarbs = Math.round(totals.carbs / daysLogged);
    const avgFat = Math.round(totals.fat / daysLogged);

    const anthropic = new Anthropic();

    const prompt = `Analyze this weekly nutrition data and return ONLY valid JSON (no markdown, no code fences).

Data (averaged per day over ${daysLogged} days logged in the last 7 days):
- Average Calories: ${avgCalories} kcal
- Average Protein: ${avgProtein}g
- Average Carbs: ${avgCarbs}g
- Average Fat: ${avgFat}g
- Total meals logged: ${logs.length}
- Days with logged data: ${daysLogged}/7

Daily breakdown:
${Array.from(dailyTotals.entries())
  .map(([date, t]) => `  ${date}: ${Math.round(t.calories)} kcal, ${Math.round(t.protein)}g protein, ${Math.round(t.carbs)}g carbs, ${Math.round(t.fat)}g fat`)
  .join("\n")}

Return JSON with this exact structure:
{
  "avgCalories": <number>,
  "avgProtein": <number>,
  "patterns": ["<string>", ...],
  "recommendations": ["<string>", ...],
  "score": <number 1-10>
}

Rules:
- "patterns": 2-4 notable patterns you observe (e.g. consistency, macro balance, meal frequency)
- "recommendations": 2-4 actionable suggestions to improve nutrition
- "score": overall nutrition quality score from 1 (poor) to 10 (excellent)
- avgCalories and avgProtein should match the provided averages
- Keep pattern and recommendation strings concise (under 100 characters each)`;

    const response = await anthropic.messages.create({
      model: AI_MODELS.BALANCED,
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse the JSON from Claude's response, stripping any accidental markdown fences
    const cleaned = text.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
    const report: WeeklyReport = JSON.parse(cleaned);

    // Validate and clamp the score
    report.score = Math.max(1, Math.min(10, Math.round(report.score)));

    return NextResponse.json({
      ...report,
      daysLogged,
      totalMeals: logs.length,
      avgCarbs,
      avgFat,
    });
  } catch (err) {
    console.error("Weekly nutrition report error:", err);
    return NextResponse.json(
      { error: "Failed to generate weekly nutrition report" },
      { status: 500 }
    );
  }
}
