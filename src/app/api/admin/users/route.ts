
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;
  const tier = searchParams.get('tier');
  const search = searchParams.get('q');

  const where: Record<string, unknown> = {};
  if (tier) where.subscription = { tier };
  if (search) where.OR = [{ email: { contains: search, mode: 'insensitive' } }, { displayName: { contains: search, mode: 'insensitive' } }];

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { subscription: true, streak: true, _count: { select: { workoutLogs: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  const { userId, tier, suspended } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  if (tier !== undefined) {
    await prisma.subscription.update({ where: { userId }, data: { tier } });
  }

  return NextResponse.json({ success: true });
}
