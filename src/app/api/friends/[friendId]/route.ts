
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { friendId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await req.json(); // 'accept' | 'decline'
  const { friendId } = params;

  if (action === 'accept') {
    await prisma.friendship.update({
      where: { userId_friendId: { userId: friendId, friendId: userId } },
      data: { status: 'accepted' },
    });
    // Create reciprocal
    await prisma.friendship.upsert({
      where: { userId_friendId: { userId, friendId } },
      create: { userId, friendId, status: 'accepted' },
      update: { status: 'accepted' },
    });
  } else {
    await prisma.friendship.delete({ where: { userId_friendId: { userId: friendId, friendId: userId } } }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { friendId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { friendId } = params;
  await prisma.friendship.deleteMany({ where: { OR: [{ userId, friendId }, { userId: friendId, friendId: userId }] } });
  return NextResponse.json({ success: true });
}
