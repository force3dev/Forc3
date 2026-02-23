
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { referrerId } = await req.json();
  if (!referrerId) return NextResponse.json({ error: 'referrerId required' }, { status: 400 });

  await prisma.user.update({
    where: { id: referrerId },
    data: { referralCredits: { increment: 1 } },
  });

  await prisma.referral.updateMany({
    where: { referrerId, referredId: userId },
    data: { status: 'converted', rewardGiven: true, convertedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
