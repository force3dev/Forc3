// Auto-setup script — creates missing API route directories and files
// Runs automatically via "predev" before npm run dev

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = path.join(root, "src");

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeIfMissing(filePath, content) {
  if (!fs.existsSync(filePath)) {
    mkdirp(path.dirname(filePath));
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`  created: ${filePath.replace(root, "")}`);
  }
}

console.log("🔧 FORC3 setup-routes: checking missing files...");

// ── 1. app/api/coach/check-limit/route.ts ──────────────────────────────────
writeIfMissing(
  path.join(src, "app/api/coach/check-limit/route.ts"),
  `import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { toSimpleTier, getRemainingMessages, LIMITS } from "@/lib/subscription";

export const dynamic = "force-dynamic";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

async function getOrCreateSubscription(userId: string) {
  let sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) {
    sub = await prisma.subscription.create({
      data: { userId, tier: "free", status: "active" },
    });
  }
  return sub;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getOrCreateSubscription(userId);
  const tier = toSimpleTier(sub.tier);

  const now = new Date();
  const resetAt = sub.aiMessagesResetAt;
  const usedToday = isSameDay(now, resetAt) ? sub.aiMessagesUsedToday : 0;

  const remaining = getRemainingMessages(tier, usedToday);
  return NextResponse.json({ remaining, canSend: remaining > 0 || tier === "premium" });
}

export async function POST(_req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getOrCreateSubscription(userId);
  const tier = toSimpleTier(sub.tier);

  const now = new Date();
  const resetAt = sub.aiMessagesResetAt;
  const usedToday = isSameDay(now, resetAt) ? sub.aiMessagesUsedToday : 0;
  const limit = LIMITS[tier].aiMessagesPerDay;

  if (usedToday >= limit && tier === "free") {
    return NextResponse.json({ remaining: 0, canSend: false });
  }

  const newUsed = usedToday + 1;
  await prisma.subscription.update({
    where: { userId },
    data: {
      aiMessagesUsedToday: newUsed,
      aiMessagesResetAt: isSameDay(now, resetAt) ? undefined : now,
    },
  });

  const remaining = getRemainingMessages(tier, newUsed);
  return NextResponse.json({ remaining, canSend: remaining > 0 || tier === "premium" });
}
`
);

// ── 2. app/api/coach/morning-checkin/route.ts ──────────────────────────────
writeIfMissing(
  path.join(src, "app/api/coach/morning-checkin/route.ts"),
  `import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { generateHybridWeek, getTodayCardioFromPlan } from "@/lib/program-generator";

export const dynamic = "force-dynamic";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile, sub] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.subscription.findUnique({ where: { userId } }),
  ]);

  if (
    sub?.morningCheckinMessage &&
    sub?.morningCheckinDate &&
    isSameDay(new Date(), sub.morningCheckinDate)
  ) {
    return NextResponse.json({ message: sub.morningCheckinMessage, cached: true });
  }

  if (!process.env.CLAUDE_API_KEY) {
    return NextResponse.json({
      message: "Good morning! Today's plan is ready. Let's get after it. 💪",
      cached: false,
    });
  }

  let todayWorkout = "Rest day";
  let todayCardio = "No cardio today";
  let daysUntilRace = "";
  let raceGoal = "";

  if (profile) {
    const raceGoals = Array.isArray(profile.raceGoals)
      ? (profile.raceGoals as { type: string; date?: string }[])
      : [];

    const plan = generateHybridWeek({
      goal: profile.goal || "general",
      experienceLevel: profile.experienceLevel || "intermediate",
      trainingDays: profile.trainingDays || 4,
      sport: profile.sport || undefined,
      raceGoals,
      trainingVolume: profile.trainingVolume || "intermediate",
    });

    const jsDay = new Date().getDay();
    const monIdx = jsDay === 0 ? 6 : jsDay - 1;
    const dayPlan = plan.days.find((d) => d.dayIndex === monIdx);
    if (dayPlan?.strengthLabel) todayWorkout = dayPlan.strengthLabel + " lift";

    const cardio = getTodayCardioFromPlan(plan);
    if (cardio) todayCardio = cardio.title + " (" + cardio.duration + " min, " + cardio.intensity + ")";

    if (raceGoals.length > 0) {
      const nearest = raceGoals
        .filter((r) => r.date)
        .map((r) => ({
          type: r.type,
          days: Math.max(0, Math.round((new Date(r.date!).getTime() - Date.now()) / 86400000)),
        }))
        .sort((a, b) => a.days - b.days)[0];
      if (nearest) {
        daysUntilRace = nearest.days + " days";
        raceGoal = nearest.type.replace(/_/g, " ");
      }
    }
  }

  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

  const prompt = \`You are a world-class hybrid athlete coach. Deliver a personalized morning training brief. Be direct, motivating, specific. Under 100 words. Sound like a real coach.

Name: \${profile?.name || "Athlete"}
Today's workout: \${todayWorkout}
Today's cardio: \${todayCardio}
\${daysUntilRace ? "Days until race: " + daysUntilRace : ""}
\${raceGoal ? "Race goal: " + raceGoal : ""}

Generate a morning check-in that:
1. Acknowledges today's specific training
2. Gives one key coaching cue
3. Ends with a short motivating statement
Keep it punchy. No fluff.\`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const message = response.content[0].type === "text" ? response.content[0].text : "Let's get after it today!";

    const now = new Date();
    const usedToday = sub && isSameDay(now, sub.aiMessagesResetAt) ? sub.aiMessagesUsedToday : 0;

    if (sub) {
      await prisma.subscription.update({
        where: { userId },
        data: {
          morningCheckinMessage: message,
          morningCheckinDate: now,
          aiMessagesUsedToday: usedToday + 1,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId,
          tier: "free",
          status: "active",
          morningCheckinMessage: message,
          morningCheckinDate: now,
          aiMessagesUsedToday: 1,
          aiMessagesResetAt: now,
        },
      });
    }

    return NextResponse.json({ message, cached: false });
  } catch {
    return NextResponse.json({
      message: "Good morning! Today's plan is locked and loaded. Let's go. 💪",
      cached: false,
    });
  }
}
`
);

// ── 3. app/api/program/weekly/route.ts ─────────────────────────────────────
writeIfMissing(
  path.join(src, "app/api/program/weekly/route.ts"),
  `import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateHybridWeek } from "@/lib/program-generator";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 404 });

  const raceGoals = Array.isArray(profile.raceGoals)
    ? (profile.raceGoals as { type: string; date?: string }[])
    : [];

  const plan = generateHybridWeek({
    goal: profile.goal || "general",
    experienceLevel: profile.experienceLevel || "intermediate",
    trainingDays: profile.trainingDays || 4,
    sport: profile.sport || undefined,
    raceGoals,
    trainingVolume: profile.trainingVolume || "intermediate",
  });

  return NextResponse.json(plan);
}
`
);

// ── 4. app/api/progress/recovery/route.ts ──────────────────────────────────
writeIfMissing(
  path.join(src, "app/api/progress/recovery/route.ts"),
  `import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { calculateRecoveryScore } from "@/lib/recovery-score";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [recentLogs, weekLogs] = await Promise.all([
    prisma.workoutLog.findMany({
      where: { userId, startedAt: { gte: threeDaysAgo }, completedAt: { not: null } },
      select: { startedAt: true, overallRpe: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.workoutLog.findMany({
      where: { userId, startedAt: { gte: sevenDaysAgo }, completedAt: { not: null } },
      select: { startedAt: true },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const hardWorkouts = recentLogs.filter((l) => (l.overallRpe ?? 0) >= 8).length;
  const trainingDays = new Set(weekLogs.map((l) => l.startedAt.toISOString().slice(0, 10))).size;
  const restDaysLast7Days = 7 - trainingDays;

  let consecutiveTrainingDays = 0;
  const allDates = new Set(weekLogs.map((l) => l.startedAt.toISOString().slice(0, 10)));
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
    if (allDates.has(d)) consecutiveTrainingDays++;
    else break;
  }

  const result = calculateRecoveryScore({
    workoutsLast3Days: recentLogs.length,
    hardWorkoutsLast3Days: hardWorkouts,
    restDaysLast7Days,
    consecutiveTrainingDays,
  });

  return NextResponse.json(result);
}
`
);

// ── 5. app/upgrade/page.tsx ─────────────────────────────────────────────────
writeIfMissing(
  path.join(src, "app/upgrade/page.tsx"),
  `"use client";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

const FEATURES = [
  { icon: "🤖", label: "Unlimited AI Coach Chat" },
  { icon: "📊", label: "Recovery Score" },
  { icon: "🏃", label: "Race Programming & Taper" },
  { icon: "🔄", label: "AI Exercise Swap" },
  { icon: "🍎", label: "Nutrition AI" },
  { icon: "✏️", label: "Customize Workouts" },
  { icon: "📈", label: "Advanced Analytics" },
  { icon: "♾️", label: "Unlimited History" },
];

export default function UpgradePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 pt-10 pb-6 text-center space-y-2">
        <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
        <h1 className="text-3xl font-bold">Go Premium</h1>
        <p className="text-neutral-400 text-sm">PhD-level coaching. Unlimited.</p>
      </div>

      <div className="px-6 space-y-5">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-3">
          {FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="text-xl">{f.icon}</span>
              <span className="text-sm text-neutral-200">{f.label}</span>
              <span className="ml-auto text-[#00C853] text-sm">✓</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="bg-[#0066FF]/10 border border-[#0066FF] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">Yearly</div>
                <div className="text-xs text-[#0066FF] font-semibold mt-0.5">BEST VALUE — Save 45%</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#00C853]">$99</div>
                <div className="text-xs text-neutral-400">/ year</div>
              </div>
            </div>
            <button className="mt-4 w-full py-4 bg-[#0066FF] text-white font-bold rounded-xl hover:bg-[#0052CC] transition-colors">
              Get Yearly — $99/yr
            </button>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">Monthly</div>
                <div className="text-xs text-neutral-500 mt-0.5">Cancel anytime</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">$14.99</div>
                <div className="text-xs text-neutral-400">/ month</div>
              </div>
            </div>
            <button className="mt-4 w-full py-3 bg-[#1a1a1a] border border-[#262626] text-neutral-300 font-semibold rounded-xl hover:border-neutral-500 hover:text-white transition-colors">
              Get Monthly — $14.99/mo
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-600 text-center">
          Secure payment via Stripe. Cancel anytime.
        </p>

        <button
          onClick={() => router.back()}
          className="w-full py-3 text-neutral-500 text-sm hover:text-neutral-300 transition-colors"
        >
          ← Back
        </button>
      </div>

      <BottomNav active="home" />
    </main>
  );
}
`
);

console.log("✅ FORC3 setup-routes complete.");

// ── 6. app/api/health/route.ts ────────────────────────────────────────────────
writeIfMissing(
  path.join(src, "app/api/health/route.ts"),
  `import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const data = await prisma.healthData.findMany({
    where: { userId, date: { gte: sevenDaysAgo } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
}
`
);

// ── 7. app/api/health/summary/route.ts ────────────────────────────────────────
writeIfMissing(
  path.join(src, "app/api/health/summary/route.ts"),
  `import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const data = await prisma.healthData.findMany({
    where: { userId, date: { gte: sevenDaysAgo } },
    orderBy: { date: "desc" },
  });
  const avgSleep = data.length
    ? data.reduce((s, d) => s + (d.sleepQuality ?? 5), 0) / data.length
    : null;
  const avgEnergy = data.length
    ? data.reduce((s, d) => s + (d.energyLevel ?? 5), 0) / data.length
    : null;
  const trend = data.length >= 3
    ? (data[0].energyLevel ?? 5) > (data[data.length - 1].energyLevel ?? 5)
      ? "improving" : "declining"
    : "stable";
  const today = data[0] ?? null;
  let recommendation = "Normal training day.";
  if (today) {
    if ((today.sleepQuality ?? 10) < 5 || (today.energyLevel ?? 10) < 4)
      recommendation = "Low energy detected. Scale back intensity 30-40% today and focus on technique.";
    else if (today.soreness === "severe" || today.soreness === "moderate")
      recommendation = "Significant soreness reported. Avoid affected muscle groups, consider active recovery.";
    else if ((today.energyLevel ?? 0) > 8 && (today.sleepQuality ?? 0) > 7)
      recommendation = "You're feeling great! This is a perfect day to push hard and chase a PR.";
  }
  return NextResponse.json({ avgSleep, avgEnergy, trend, today, recommendation, history: data });
}
`
);

// ── 8. app/api/strava/auth/route.ts ──────────────────────────────────────────
writeIfMissing(
  path.join(src, "app/api/strava/auth/route.ts"),
  `import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;
  const url = \`https://www.strava.com/oauth/authorize?client_id=\${clientId}&redirect_uri=\${redirectUri}&response_type=code&scope=activity:read_all\`;
  return NextResponse.redirect(url);
}

export async function DELETE() {
  // Disconnect Strava — clear tokens from user record
  const { getCurrentUserId } = await import("@/lib/session");
  const { prisma } = await import("@/lib/prisma");
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.user.update({
    where: { id: userId },
    data: { stravaConnected: false, stravaAccessToken: null, stravaRefreshToken: null, stravaAthleteId: null },
  });
  return NextResponse.json({ success: true });
}
`
);

// ── 9. app/api/strava/callback/route.ts ──────────────────────────────────────
writeIfMissing(
  path.join(src, "app/api/strava/callback/route.ts"),
  `import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect("/dashboard?strava=error");
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.redirect("/login");

  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json();
  if (!data.access_token) return NextResponse.redirect("/dashboard?strava=error");

  await prisma.user.update({
    where: { id: userId },
    data: {
      stravaConnected: true,
      stravaAccessToken: data.access_token,
      stravaRefreshToken: data.refresh_token,
      stravaTokenExpiry: new Date(data.expires_at * 1000),
      stravaAthleteId: String(data.athlete?.id ?? ""),
    },
  });
  return NextResponse.redirect(new URL("/dashboard?strava=connected", req.url));
}
`
);

// ── 10. app/api/strava/sync/route.ts ─────────────────────────────────────────
writeIfMissing(
  path.join(src, "app/api/strava/sync/route.ts"),
  `import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

async function refreshIfNeeded(user: { stravaAccessToken: string | null; stravaRefreshToken: string | null; stravaTokenExpiry: Date | null; id: string }) {
  if (!user.stravaTokenExpiry || user.stravaTokenExpiry > new Date()) return user.stravaAccessToken;
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: user.stravaRefreshToken,
    }),
  });
  const data = await res.json();
  await prisma.user.update({
    where: { id: user.id },
    data: { stravaAccessToken: data.access_token, stravaRefreshToken: data.refresh_token, stravaTokenExpiry: new Date(data.expires_at * 1000) },
  });
  return data.access_token as string;
}

export async function GET() {
  return POST();
}

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, stravaConnected: true, stravaAccessToken: true, stravaRefreshToken: true, stravaTokenExpiry: true } });
  if (!user?.stravaConnected) return NextResponse.json({ activities: [], connected: false });
  const token = await refreshIfNeeded(user);
  const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
  const res = await fetch(\`https://www.strava.com/api/v3/athlete/activities?after=\${thirtyDaysAgo}&per_page=30\`, {
    headers: { Authorization: \`Bearer \${token}\` },
  });
  const activities = await res.json();
  if (!Array.isArray(activities)) return NextResponse.json({ activities: [], error: "Strava API error" });
  let imported = 0;
  for (const a of activities) {
    await prisma.stravaActivity.upsert({
      where: { stravaId: String(a.id) },
      create: { userId, stravaId: String(a.id), name: a.name, type: a.type, date: new Date(a.start_date), distance: a.distance, duration: a.moving_time, elevation: a.total_elevation_gain, avgHeartRate: a.average_heartrate, maxHeartRate: a.max_heartrate, avgPace: a.distance > 0 ? a.moving_time / (a.distance / 1000) : null, calories: a.calories },
      update: {},
    });
    imported++;
  }
  const saved = await prisma.stravaActivity.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 10 });
  return NextResponse.json({ imported, activities: saved, connected: true });
}
`
);

// ── 11. app/api/strava/webhook/route.ts ──────────────────────────────────────
writeIfMissing(
  path.join(src, "app/api/strava/webhook/route.ts"),
  `import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Webhook verification challenge
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  const verify = req.nextUrl.searchParams.get("hub.verify_token");
  if (verify === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ "hub.challenge": challenge });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { object_type, object_id, owner_id, aspect_type } = body;
  if (object_type !== "activity" || aspect_type !== "create") return NextResponse.json({ ok: true });

  const user = await prisma.user.findFirst({ where: { stravaAthleteId: String(owner_id) } });
  if (!user?.stravaAccessToken) return NextResponse.json({ ok: true });

  const res = await fetch(\`https://www.strava.com/api/v3/activities/\${object_id}\`, {
    headers: { Authorization: \`Bearer \${user.stravaAccessToken}\` },
  });
  const a = await res.json();
  if (a.id) {
    await prisma.stravaActivity.upsert({
      where: { stravaId: String(a.id) },
      create: { userId: user.id, stravaId: String(a.id), name: a.name, type: a.type, date: new Date(a.start_date), distance: a.distance, duration: a.moving_time, elevation: a.total_elevation_gain, avgHeartRate: a.average_heartrate, maxHeartRate: a.max_heartrate, avgPace: a.distance > 0 ? a.moving_time / (a.distance / 1000) : null, calories: a.calories },
      update: {},
    });
  }
  return NextResponse.json({ ok: true });
}
`
);

// ── 12. app/api/workout/swap-exercise/route.ts ───────────────────────────────
writeIfMissing(
  path.join(src, "app/api/workout/swap-exercise/route.ts"),
  `import { NextRequest, NextResponse } from "next/server";
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

  const prompt = \`The athlete wants to swap: \${exerciseName || ex?.name}
Reason: \${reason}
Equipment available: \${equipment}
Injuries/limitations: \${injuries.join(", ") || "none"}
Workout context: \${workoutContext || "general strength workout"}
Available alternatives in our database: \${altList}

Suggest exactly 3 alternative exercises. For each provide:
1. Exercise name (must be from the alternatives list or a well-known exercise)
2. Why it's a good swap (1 sentence)
3. One technique tip specific to this reason

Respond as JSON array: [{ "name": "...", "reason": "...", "tip": "..." }]\`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });
  const text = (msg.content[0] as { text: string }).text;
  const json = text.match(/\\[.*\\]/s)?.[0] ?? "[]";
  const suggestions = JSON.parse(json);
  return NextResponse.json({ suggestions });
}
`
);

// ── 13. app/api/notifications/subscribe/route.ts ─────────────────────────────
writeIfMissing(
  path.join(src, "app/api/notifications/subscribe/route.ts"),
  `import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { endpoint, p256dh, auth } = await req.json();
  if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh, auth },
    update: { userId },
  });
  return NextResponse.json({ success: true });
}
`
);

// ── 14. app/api/notifications/send-checkin/route.ts ──────────────────────────
writeIfMissing(
  path.join(src, "app/api/notifications/send-checkin/route.ts"),
  `import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notifications";

export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get("authorization");
  if (auth !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    include: { user: { include: { profile: true } } },
  });

  let sent = 0;
  let failed = 0;
  for (const sub of subscriptions) {
    const name = sub.user.profile?.name?.split(" ")[0] ?? "Athlete";
    try {
      await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        { title: \`Good morning, \${name}! 🏋️\`, body: "Your daily coaching brief is ready.", url: "/dashboard" }
      );
      sent++;
    } catch {
      failed++;
      // Remove stale subscriptions
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
    }
  }
  return NextResponse.json({ sent, failed });
}
`
);

// ── 15. app/api/progress-photos/route.ts ─────────────────────────────────────
writeIfMissing(
  path.join(src, "app/api/progress-photos/route.ts"),
  `import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const photos = await prisma.progressPhoto.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ photos });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { imageUrl, weight, notes, date, type } = await req.json();
  const photo = await prisma.progressPhoto.create({
    data: { userId, imageUrl, photoUrl: imageUrl, weight, notes, date: date ? new Date(date) : new Date(), type: type ?? "front" },
  });
  return NextResponse.json({ photo });
}
`
);

// ── 16. app/api/progress-photos/upload/route.ts ───────────────────────────────
writeIfMissing(
  path.join(src, "app/api/progress-photos/upload/route.ts"),
  `import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Dynamic import to avoid build-time issues if supabase env not set
  const { uploadProgressPhoto } = await import("@/lib/supabase-storage");
  const photoUrl = await uploadProgressPhoto(userId, file);
  return NextResponse.json({ photoUrl });
}
`
);


// ── PWA Icons (generated via canvas if available) ───────────────────────────
function generateIcon(size, outputPath) {
  if (fs.existsSync(outputPath)) return;
  try {
    const { createCanvas } = require("canvas");
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#0066FF";
    const r = size * 0.42;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${Math.round(size * 0.32)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("F3", size / 2, size / 2);
    fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
    console.log(`  created: ${outputPath.replace(root, "")}`);
  } catch {
    // canvas not installed — skip icon generation
  }
}

generateIcon(192, path.join(root, "public/icon-192.png"));
generateIcon(512, path.join(root, "public/icon-512.png"));
