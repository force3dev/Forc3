
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ userId, status: 'accepted' }, { friendId: userId, status: 'accepted' }] },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true, username: true, streak: true } },
      friend: { select: { id: true, displayName: true, avatarUrl: true, username: true, streak: true } },
    },
  });

  const friends = friendships.map(f => f.userId === userId ? f.friend : f.user);
  return NextResponse.json({ friends });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { friendId } = await req.json();
  if (!friendId || friendId === userId) return NextResponse.json({ error: 'Invalid friendId' }, { status: 400 });

  const friendship = await prisma.friendship.upsert({
    where: { userId_friendId: { userId, friendId } },
    create: { userId, friendId, status: 'pending' },
    update: {},
  });

  return NextResponse.json({ friendship });
}
