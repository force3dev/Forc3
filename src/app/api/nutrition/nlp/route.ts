import { NextRequest, NextResponse } from "next/server";
import { logNaturalLanguage } from "@/lib/nutrition/nutritionix";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODELS } from "@/lib/ai/models";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) return NextResponse.json({ foods: [] });

    // Try Nutritionix NLP first
    if (process.env.NUTRITIONIX_APP_ID) {
      const foods = await logNaturalLanguage(text).catch(() => []);
      if (foods.length > 0) {
        return NextResponse.json({ foods, source: "nutritionix" });
      }
    }

    // Fall back to Claude estimation
    if (process.env.CLAUDE_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
      const response = await anthropic.messages.create({
        model: AI_MODELS.FAST,
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `Estimate nutrition for: "${text}"\n\nReturn ONLY a JSON array. No other text:\n[\n  {\n    "name": "food name",\n    "calories": 200,\n    "protein": 20,\n    "carbs": 10,\n    "fat": 8,\n    "servingSize": 1,\n    "servingUnit": "serving"\n  }\n]`,
          },
        ],
      });

      try {
        const content =
          response.content[0].type === "text" ? response.content[0].text : "[]";
        const foods = JSON.parse(content.replace(/```json|```/g, "").trim());
        return NextResponse.json({ foods, source: "ai-estimate" });
      } catch {
        return NextResponse.json({ foods: [] });
      }
    }

    return NextResponse.json({ foods: [] });
  } catch (error: any) {
    console.error("NLP route error:", error?.message);
    return NextResponse.json({ foods: [], error: "Service unavailable" }, { status: 503 });
  }
}
