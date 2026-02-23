
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const challenges = await prisma.challenge.findMany({
    where: { isActive: true },
    include: {
      entries: {
        orderBy: { progress: 'desc' },
        take: 10,
        include: { user: { select: { displayName: true, avatarUrl: true, username: true } } },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  const myEntries = await prisma.challengeEntry.findMany({
    where: { userId, challengeId: { in: challenges.map(c => c.id) } },
  });

  const myEntryMap = Object.fromEntries(myEntries.map(e => [e.challengeId, e]));

  return NextResponse.json({
    challenges: challenges.map(c => ({
      ...c,
      myEntry: myEntryMap[c.id] || null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { challengeId } = await req.json();

  const entry = await prisma.challengeEntry.upsert({
    where: { challengeId_userId: { challengeId, userId } },
    create: { challengeId, userId, progress: 0 },
    update: {},
  });

  return NextResponse.json({ entry });
}
