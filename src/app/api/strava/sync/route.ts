import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, stravaConnected: true, stravaAccessToken: true, stravaRefreshToken: true, stravaTokenExpiry: true } });
  if (!user?.stravaConnected) return NextResponse.json({ activities: [], connected: false });
  const token = await refreshIfNeeded(user);
  const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
  const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${thirtyDaysAgo}&per_page=30`, {
    headers: { Authorization: `Bearer ${token}` },
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
