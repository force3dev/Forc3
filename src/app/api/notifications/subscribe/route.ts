import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { endpoint, p256dh, auth } = await req.json();
  if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh, auth },
    update: { userId },
  });
  return NextResponse.json({ success: true });
}
