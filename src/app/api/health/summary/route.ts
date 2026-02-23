import { NextResponse } from "next/server";
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
