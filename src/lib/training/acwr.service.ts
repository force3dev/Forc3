import { prisma } from '@/lib/prisma'

interface WorkloadData {
  acuteLoad: number
  chronicLoad: number
  acwr: number
  status: 'undertrained' | 'optimal' | 'caution' | 'danger'
  message: string
  recommendation: string
}

export async function calculateACWR(userId: string): Promise<WorkloadData> {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)

  const [recentLogs, allLogs] = await Promise.all([
    prisma.workoutLog.findMany({
      where: { userId, completedAt: { gte: sevenDaysAgo } },
      include: { exerciseLogs: { include: { sets: true } } }
    }),
    prisma.workoutLog.findMany({
      where: { userId, completedAt: { gte: twentyEightDaysAgo } },
      include: { exerciseLogs: { include: { sets: true } } }
    }),
  ])

  // Calculate training load from actual volume (weight × reps × sets) + duration
  const calcLoad = (logs: typeof allLogs) =>
    logs.reduce((sum, log) => {
      const volume = log.exerciseLogs.reduce((v, el) =>
        v + el.sets.reduce((s, set) => s + (set.weight * set.reps), 0), 0)
      return sum + volume + (log.duration || 0) * 100
    }, 0)

  const acuteLoad = calcLoad(recentLogs)
  const chronicLoad = calcLoad(allLogs) / 4

  const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 1

  let status: WorkloadData['status']
  let message: string
  let recommendation: string

  if (acwr < 0.8) {
    status = 'undertrained'
    message = 'Training load is below your baseline'
    recommendation = 'You can safely increase training volume this week. Your body is under-stimulated relative to your chronic load.'
  } else if (acwr <= 1.3) {
    status = 'optimal'
    message = 'Training load is in the optimal zone'
    recommendation = 'Your acute workload is well-matched to your fitness base. This is where performance gains happen without injury risk.'
  } else if (acwr <= 1.5) {
    status = 'caution'
    message = 'Training spike detected — monitor recovery'
    recommendation = 'You\'ve ramped up quickly. Prioritize sleep, nutrition, and watch for early soreness or fatigue signs. Reduce volume if recovery drops.'
  } else {
    status = 'danger'
    message = 'High injury risk — significant load spike'
    recommendation = 'Your training has increased too fast. Research shows ACWR above 1.5 significantly increases soft tissue injury risk. Consider a down week.'
  }

  return { acuteLoad, chronicLoad, acwr: Math.round(acwr * 100) / 100, status, message, recommendation }
}
