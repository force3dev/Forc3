import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/social/user?username=handle — get a public user profile
export async function GET(req: NextRequest) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      isPrivate: true,
      _count: {
        select: {
          followers: true,
          following: true,
          workoutLogs: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check block
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: user.id, blockedId: currentUserId },
        { blockerId: currentUserId, blockedId: user.id },
      ],
    },
  });

  // Check follow status
  const isFollowing = !!(await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: currentUserId, followingId: user.id } },
  }));

  const isPending = !isFollowing && !!(await prisma.followRequest.findUnique({
    where: { senderId_receiverId: { senderId: currentUserId, receiverId: user.id } },
  }));

  // Get shared workouts if public or following
  let sharedWorkouts: {
    id: string;
    title: string | null;
    description: string | null;
    createdAt: Date;
    _count: { likes: number; comments: number; copies: number };
    workout: { name: string };
  }[] = [];
  if (!user.isPrivate || isFollowing || user.id === currentUserId) {
    sharedWorkouts = await prisma.sharedWorkout.findMany({
      where: { userId: user.id, isPublic: true },
      include: {
        workout: { select: { name: true } },
        _count: { select: { likes: true, comments: true, copies: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }

  return NextResponse.json({
    user: {
      ...user,
      followers: user._count.followers,
      following: user._count.following,
      workouts: user._count.workoutLogs,
    },
    isFollowing,
    isPending,
    isBlocked: !!block,
    sharedWorkouts,
  });
}
