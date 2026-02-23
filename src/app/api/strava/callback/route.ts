import { NextRequest, NextResponse } from "next/server";
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
