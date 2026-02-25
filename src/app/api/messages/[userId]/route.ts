import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const otherUserId = params.userId;
  const [u1, u2] = currentUserId < otherUserId
    ? [currentUserId, otherUserId]
    : [otherUserId, currentUserId];

  const conv = await prisma.conversation.findUnique({
    where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    include: {
      user1: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      user2: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  if (!conv) {
    const other = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });
    return NextResponse.json({ messages: [], other, conversationId: null });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  await prisma.message.updateMany({
    where: { conversationId: conv.id, receiverId: currentUserId, read: false },
    data: { read: true },
  });

  const other = conv.user1Id === currentUserId ? conv.user2 : conv.user1;
  return NextResponse.json({ messages, other, conversationId: conv.id });
}
