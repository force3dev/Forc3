
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

const WEEKLY_CHALLENGES = [
  { title: 'Run 20km This Week 🏃', type: 'run_distance', target: 20, unit: 'km', description: 'Log 20km of running across any sessions this week.' },
  { title: 'Complete 4 Workouts 💪', type: 'workout_count', target: 4, unit: 'workouts', description: 'Complete 4 strength or cardio workouts this week.' },
  { title: 'Train 5 Days in a Row 🔥', type: 'streak', target: 5, unit: 'days', description: 'Build a 5-day training streak.' },
  { title: 'Lift 10,000 lbs Total 🏋️', type: 'lift_volume', target: 10000, unit: 'lbs', description: 'Accumulate 10,000 lbs of total training volume.' },
];

export async function GET() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Deactivate old
  await prisma.challenge.updateMany({ where: { endDate: { lt: monday } }, data: { isActive: false } });

  // Check if this week's challenges already exist
  const existing = await prisma.challenge.count({ where: { startDate: { gte: monday, lte: sunday } } });
  if (existing > 0) return NextResponse.json({ message: 'Already generated', count: existing });

  const created = await prisma.challenge.createMany({
    data: WEEKLY_CHALLENGES.map(c => ({
      ...c,
      startDate: monday,
      endDate: sunday,
      isActive: true,
    })),
  });

  return NextResponse.json({ created: created.count });
}
