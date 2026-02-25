import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — fetch comments for an activity
export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get("activityId");
    const type = searchParams.get("type");

    if (!activityId) return NextResponse.json({ error: "Missing activityId" }, { status: 400 });

    if (type === "comments") {
      const comments = await prisma.feedComment.findMany({
        where: { activityId },
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { displayName: true, username: true, avatarUrl: true } },
        },
      });
      return NextResponse.json({ comments });
    }

    // Return reactions summary
    const reactions = await prisma.reaction.groupBy({
      by: ["emoji"],
      where: { activityId },
      _count: { emoji: true },
    });

    const myReactions = await prisma.reaction.findMany({
      where: { activityId, userId },
      select: { emoji: true },
    });
    const myEmojiSet = new Set(myReactions.map(r => r.emoji));

    return NextResponse.json({
      reactions: reactions.map(r => ({
        emoji: r.emoji,
        count: r._count.emoji,
        reacted: myEmojiSet.has(r.emoji),
      })),
    });
  } catch (error: any) {
    console.error("GET /api/reactions error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

// POST — add reaction or comment
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { activityId, emoji, comment } = body;

    if (!activityId) return NextResponse.json({ error: "Missing activityId" }, { status: 400 });

    // Comment
    if (comment) {
      if (typeof comment !== "string" || !comment.trim()) {
        return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
      }
      const newComment = await prisma.feedComment.create({
        data: { activityId, userId, content: comment.trim().slice(0, 500) },
        include: { user: { select: { displayName: true, username: true, avatarUrl: true } } },
      });
      return NextResponse.json({ comment: newComment });
    }

    // Reaction — toggle
    if (emoji) {
      const existing = await prisma.reaction.findUnique({
        where: { activityId_userId_emoji: { activityId, userId, emoji } },
      });
      if (existing) {
        await prisma.reaction.delete({ where: { id: existing.id } });
        return NextResponse.json({ added: false });
      } else {
        await prisma.reaction.create({ data: { activityId, userId, emoji } });
        return NextResponse.json({ added: true });
      }
    }

    return NextResponse.json({ error: "Missing emoji or comment" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/reactions error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

// DELETE — remove reaction
export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { activityId, emoji } = body;

    if (!activityId || !emoji) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    await prisma.reaction.deleteMany({
      where: { activityId, userId, emoji },
    });

    return NextResponse.json({ removed: true });
  } catch (error: any) {
    console.error("DELETE /api/reactions error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
