
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    if (!q || q.length < 2) return NextResponse.json({ results: [] });

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          { displayName: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
        ],
        isPrivate: false,
      },
      select: { id: true, displayName: true, username: true, avatarUrl: true, streak: { select: { currentStreak: true } } },
      take: 20,
    });

    return NextResponse.json({ results: users });
  } catch (error: any) {
    console.error("GET /api/friends/search error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
