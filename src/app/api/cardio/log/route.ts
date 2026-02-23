import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    type,
    sport,
    title,
    description,
    intensity,
    duration,
    distance,
    pace,
    calories,
    avgHeartRate,
    maxHeartRate,
    routeData,
    intervals,
    notes,
  } = await req.json();

  if (!type || !duration) {
    return NextResponse.json({ error: "type and duration required" }, { status: 400 });
  }

  const activity = await prisma.cardioActivity.create({
    data: {
      userId,
      type,
      sport: sport || null,
      title: title || null,
      description: description || null,
      intensity: intensity || null,
      duration: Math.round(duration),
      distance: distance || null,
      pace: pace || null,
      calories: calories || null,
      avgHeartRate: avgHeartRate || null,
      maxHeartRate: maxHeartRate || null,
      routeData: routeData || null,
      intervals: intervals || null,
      notes: notes || null,
      completed: true,
      completedAt: new Date(),
    },
  });

  // Log as an Activity for the feed
  await prisma.activity.create({
    data: {
      userId,
      type: "cardio_completed",
      data: {
        cardioType: type,
        sport: sport || null,
        duration,
        distance: distance || null,
        calories: calories || null,
      },
      isPublic: true,
    },
  });

  return NextResponse.json({ success: true, id: activity.id });
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activities = await prisma.cardioActivity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ activities });
}
