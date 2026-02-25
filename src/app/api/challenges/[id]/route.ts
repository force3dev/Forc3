import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/session'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: { progress: 'desc' },
        },
      },
    })

    if (!challenge) return NextResponse.json({ challenge: null })

    const participantUserIds = challenge.entries.map(e => e.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: participantUserIds } },
      select: { id: true, displayName: true, username: true },
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    const participants = challenge.entries.map(e => {
      const user = userMap.get(e.userId)
      return {
        userId: e.userId,
        name: user?.displayName || user?.username || 'Athlete',
        progress: e.progress,
        completed: e.completed,
        isMe: e.userId === userId,
      }
    })

    return NextResponse.json({ challenge, participants })
  } catch {
    return NextResponse.json({ error: 'Failed to get challenge' }, { status: 500 })
  }
}
