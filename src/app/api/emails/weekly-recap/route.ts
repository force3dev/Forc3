
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { weeklyRecapEmail } from '@/lib/email-templates';
export const dynamic = 'force-dynamic';

export async function GET() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    include: {
      profile: true,
      streak: true,
      workoutLogs: {
        where: { completedAt: { gte: weekAgo } },
        include: { exerciseLogs: { include: { sets: true } } },
      },
      personalRecords: { where: { achievedAt: { gte: weekAgo } } },
    },
    take: 1000,
  });

  let sent = 0;
  for (const user of users) {
    if (user.workoutLogs.length === 0) continue;
    try {
      const name = user.profile?.name || user.email.split('@')[0];
      const volume = user.workoutLogs.reduce((acc, log) =>
        acc + log.exerciseLogs.reduce((a, el) => a + el.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0), 0);
      const { subject, html } = weeklyRecapEmail(name, {
        workouts: user.workoutLogs.length,
        volume,
        streak: user.streak?.currentStreak || 0,
        prs: user.personalRecords.length,
      });
      await sendEmail({ to: user.email, subject, html });
      sent++;
    } catch {}
  }

  return NextResponse.json({ sent });
}
