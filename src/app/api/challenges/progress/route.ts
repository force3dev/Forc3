
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1); weekStart.setHours(0,0,0,0);

  const challenges = await prisma.challenge.findMany({ where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } } });

  for (const challenge of challenges) {
    let progress = 0;

    if (challenge.type === 'workout_count') {
      progress = await prisma.workoutLog.count({ where: { userId, completedAt: { gte: weekStart } } });
    } else if (challenge.type === 'lift_volume') {
      const logs = await prisma.workoutLog.findMany({
        where: { userId, completedAt: { gte: weekStart } },
        include: { exerciseLogs: { include: { sets: true } } },
      });
      progress = logs.reduce((acc, log) => acc + log.exerciseLogs.reduce((a, el) => a + el.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0), 0);
    } else if (challenge.type === 'run_distance') {
      const cardio = await prisma.cardioActivity.findMany({ where: { userId, completed: true, completedAt: { gte: weekStart }, type: { in: ['run', 'running'] } } });
      progress = cardio.reduce((acc, c) => acc + (c.distance || 0) / 1000, 0); // meters to km
    }

    const completed = progress >= challenge.target;
    await prisma.challengeEntry.upsert({
      where: { challengeId_userId: { challengeId: challenge.id, userId } },
      create: { challengeId: challenge.id, userId, progress, completed, completedAt: completed ? new Date() : null },
      update: { progress, completed: completed || undefined, completedAt: completed ? new Date() : undefined },
    });
  }

  return NextResponse.json({ updated: challenges.length });
}
