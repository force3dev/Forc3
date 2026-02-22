import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blockedUserId } = await req.json();
  if (!blockedUserId || blockedUserId === userId) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: userId, blockedId: blockedUserId } },
    update: {},
    create: { blockerId: userId, blockedId: blockedUserId },
  });

  // Remove follows in both directions
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { followerId: userId, followingId: blockedUserId },
        { followerId: blockedUserId, followingId: userId },
      ],
    },
  });

  await prisma.followRequest.deleteMany({
    where: {
      OR: [
        { senderId: userId, receiverId: blockedUserId },
        { senderId: blockedUserId, receiverId: userId },
      ],
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blockedUserId } = await req.json();
  if (!blockedUserId) return NextResponse.json({ error: "blockedUserId required" }, { status: 400 });

  await prisma.block.deleteMany({
    where: { blockerId: userId, blockedId: blockedUserId },
  });

  return NextResponse.json({ success: true });
}
