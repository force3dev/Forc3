import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      subscription: true,
      streak: true,
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const workoutCount = await prisma.workoutLog.count({ where: { userId } });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    isPrivate: user.isPrivate,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    workoutsCount: workoutCount,
    profile: user.profile,
    subscription: user.subscription,
    streak: user.streak,
  });
}

export async function PATCH(req: NextRequest) {
  return updateProfile(req);
}

export async function PUT(req: NextRequest) {
  return updateProfile(req);
}

async function updateProfile(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    displayName,
    username,
    bio,
    avatarUrl,
    ...profileBody
  } = body || {};

  if (
    displayName !== undefined ||
    username !== undefined ||
    bio !== undefined ||
    avatarUrl !== undefined
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined ? { displayName: displayName || null } : {}),
        ...(username !== undefined ? { username: username || null } : {}),
        ...(bio !== undefined ? { bio: bio || null } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
      },
    });
  }

  const hasProfileFields = Object.keys(profileBody).length > 0;
  const profile = hasProfileFields
    ? await prisma.profile.upsert({
        where: { userId },
        update: profileBody,
        create: { userId, ...profileBody },
      })
    : await prisma.profile.findUnique({ where: { userId } });

  return NextResponse.json(profile);
}
