import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/social/user?username=handle or ?userId=... — get a public user profile
export async function GET(req: NextRequest) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const userId = searchParams.get("userId");
    if (!username && !userId) {
      return NextResponse.json({ error: "username or userId required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: username ? { username } : { id: userId! },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        isPrivate: true,
        streak: { select: { currentStreak: true, level: true, totalXP: true } },
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

    // Fetch PRs and achievements for the profile
    const [prs, userAchievements, workoutLogs] = await Promise.all([
      prisma.personalRecord.findMany({
        where: { userId: user.id, type: "1rm" },
        orderBy: { value: "desc" },
        take: 6,
        include: { exercise: { select: { name: true } } },
      }),
      prisma.userAchievement.findMany({
        where: { userId: user.id },
        include: { achievement: { select: { icon: true, name: true } } },
        take: 10,
      }),
      prisma.workoutLog.findMany({
        where: { userId: user.id, completedAt: { not: null } },
        include: { exerciseLogs: { include: { sets: { select: { weight: true, reps: true } } } } },
      }),
    ]);

    let totalVolume = 0;
    for (const log of workoutLogs) {
      for (const el of log.exerciseLogs) {
        for (const s of el.sets) {
          totalVolume += s.weight * s.reps;
        }
      }
    }

    const level = user.streak?.level || 1;
    const totalXP = user.streak?.totalXP || 0;
    const xpPerLevel = 1000;
    const xpInCurrentLevel = totalXP % xpPerLevel;
    const xpToNext = xpPerLevel;

    return NextResponse.json({
      user: {
        ...user,
        followers: user._count.followers,
        following: user._count.following,
        workouts: user._count.workoutLogs,
        level,
        xp: xpInCurrentLevel,
        xpToNext,
        streak: user.streak?.currentStreak || 0,
        totalVolume,
        totalCardioKm: 0,
        prs: prs.map(p => ({ exerciseName: p.exercise.name, value: p.value, type: p.type })),
        achievements: userAchievements.map(ua => ({ icon: ua.achievement.icon, name: ua.achievement.name, unlocked: true })),
      },
      isFollowing,
      isPending,
      isOwnProfile: user.id === currentUserId,
      isBlocked: !!block,
      sharedWorkouts,
    });
  } catch (error: any) {
    console.error("GET /api/social/user error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
