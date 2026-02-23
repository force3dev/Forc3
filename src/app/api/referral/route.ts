
import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, referralCredits: true, referralsSent: { select: { status: true } } },
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const totalReferrals = user.referralsSent.length;
  const converted = user.referralsSent.filter(r => r.status === 'converted').length;

  return NextResponse.json({
    code: user.referralCode || '',
    totalReferrals,
    converted,
    credits: user.referralCredits || 0,
  });
}
