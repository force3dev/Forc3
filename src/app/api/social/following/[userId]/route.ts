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

  try {
    const page = Math.max(1, Number(new URL(req.url).searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, Number(new URL(req.url).searchParams.get("limit") || "25")));
    const skip = (page - 1) * limit;

    const [total, following, myFollowing] = await Promise.all([
      prisma.follow.count({ where: { followerId: params.userId } }),
      prisma.follow.findMany({
        where: { followerId: params.userId },
        include: {
          following: {
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
    const items = following.map((row) => ({
      id: row.following.id,
      username: row.following.username,
      name: row.following.displayName || row.following.username || "Athlete",
      avatarUrl: row.following.avatarUrl,
      level: row.following.streak?.level || 1,
      streak: row.following.streak?.currentStreak || 0,
      isFollowing: followingSet.has(row.following.id),
    }));

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    });
  } catch (error: any) {
    console.error("GET /api/social/following/[userId] error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
