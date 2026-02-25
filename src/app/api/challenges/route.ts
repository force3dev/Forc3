
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const challenges = await prisma.challenge.findMany({
    where: { isActive: true },
    include: {
      entries: {
        orderBy: { progress: 'desc' },
        take: 10,
        include: { user: { select: { displayName: true, avatarUrl: true, username: true } } },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  const myEntries = await prisma.challengeEntry.findMany({
    where: { userId, challengeId: { in: challenges.map(c => c.id) } },
  });

  const myEntryMap = Object.fromEntries(myEntries.map(e => [e.challengeId, e]));

  return NextResponse.json({
    challenges: challenges.map(c => ({
      ...c,
      myEntry: myEntryMap[c.id] || null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // If creating a new challenge (has name and type fields)
  if (body.name && body.type) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (body.duration || 7));

    const challenge = await prisma.challenge.create({
      data: {
        title: body.name,
        description: `${body.type} challenge`,
        type: body.type,
        target: parseFloat(body.target) || 0,
        unit: body.type === 'volume' ? 'lbs' : body.type === 'workouts' ? 'workouts' : body.type === 'cardio' ? 'km' : 'days',
        startDate,
        endDate,
        isActive: true,
      },
    });

    // Creator auto-joins
    await prisma.challengeEntry.create({
      data: { challengeId: challenge.id, userId, progress: 0 },
    });

    // Invite opponents by username
    if (body.inviteUsernames?.length) {
      const usernames = body.inviteUsernames.filter((u: string) => u.trim());
      if (usernames.length > 0) {
        const invitedUsers = await prisma.user.findMany({
          where: { username: { in: usernames.map((u: string) => u.replace('@', '').trim()) } },
          select: { id: true },
        });
        for (const u of invitedUsers) {
          await prisma.challengeEntry.upsert({
            where: { challengeId_userId: { challengeId: challenge.id, userId: u.id } },
            create: { challengeId: challenge.id, userId: u.id, progress: 0 },
            update: {},
          });
        }
      }
    }

    return NextResponse.json({ challengeId: challenge.id });
  }

  // Otherwise, joining an existing challenge
  const { challengeId } = body;
  if (!challengeId) return NextResponse.json({ error: 'Missing challengeId' }, { status: 400 });

  const entry = await prisma.challengeEntry.upsert({
    where: { challengeId_userId: { challengeId, userId } },
    create: { challengeId, userId, progress: 0 },
    update: {},
  });

  return NextResponse.json({ entry });
}
