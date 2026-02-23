import { NextRequest, NextResponse } from "next/server";
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
