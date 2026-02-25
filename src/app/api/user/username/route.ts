import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Check if username is available
export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.toLowerCase().trim();

  if (!username) return NextResponse.json({ available: false, error: "Username required" });
  if (username.length < 3) return NextResponse.json({ available: false, error: "Too short (min 3 chars)" });
  if (username.length > 20) return NextResponse.json({ available: false, error: "Too long (max 20 chars)" });
  if (!/^[a-z0-9_]+$/.test(username)) return NextResponse.json({ available: false, error: "Letters, numbers, underscores only" });

  const existing = await prisma.user.findFirst({
    where: { username, NOT: { id: userId } },
  });

  return NextResponse.json({ available: !existing });
}

// Set username — standalone, NO onboarding dependency
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await request.json();
  const cleaned = username?.toLowerCase().trim();

  if (!cleaned || cleaned.length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
  }
  if (cleaned.length > 20) {
    return NextResponse.json({ error: "Username must be at most 20 characters" }, { status: 400 });
  }
  if (!/^[a-z0-9_]+$/.test(cleaned)) {
    return NextResponse.json({ error: "Letters, numbers, underscores only" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { username: cleaned, NOT: { id: userId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { username: cleaned },
  });

  return NextResponse.json({ success: true, username: user.username });
}
