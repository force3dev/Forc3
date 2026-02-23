
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const today = new Date(now); today.setHours(0, 0, 0, 0);

  const [
    totalUsers, premiumUsers, newUsersThisWeek,
    totalWorkouts, workoutsThisWeek,
    activeToday, activeThisWeek,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { tier: { not: 'free' } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.workoutLog.count({ where: { completedAt: { not: null } } }),
    prisma.workoutLog.count({ where: { completedAt: { gte: weekAgo } } }),
    prisma.workoutLog.groupBy({ by: ['userId'], where: { completedAt: { gte: today } } }).then(r => r.length),
    prisma.workoutLog.groupBy({ by: ['userId'], where: { completedAt: { gte: weekAgo } } }).then(r => r.length),
  ]);

  const mrr = premiumUsers * 14.99;
  const avgWorkoutsPerUser = totalUsers > 0 ? (workoutsThisWeek / Math.max(activeThisWeek, 1)).toFixed(1) : '0';

  return NextResponse.json({
    totalUsers,
    premiumUsers,
    newUsersThisWeek,
    totalWorkouts,
    workoutsThisWeek,
    activeToday,
    activeThisWeek,
    mrr: Math.round(mrr * 100) / 100,
    avgWorkoutsPerUser,
  });
}
