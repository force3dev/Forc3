import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = Math.max(1, Number(new URL(req.url).searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, Number(new URL(req.url).searchParams.get("limit") || "25")));
  const skip = (page - 1) * limit;

  const [total, followers, myFollowing] = await Promise.all([
    prisma.follow.count({ where: { followingId: params.userId } }),
    prisma.follow.findMany({
      where: { followingId: params.userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            streak: { select: { currentStreak: true, level: true } },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    }),
  ]);

  const followingSet = new Set(myFollowing.map((f) => f.followingId));
  const items = followers.map((row) => ({
    id: row.follower.id,
    username: row.follower.username,
    name: row.follower.displayName || row.follower.username || "Athlete",
    avatarUrl: row.follower.avatarUrl,
    level: row.follower.streak?.level || 1,
    streak: row.follower.streak?.currentStreak || 0,
    isFollowing: followingSet.has(row.follower.id),
  }));

  return NextResponse.json({
    items,
    total,
    page,
    limit,
    hasMore: skip + items.length < total,
  });
}
