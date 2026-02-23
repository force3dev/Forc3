import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;
  const url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=activity:read_all`;
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
