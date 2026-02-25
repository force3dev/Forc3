import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/session'
import { getCurrentSeason, getRankForXP, RANK_EMOJIS } from '@/lib/seasons/season.service'

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const season = await getCurrentSeason()
    if (!season) return NextResponse.json({ entries: [] })

    const seasonXPs = await prisma.seasonXP.findMany({
      where: { seasonId: season.id },
      orderBy: { totalXP: 'desc' },
      take: 50,
    })

    const userIds = seasonXPs.map(s => s.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, displayName: true, username: true, avatarUrl: true },
    })

    const userMap = new Map(users.map(u => [u.id, u]))

    const entries = seasonXPs.map(s => {
      const user = userMap.get(s.userId)
      const rank = getRankForXP(s.totalXP)
      return {
        userId: s.userId,
        name: user?.displayName || user?.username || 'Athlete',
        avatarUrl: user?.avatarUrl,
        xp: s.totalXP,
        rank,
        rankEmoji: RANK_EMOJIS[rank],
        isMe: s.userId === userId,
      }
    })

    return NextResponse.json({ entries })
  } catch {
    return NextResponse.json({ error: 'Failed to get leaderboard' }, { status: 500 })
  }
}
