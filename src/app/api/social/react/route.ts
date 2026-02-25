import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/session'
import { createNotification } from '@/lib/services/notification.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { activityId, emoji } = await request.json()

    const existing = await prisma.reaction.findUnique({
      where: { activityId_userId_emoji: { activityId, userId, emoji } }
    })

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } })
      return NextResponse.json({ reacted: false })
    }

    await prisma.reaction.create({ data: { activityId, userId, emoji } })

    // Notify activity owner
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { userId: true }
    })
    if (activity && activity.userId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true }
      })
      await createNotification(
        activity.userId,
        'reaction',
        `${emoji} ${user?.displayName || 'Someone'} reacted`,
        'reacted to your activity'
      )
    }

    return NextResponse.json({ reacted: true })
  } catch (error: any) {
    console.error('React error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
