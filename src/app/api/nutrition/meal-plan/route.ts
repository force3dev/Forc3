import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

function getClient() {
  const key = process.env.CLAUDE_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const plan = await prisma.mealPlan.findFirst({
    where: { userId, weekStart: { gte: monday } },
    orderBy: { generatedAt: "desc" },
  });

  return NextResponse.json(plan || null);
}

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = getClient();
  if (!client) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

  const [target, profile] = await Promise.all([
    prisma.nutritionTarget.findUnique({ where: { userId } }),
    prisma.profile.findUnique({ where: { userId }, select: { nutritionGoal: true, goal: true, weight: true } }),
  ]);

  const calories = target?.calories || 2000;
  const protein = target?.protein || 150;
  const carbs = target?.carbs || 200;
  const fat = target?.fat || 65;
  const phase = target?.phase || "maintain";

  const prompt = `Create a 7-day meal prep plan for an athlete with these daily targets:
- Calories: ${calories} kcal
- Protein: ${protein}g
- Carbs: ${carbs}g  
- Fat: ${fat}g
- Phase: ${phase} (${profile?.nutritionGoal || "maintain"})

Return ONLY valid JSON (no markdown, no explanation) in this exact structure:
{
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "name": "Breakfast",
          "description": "meal description",
          "calories": 500,
          "protein": 40,
          "carbs": 50,
          "fat": 15,
          "foods": [{"name": "Oats", "qty": 80, "unit": "g"}, {"name": "Whey protein", "qty": 30, "unit": "g"}]
        }
      ],
      "totalCalories": 2000,
      "totalProtein": 150
    }
  ],
  "groceryList": [
    {
      "category": "Protein",
      "items": [{"name": "Chicken breast", "qty": 2000, "unit": "g"}, {"name": "Eggs", "qty": 18, "unit": "pieces"}]
    },
    {
      "category": "Carbs",
      "items": [{"name": "Oats", "qty": 500, "unit": "g"}]
    },
    {
      "category": "Vegetables",
      "items": [{"name": "Broccoli", "qty": 600, "unit": "g"}]
    },
    {
      "category": "Fats",
      "items": [{"name": "Olive oil", "qty": 1, "unit": "bottle"}]
    },
    {
      "category": "Other",
      "items": [{"name": "Greek yogurt", "qty": 500, "unit": "g"}]
    }
  ]
}

Include breakfast, lunch, dinner, and one snack per day. Make foods practical, whole, and meal-prep friendly. Keep each day hitting within 5% of the targets.`;

  let parsed: { days: unknown[]; groceryList: unknown[] };
  try {
    const resp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    const text = resp.content[0].type === "text" ? resp.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Meal plan generation error:", e);
    return NextResponse.json({ error: "Failed to generate meal plan" }, { status: 500 });
  }

  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const plan = await prisma.mealPlan.create({
    data: {
      userId,
      weekStart: monday,
      days: parsed.days as object[],
      groceryList: parsed.groceryList as object[],
      calorieTarget: calories,
      proteinTarget: protein,
      carbsTarget: carbs,
      fatTarget: fat,
    },
  });

  return NextResponse.json(plan);
}
