import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username")?.toLowerCase().trim();

    if (!username || username.length < 3) {
      return NextResponse.json({ available: false, reason: "Too short" });
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json({ available: false, reason: "Invalid characters" });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    return NextResponse.json({ available: !existing });
  } catch (error: any) {
    console.error("GET /api/user/check-username error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
