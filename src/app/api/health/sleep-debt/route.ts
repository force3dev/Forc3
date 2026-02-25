import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SLEEP_TARGET = 8; // hours per night

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const healthData = await prisma.healthData.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      orderBy: { date: "asc" },
      select: { date: true, sleepHours: true },
    });

    // Build 7-day breakdown
    const days: { date: string; slept: number | null; debt: number }[] = [];
    let totalDebt = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const entry = healthData.find((h) => h.date.toISOString().slice(0, 10) === dateStr);
      const slept = entry?.sleepHours ?? null;
      const debt = slept !== null ? Math.max(0, SLEEP_TARGET - slept) : 0;
      totalDebt += debt;
      days.push({ date: dateStr, slept, debt });
    }

    // Get tomorrow's workout type for bedtime recommendation
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayOfWeek = tomorrow.getDay();

    // Simple bedtime recommendation based on debt
    let recommendation = "";
    let optimalBedtime = "10:30 PM";

    if (totalDebt >= 5) {
      recommendation = "Serious sleep debt detected. Prioritize 8-9 hours tonight. Your recovery and performance are both compromised.";
      optimalBedtime = "9:30 PM";
    } else if (totalDebt >= 3) {
      recommendation = `You're carrying ${totalDebt.toFixed(1)} hours of sleep debt this week. Aim for an extra 30-60 minutes tonight.`;
      optimalBedtime = "10:00 PM";
    } else if (totalDebt >= 1) {
      recommendation = "Slight sleep deficit. Stick to a consistent bedtime and you'll recover quickly.";
      optimalBedtime = "10:30 PM";
    } else {
      recommendation = "Sleep is dialed in. Keep it up — this is when the real adaptations happen.";
      optimalBedtime = "10:30 PM";
    }

    // Adjust for day of week (leg days, early training days)
    const hardDays = [1, 3]; // Mon, Wed — common heavy training days
    if (hardDays.includes(dayOfWeek)) {
      recommendation += " Tomorrow is a heavy training day — an extra 30 minutes of sleep will pay dividends.";
      const [hour] = optimalBedtime.split(":");
      const earlyHour = parseInt(hour) === 10 ? "10" : "9";
      optimalBedtime = `${earlyHour}:00 PM`;
    }

    return NextResponse.json({
      totalDebt: Math.round(totalDebt * 10) / 10,
      sleepTarget: SLEEP_TARGET,
      days,
      recommendation,
      optimalBedtime,
    });
  } catch (error: any) {
    console.error("GET /api/health/sleep-debt error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
