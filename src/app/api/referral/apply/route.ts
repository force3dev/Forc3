
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { referralCode } = await req.json();
  if (!referralCode) return NextResponse.json({ error: 'referralCode required' }, { status: 400 });

  const referrer = await prisma.user.findUnique({ where: { referralCode } });
  if (!referrer) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });

  await prisma.user.update({ where: { id: userId }, data: { referredBy: referralCode } });
  await prisma.referral.create({
    data: { referrerId: referrer.id, referredId: userId, referralCode, status: 'signed_up' },
  }).catch(() => {});

  // Extend trial
  await prisma.subscription.update({
    where: { userId },
    data: { trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
