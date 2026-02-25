import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AI_MODELS } from "@/lib/ai/models";

export async function GET(req: NextRequest) {
  // System health check endpoint (no auth required)
  if (req.nextUrl.searchParams.get("check") === "system") {
    const checks: Record<string, { status: "ok" | "error"; latency?: number; error?: string }> = {};

    // Database check
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: "ok", latency: Date.now() - dbStart };
    } catch (e: any) {
      checks.database = { status: "error", error: e?.message?.slice(0, 100) };
    }

    // Claude AI check
    const aiStart = Date.now();
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: AI_MODELS.FAST,
            max_tokens: 1,
            messages: [{ role: "user", content: "ping" }],
          }),
        });
        checks.claude = { status: res.ok ? "ok" : "error", latency: Date.now() - aiStart };
      } else {
        checks.claude = { status: "error", error: "API key not configured" };
      }
    } catch (e: any) {
      checks.claude = { status: "error", latency: Date.now() - aiStart, error: e?.message?.slice(0, 100) };
    }

    // Stripe check
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const res = await fetch("https://api.stripe.com/v1/balance", {
          headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
        });
        checks.stripe = { status: res.ok ? "ok" : "error" };
      } else {
        checks.stripe = { status: "error", error: "Not configured" };
      }
    } catch (e: any) {
      checks.stripe = { status: "error", error: e?.message?.slice(0, 100) };
    }

    // Nutrition API check
    try {
      if (process.env.NUTRITIONIX_APP_ID && process.env.NUTRITIONIX_API_KEY) {
        checks.nutritionApi = { status: "ok" };
      } else {
        checks.nutritionApi = { status: "error", error: "Not configured" };
      }
    } catch {
      checks.nutritionApi = { status: "error" };
    }

    const allOk = Object.values(checks).every((c) => c.status === "ok");
    return NextResponse.json({
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    }, { status: allOk ? 200 : 503 });
  }

  // Regular user health data endpoint
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const data = await prisma.healthData.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("GET /api/health error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { sleepQuality, energyLevel, soreness, sleepHours, weight } = body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entry = await prisma.healthData.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today, sleepQuality, energyLevel, soreness, sleepHours, weight, source: "manual" },
      update: { sleepQuality, energyLevel, soreness, sleepHours, weight },
    });
    return NextResponse.json({ entry });
  } catch (error: any) {
    console.error("POST /api/health error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
