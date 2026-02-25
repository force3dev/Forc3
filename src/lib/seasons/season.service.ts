import { prisma } from '@/lib/prisma'

export type SeasonRank = 'Rookie' | 'Athlete' | 'Competitor' | 'Elite' | 'Champion' | 'Legend'

export const RANK_THRESHOLDS: Record<SeasonRank, number> = {
  Rookie:     0,
  Athlete:    1000,
  Competitor: 3000,
  Elite:      7000,
  Champion:   15000,
  Legend:     30000,
}

export const RANK_COLORS: Record<SeasonRank, string> = {
  Rookie:     '#6b7280',
  Athlete:    '#22c55e',
  Competitor: '#3b82f6',
  Elite:      '#a855f7',
  Champion:   '#f59e0b',
  Legend:     '#ef4444',
}

export const RANK_EMOJIS: Record<SeasonRank, string> = {
  Rookie:     '🌱',
  Athlete:    '💪',
  Competitor: '🔥',
  Elite:      '⚡',
  Champion:   '👑',
  Legend:     '🏆',
}

export function getRankForXP(xp: number): SeasonRank {
  const ranks = Object.entries(RANK_THRESHOLDS) as [SeasonRank, number][]
  const sorted = ranks.sort((a, b) => b[1] - a[1])
  return sorted.find(([, threshold]) => xp >= threshold)?.[0] || 'Rookie'
}

export function getXPToNextRank(xp: number): { nextRank: SeasonRank | null; xpNeeded: number; progress: number } {
  const current = getRankForXP(xp)
  const ranks = Object.keys(RANK_THRESHOLDS) as SeasonRank[]
  const currentIndex = ranks.indexOf(current)

  if (currentIndex === ranks.length - 1) {
    return { nextRank: null, xpNeeded: 0, progress: 100 }
  }

  const nextRank = ranks[currentIndex + 1]
  const currentThreshold = RANK_THRESHOLDS[current]
  const nextThreshold = RANK_THRESHOLDS[nextRank]
  const xpInCurrentRank = xp - currentThreshold
  const xpNeededForNext = nextThreshold - currentThreshold

  return {
    nextRank,
    xpNeeded: nextThreshold - xp,
    progress: Math.round((xpInCurrentRank / xpNeededForNext) * 100),
  }
}

export async function getCurrentSeason() {
  const now = new Date()
  return prisma.season.findFirst({
    where: {
      startDate: { lte: now },
      endDate: { gte: now },
    }
  })
}

export async function getUserSeasonData(userId: string) {
  const season = await getCurrentSeason()
  if (!season) return null

  const seasonXP = await prisma.seasonXP.findUnique({
    where: { userId_seasonId: { userId, seasonId: season.id } }
  })

  const xp = seasonXP?.totalXP || 0
  const rank = getRankForXP(xp)
  const { nextRank, xpNeeded, progress } = getXPToNextRank(xp)

  const higherRanked = await prisma.seasonXP.count({
    where: { seasonId: season.id, totalXP: { gt: xp } }
  })

  return {
    season,
    xp,
    rank,
    rankColor: RANK_COLORS[rank],
    rankEmoji: RANK_EMOJIS[rank],
    nextRank,
    xpNeeded,
    progress,
    leaderboardPosition: higherRanked + 1,
  }
}
