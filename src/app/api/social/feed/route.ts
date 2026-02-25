import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { dbErrorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get IDs of users I follow
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);
    const feedUserIds = [userId, ...followingIds];

    const activities = await prisma.activity.findMany({
      where: {
        userId: { in: feedUserIds },
        isPublic: true,
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        reactions: {
          select: { emoji: true, userId: true },
        },
        feedComments: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Summarize reactions per activity
    const enriched = activities.map(act => {
      const reactionMap: Record<string, { count: number; reacted: boolean }> = {};
      for (const r of act.reactions) {
        if (!reactionMap[r.emoji]) reactionMap[r.emoji] = { count: 0, reacted: false };
        reactionMap[r.emoji].count++;
        if (r.userId === userId) reactionMap[r.emoji].reacted = true;
      }
      return {
        id: act.id,
        type: act.type,
        data: act.data,
        createdAt: act.createdAt,
        user: act.user,
        reactions: Object.entries(reactionMap).map(([emoji, { count, reacted }]) => ({
          emoji, count, reacted,
        })),
        commentCount: act.feedComments.length,
      };
    });

    return NextResponse.json({ activities: enriched });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
