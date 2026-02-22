import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/social/follow — follow or send request
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId: targetId } = await req.json();
  if (!targetId || targetId === userId) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check if blocked
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: targetId, blockedId: userId },
        { blockerId: userId, blockedId: targetId },
      ],
    },
  });
  if (blocked) return NextResponse.json({ error: "Cannot follow" }, { status: 403 });

  if (target.isPrivate) {
    // Create follow request
    await prisma.followRequest.upsert({
      where: { senderId_receiverId: { senderId: userId, receiverId: targetId } },
      update: {},
      create: { senderId: userId, receiverId: targetId },
    });

    await prisma.notification.create({
      data: {
        userId: targetId,
        type: "follow_request",
        data: { fromUserId: userId },
      },
    });

    return NextResponse.json({ status: "pending" });
  }

  // Public account — follow directly
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: userId, followingId: targetId } },
    update: {},
    create: { followerId: userId, followingId: targetId },
  });

  await prisma.notification.create({
    data: {
      userId: targetId,
      type: "new_follower",
      data: { fromUserId: userId },
    },
  });

  return NextResponse.json({ status: "following" });
}

// DELETE /api/social/follow — unfollow
export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId: targetId } = await req.json();
  if (!targetId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  await prisma.follow.deleteMany({
    where: { followerId: userId, followingId: targetId },
  });

  await prisma.followRequest.deleteMany({
    where: { senderId: userId, receiverId: targetId },
  });

  return NextResponse.json({ success: true });
}
