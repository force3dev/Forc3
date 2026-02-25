import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all conversations for current user, ordered by lastMessageAt desc
  const convs = await prisma.conversation.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    include: {
      user1: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      user2: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  // Get unread count per conversation
  const unreadCounts = await prisma.message.groupBy({
    by: ["conversationId"],
    where: { receiverId: userId, read: false },
    _count: { id: true },
  });
  const unreadMap: Record<string, number> = {};
  for (const u of unreadCounts) unreadMap[u.conversationId] = u._count.id;

  const result = convs.map(c => {
    const other = c.user1Id === userId ? c.user2 : c.user1;
    return {
      id: c.id,
      other,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      unread: unreadMap[c.id] || 0,
    };
  });

  return NextResponse.json({ conversations: result });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId, content } = await request.json();
  if (!receiverId || !content?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (receiverId === userId) return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });

  // Get or create conversation (user1Id is always the smaller id lexicographically)
  const [u1, u2] = userId < receiverId ? [userId, receiverId] : [receiverId, userId];
  const conv = await prisma.conversation.upsert({
    where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    update: { lastMessage: content.slice(0, 100), lastMessageAt: new Date() },
    create: { user1Id: u1, user2Id: u2, lastMessage: content.slice(0, 100), lastMessageAt: new Date() },
  });

  const msg = await prisma.message.create({
    data: { conversationId: conv.id, senderId: userId, receiverId, content: content.slice(0, 2000) },
  });

  // Create notification for receiver
  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: "message",
      title: "New message",
      body: content.slice(0, 80),
      data: { senderId: userId },
    },
  }).catch(() => {});

  return NextResponse.json({ message: msg, conversationId: conv.id });
}
