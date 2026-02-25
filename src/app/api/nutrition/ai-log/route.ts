/**
 * AI-powered natural language food logging
 * "I had 2 scrambled eggs and coffee with milk" → structured nutrition data
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { naturalLanguageLog } from "@/lib/nutritionix";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODELS } from "@/lib/ai/models";

export const dynamic = "force-dynamic";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json();
  if (!text || text.length < 3) {
    return NextResponse.json({ error: "Please describe what you ate" }, { status: 400 });
  }

  // Try Nutritionix natural language first
  const nixResults = await naturalLanguageLog(text).catch(() => []);

  if (nixResults.length > 0) {
    const totals = nixResults.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return NextResponse.json({
      foods: nixResults.map(n => ({
        id: `nix_${n.name.replace(/\s/g, "_")}`,
        name: n.name,
        servingSize: `${n.servingQty} ${n.servingUnit}`,
        calories: n.calories,
        protein: n.protein,
        carbs: n.carbs,
        fat: n.fat,
        image: n.imageUrl,
        source: "nutritionix",
      })),
      totals,
      source: "nutritionix",
    });
  }

  // Fall back to Claude for estimation
  const response = await client.messages.create({
    model: AI_MODELS.FAST,
    max_tokens: 1024,
    system: `You are a nutrition expert. When given a food description, return ONLY a JSON array of food items with estimated nutrition.
Format: [{"name": "...", "servingSize": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}]
Use common portion sizes. Be accurate but conservative with estimates. No markdown, just JSON.`,
    messages: [{ role: "user", content: text }],
  });

  try {
    const rawText = response.content[0].type === "text" ? response.content[0].text : "[]";
    const foods = JSON.parse(rawText.trim());

    const totals = foods.reduce(
      (acc: any, item: any) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return NextResponse.json({
      foods: foods.map((f: any, i: number) => ({
        id: `ai_${i}_${f.name?.replace(/\s/g, "_")}`,
        name: f.name,
        servingSize: f.servingSize || "1 serving",
        calories: Math.round(f.calories || 0),
        protein: Math.round(f.protein || 0),
        carbs: Math.round(f.carbs || 0),
        fat: Math.round(f.fat || 0),
        source: "ai",
      })),
      totals: {
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
      },
      source: "ai",
    });
  } catch {
    return NextResponse.json({ error: "Could not parse food description" }, { status: 422 });
  }
}
