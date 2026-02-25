import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { dbErrorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "40");

  try {
    const messages = await prisma.coachMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return NextResponse.json({ messages });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function DELETE() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.coachMessage.deleteMany({ where: { userId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
