import { prisma } from '@/lib/prisma'

export async function getUserTrainingPattern(userId: string): Promise<{
  preferredHour: number
  preferredDays: number[]
  avgWorkoutsPerWeek: number
}> {
  const logs = await prisma.workoutLog.findMany({
    where: { userId, completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    select: { completedAt: true }
  })

  if (logs.length < 3) {
    return { preferredHour: 17, preferredDays: [1, 3, 5], avgWorkoutsPerWeek: 3 }
  }

  const hourCounts: Record<number, number> = {}
  const dayCounts: Record<number, number> = {}

  for (const log of logs) {
    if (!log.completedAt) continue
    const date = new Date(log.completedAt)
    const hour = date.getHours()
    const day = date.getDay()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
    dayCounts[day] = (dayCounts[day] || 0) + 1
  }

  const preferredHour = parseInt(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '17')
  const preferredDays = Object.entries(dayCounts)
    .filter(([, count]) => count >= 2)
    .map(([day]) => parseInt(day))
    .sort()

  return {
    preferredHour,
    preferredDays,
    avgWorkoutsPerWeek: logs.length / 4,
  }
}
