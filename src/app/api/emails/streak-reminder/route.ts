
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { streakAtRiskEmail } from '@/lib/email-templates';
export const dynamic = 'force-dynamic';

// Cron: runs daily at 6pm — sends streak reminder to users who haven't trained today
export async function GET() {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const streaks = await prisma.streak.findMany({
    where: { currentStreak: { gte: 3 }, lastWorkoutDate: { lt: today } },
    include: { user: { include: { profile: true } } },
    take: 500,
  });

  let sent = 0;
  for (const s of streaks) {
    try {
      const name = s.user.profile?.name || s.user.email.split('@')[0];
      const { subject, html } = streakAtRiskEmail(name, s.currentStreak);
      await sendEmail({ to: s.user.email, subject, html });
      sent++;
    } catch {}
  }

  return NextResponse.json({ sent });
}
