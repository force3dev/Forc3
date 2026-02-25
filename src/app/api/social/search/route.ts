import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) return NextResponse.json({ users: [] });

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          {
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              { displayName: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isPrivate: true,
        _count: { select: { followers: true } },
      },
      take: 20,
    });

    // Check follow status for each user
    const myFollowing = await prisma.follow.findMany({
      where: { followerId: userId, followingId: { in: users.map(u => u.id) } },
      select: { followingId: true },
    });
    const followingSet = new Set(myFollowing.map(f => f.followingId));

    const result = users.map(u => ({
      ...u,
      followerCount: u._count.followers,
      isFollowing: followingSet.has(u.id),
    }));

    return NextResponse.json({ users: result });
  } catch (error: any) {
    console.error("GET /api/social/search error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
