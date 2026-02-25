import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, any> = {};

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.database = { status: "ok" };
  } catch (e: any) {
    results.database = { status: "error", message: e.message };
  }

  // Check Claude API
  try {
    if (!process.env.CLAUDE_API_KEY) {
      results.claude = { status: "missing", message: "CLAUDE_API_KEY not set" };
    } else if (!process.env.CLAUDE_API_KEY.startsWith("sk-ant-")) {
      results.claude = { status: "invalid", message: "Key format looks wrong" };
    } else {
      results.claude = { status: "ok" };
    }
  } catch (e: any) {
    results.claude = { status: "error", message: e.message };
  }

  // Check Supabase
  results.supabase = {
    status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "ok" : "missing",
    message: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? undefined
      : "Add NEXT_PUBLIC_SUPABASE_URL to env",
  };

  // Check Stripe
  results.stripe = {
    status: process.env.STRIPE_SECRET_KEY ? "ok" : "missing",
    message: process.env.STRIPE_SECRET_KEY
      ? undefined
      : "Add STRIPE_SECRET_KEY to enable payments",
  };

  // Check Nutrition APIs
  results.nutrition = {
    openFoodFacts: { status: "ok", note: "no key needed" },
    usda: {
      status: process.env.USDA_API_KEY ? "ok" : "missing",
      message: process.env.USDA_API_KEY
        ? undefined
        : "Get free key at fdc.nal.usda.gov",
    },
    nutritionix: {
      status: process.env.NUTRITIONIX_APP_ID ? "ok" : "missing",
      message: process.env.NUTRITIONIX_APP_ID
        ? undefined
        : "Get free key at developer.nutritionix.com",
    },
    edamam: {
      status: process.env.EDAMAM_APP_ID ? "ok" : "missing",
      message: process.env.EDAMAM_APP_ID
        ? undefined
        : "Get free key at developer.edamam.com",
    },
    calorieNinjas: {
      status: process.env.CALORIE_NINJAS_API_KEY ? "ok" : "missing",
      message: process.env.CALORIE_NINJAS_API_KEY
        ? undefined
        : "Get free key at calorieninjas.com/api",
    },
    fatSecret: {
      status: process.env.FATSECRET_CLIENT_ID ? "ok" : "missing",
      message: process.env.FATSECRET_CLIENT_ID
        ? undefined
        : "Get free key at platform.fatsecret.com",
    },
  };

  // Check ExerciseDB
  results.exerciseDB = {
    status: process.env.RAPIDAPI_KEY ? "ok" : "missing",
    message: process.env.RAPIDAPI_KEY
      ? undefined
      : "Get free key at rapidapi.com (ExerciseDB)",
  };

  // Check Strava
  results.strava = {
    status: process.env.STRAVA_CLIENT_ID ? "ok" : "missing",
    message: process.env.STRAVA_CLIENT_ID
      ? undefined
      : "Add keys from strava.com/settings/api",
  };

  // Check Push Notifications
  results.pushNotifications = {
    status: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? "ok" : "missing",
    message: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      ? undefined
      : "Run: npx web-push generate-vapid-keys",
  };

  // Check Email
  results.email = {
    status: process.env.RESEND_API_KEY ? "ok" : "missing",
    message: process.env.RESEND_API_KEY
      ? undefined
      : "Get free key at resend.com",
  };

  const allOk =
    results.database.status === "ok" && results.claude.status === "ok";

  return NextResponse.json(
    {
      overall: allOk ? "HEALTHY" : "ISSUES_DETECTED",
      timestamp: new Date().toISOString(),
      checks: results,
    },
    { status: allOk ? 200 : 207 }
  );
}
