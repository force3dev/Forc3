
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const metric = searchParams.get('metric') || 'workouts';
  const type = searchParams.get('type') || 'weekly';

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since = type === 'weekly' ? weekAgo : new Date(0);

  let entries: { userId: string; value: number }[] = [];

  if (metric === 'workouts') {
    const grouped = await prisma.workoutLog.groupBy({
      by: ['userId'],
      where: { completedAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 100,
    });
    entries = grouped.map(g => ({ userId: g.userId, value: g._count.id }));
  } else if (metric === 'streak') {
    const streaks = await prisma.streak.findMany({ orderBy: { currentStreak: 'desc' }, take: 100 });
    entries = streaks.map(s => ({ userId: s.userId, value: s.currentStreak }));
  }

  const userIds = entries.map(e => e.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true, username: true, avatarUrl: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const ranked = entries.map((e, i) => ({ rank: i + 1, user: userMap[e.userId], value: e.value }));
  const myRank = ranked.findIndex(r => r.user?.id === userId) + 1;

  return NextResponse.json({ entries: ranked, myRank: myRank || null, metric, type });
}
