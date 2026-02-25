import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ count: 0 });

  const count = await prisma.message.count({
    where: { receiverId: userId, read: false },
  });

  return NextResponse.json({ count });
}
