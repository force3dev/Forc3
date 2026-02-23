
import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const flags = await prisma.injuryFlag.findMany({
    where: { userId, acknowledged: false },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return NextResponse.json({ flags });
}
