import { NextRequest, NextResponse } from "next/server";
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

  const res = await fetch(`https://www.strava.com/api/v3/activities/${object_id}`, {
    headers: { Authorization: `Bearer ${user.stravaAccessToken}` },
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
