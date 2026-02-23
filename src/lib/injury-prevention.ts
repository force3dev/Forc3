import { prisma } from './prisma'

// ─── Injury Risk Analyzer ─────────────────────────────────────────────────────

interface InjuryFlagData {
  type: string
  severity: string
  muscle?: string
  message: string
}

export async function analyzeInjuryRisk(userId: string): Promise<InjuryFlagData[]> {
  const flags: InjuryFlagData[] = []
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // Get recent workout logs
  const [thisWeekLogs, lastWeekLogs, last7Days] = await Promise.all([
    prisma.workoutLog.findMany({
      where: { userId, completedAt: { gte: oneWeekAgo } },
      include: { exerciseLogs: { include: { sets: true } } },
    }),
    prisma.workoutLog.findMany({
      where: { userId, completedAt: { gte: twoWeeksAgo, lt: oneWeekAgo } },
      include: { exerciseLogs: { include: { sets: true } } },
    }),
    prisma.workoutLog.findMany({
      where: { userId, completedAt: { gte: oneWeekAgo } },
      orderBy: { completedAt: 'desc' },
    }),
  ])

  // Rule 1: Volume spike — this week > 130% of last week
  const thisWeekVolume = thisWeekLogs.reduce((acc, log) =>
    acc + log.exerciseLogs.reduce((a, el) =>
      a + el.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0), 0)
  const lastWeekVolume = lastWeekLogs.reduce((acc, log) =>
    acc + log.exerciseLogs.reduce((a, el) =>
      a + el.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0), 0)

  if (lastWeekVolume > 0 && thisWeekVolume > lastWeekVolume * 1.3) {
    const pct = Math.round((thisWeekVolume / lastWeekVolume - 1) * 100)
    flags.push({
      type: 'volume_spike',
      severity: pct > 50 ? 'alert' : 'warning',
      message: `Your training volume spiked ${pct}% this week vs last week. Consider backing off 10–20% to avoid overreach.`,
    })
  }

  // Rule 2: No rest day in 7 days
  const daysWithWorkouts = new Set(
    last7Days.map(l => l.completedAt?.toDateString()).filter(Boolean)
  )
  if (daysWithWorkouts.size >= 7) {
    flags.push({
      type: 'fatigue',
      severity: 'warning',
      message: `You've trained every day this week. Your body needs at least 1 rest day to recover and adapt.`,
    })
  }

  // Rule 3: 3+ hard sessions in a row
  const sortedLogs = last7Days
    .filter(l => l.completedAt)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())

  const consecutiveHard = sortedLogs.filter(l => (l.overallRpe ?? 0) >= 8).length
  if (consecutiveHard >= 3) {
    flags.push({
      type: 'fatigue',
      severity: 'warning',
      message: `${consecutiveHard} high-intensity sessions this week. Schedule an easy or rest day tomorrow — recovery is where gains happen.`,
    })
  }

  // Save flags to DB
  if (flags.length > 0) {
    await prisma.injuryFlag.createMany({
      data: flags.map(f => ({ ...f, userId })),
      skipDuplicates: false,
    })
  }

  return flags
}
