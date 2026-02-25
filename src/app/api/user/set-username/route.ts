import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { username, displayName } = await req.json();

    if (!username?.trim()) return NextResponse.json({ error: "username required" }, { status: 400 });

    const cleaned = username.toLowerCase().trim();
    if (!/^[a-z0-9_]{3,20}$/.test(cleaned)) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username: cleaned } });
    if (existing && existing.id !== userId) {
      return NextResponse.json({ error: "Username taken" }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        username: cleaned,
        displayName: displayName?.trim() || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/user/set-username error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
