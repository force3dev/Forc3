import { AI_MODELS } from '@/lib/ai/models'

// Runs daily/weekly jobs — called by Vercel cron or manual trigger

export async function runDailyJobs() {
  console.log('Running daily jobs...')
  await Promise.allSettled([
    checkExpiredStreaks(),
    sendStreakRiskNotifications(),
    updateChallengeProgress(),
    cleanExpiredNutritionCache(),
  ])
}

export async function runWeeklyJobs() {
  console.log('Running weekly jobs...')
  await Promise.allSettled([
    sendWeeklyRecapEmails(),
    generateWeeklyAIReview(),
    refreshWeeklyChallenges(),
  ])
}

async function checkExpiredStreaks() {
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
  twoDaysAgo.setHours(0, 0, 0, 0)

  const { prisma } = await import('@/lib/prisma')

  await prisma.streak.updateMany({
    where: {
      currentStreak: { gt: 0 },
      lastWorkoutDate: { lt: twoDaysAgo }
    },
    data: { currentStreak: 0 }
  })
}

async function sendStreakRiskNotifications() {
  const { prisma } = await import('@/lib/prisma')
  const { createNotification } = await import('@/lib/services/notification.service')

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const yesterdayEnd = new Date(yesterday)
  yesterdayEnd.setHours(23, 59, 59, 999)

  const atRisk = await prisma.streak.findMany({
    where: {
      currentStreak: { gte: 3 },
      lastWorkoutDate: { gte: yesterday, lte: yesterdayEnd }
    },
    select: { userId: true, currentStreak: true }
  })

  for (const { userId, currentStreak } of atRisk) {
    await createNotification(
      userId, 'streak',
      '🔥 Streak at risk!',
      `Train today to keep your ${currentStreak}-day streak alive!`
    )
  }
}

async function updateChallengeProgress() {
  const { prisma } = await import('@/lib/prisma')

  const activeChallenges = await prisma.challenge.findMany({
    where: { isActive: true, endDate: { gte: new Date() } },
    include: { entries: { where: { completed: false } } },
  })

  for (const challenge of activeChallenges) {
    for (const entry of challenge.entries) {
      let progress = 0

      if (challenge.type === 'volume' || challenge.type === 'lift_volume' || challenge.type === 'volume_kg') {
        const logs = await prisma.workoutLog.findMany({
          where: { userId: entry.userId, completedAt: { gte: challenge.startDate, lte: challenge.endDate } },
          include: { exerciseLogs: { include: { sets: true } } },
        })
        progress = logs.reduce((acc, log) =>
          acc + log.exerciseLogs.reduce((a, el) =>
            a + el.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0), 0)
      } else if (challenge.type === 'distance' || challenge.type === 'cardio_km') {
        const activities = await prisma.cardioActivity.findMany({
          where: { userId: entry.userId, completed: true, completedAt: { gte: challenge.startDate, lte: challenge.endDate } },
        })
        progress = activities.reduce((sum, a) => sum + ((a.distance || 0) / 1000), 0)
      } else if (challenge.type === 'frequency' || challenge.type === 'workout_count') {
        progress = await prisma.workoutLog.count({
          where: { userId: entry.userId, completedAt: { gte: challenge.startDate, lte: challenge.endDate, not: null } },
        })
      } else if (challenge.type === 'streak_days' || challenge.type === 'streak') {
        const streak = await prisma.streak.findUnique({ where: { userId: entry.userId } })
        progress = streak?.currentStreak || 0
      } else if (challenge.type === 'protein_days') {
        const target = await prisma.nutritionTarget.findUnique({ where: { userId: entry.userId } })
        if (target) {
          const days = await prisma.nutritionLog.groupBy({
            by: ['date'],
            where: { userId: entry.userId, date: { gte: challenge.startDate, lte: challenge.endDate } },
            _sum: { protein: true },
            having: { protein: { _sum: { gte: target.protein } } },
          })
          progress = days.length
        }
      }

      const completed = progress >= challenge.target
      await prisma.challengeEntry.update({
        where: { id: entry.id },
        data: { progress, completed, ...(completed ? { completedAt: new Date() } : {}) },
      })
    }
  }

  // Also deactivate expired challenges
  await prisma.challenge.updateMany({
    where: { endDate: { lt: new Date() }, isActive: true },
    data: { isActive: false },
  })
}

async function cleanExpiredNutritionCache() {
  const { prisma } = await import('@/lib/prisma')
  await prisma.nutritionCache.deleteMany({ where: { expiresAt: { lt: new Date() } } })
}

async function sendWeeklyRecapEmails() {
  const { prisma } = await import('@/lib/prisma')
  const { sendEmail } = await import('@/lib/email')
  const { weeklyRecapEmail } = await import('@/lib/email-templates')

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const users = await prisma.user.findMany({
    include: {
      profile: true,
      streak: true,
      workoutLogs: {
        where: { completedAt: { gte: weekAgo } },
        include: { exerciseLogs: { include: { sets: true } } },
      },
      personalRecords: { where: { achievedAt: { gte: weekAgo } } },
    },
    take: 1000,
  })

  for (const user of users) {
    if (user.workoutLogs.length === 0) continue
    try {
      const name = user.profile?.name || user.email.split('@')[0]
      const volume = user.workoutLogs.reduce((acc, log) =>
        acc + log.exerciseLogs.reduce((a, el) =>
          a + el.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0), 0)
      const { subject, html } = weeklyRecapEmail(name, {
        workouts: user.workoutLogs.length,
        volume,
        streak: user.streak?.currentStreak || 0,
        prs: user.personalRecords.length,
      })
      await sendEmail({ to: user.email, subject, html })
    } catch {
      // Skip individual user errors
    }
  }
}

async function generateWeeklyAIReview() {
  const { prisma } = await import('@/lib/prisma')
  const { createNotification } = await import('@/lib/services/notification.service')

  const key = process.env.CLAUDE_API_KEY
  if (!key) return

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Get users who trained this week
  const activeUserIds = await prisma.workoutLog.findMany({
    where: { completedAt: { gte: weekAgo, not: null } },
    select: { userId: true },
    distinct: ['userId'],
  })

  for (const { userId } of activeUserIds.slice(0, 100)) {
    try {
      const [profile, logs, prs] = await Promise.all([
        prisma.profile.findUnique({ where: { userId } }),
        prisma.workoutLog.findMany({
          where: { userId, completedAt: { gte: weekAgo, not: null } },
          include: { workout: { select: { name: true } } },
        }),
        prisma.personalRecord.findMany({
          where: { userId, achievedAt: { gte: weekAgo } },
          include: { exercise: { select: { name: true } } },
        }),
      ])

      const plannedDays = profile?.trainingDays || 4
      const completed = logs.length
      const completionRate = Math.round((completed / plannedDays) * 100)
      const athleteName = profile?.name?.split(' ')[0] || 'Athlete'

      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: key })
      const resp = await client.messages.create({
        model: AI_MODELS.FAST,
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `Write a 2-sentence weekly review for ${athleteName}. They completed ${completed}/${plannedDays} planned workouts (${completionRate}%) and set ${prs.length} PRs. Be encouraging but honest. Keep it under 50 words.`,
        }],
      })

      const review = resp.content[0].type === 'text' ? resp.content[0].text : null
      if (review) {
        await createNotification(userId, 'weekly_review', 'Your Weekly Review', review)
      }
    } catch {
      // Skip individual user errors
    }
  }
}

async function refreshWeeklyChallenges() {
  const { prisma } = await import('@/lib/prisma')

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  // Check if this week already has active challenges
  const existing = await prisma.challenge.count({
    where: { startDate: { gte: weekStart }, isActive: true },
  })
  if (existing > 0) return

  // Deactivate old challenges
  await prisma.challenge.updateMany({
    where: { endDate: { lt: now }, isActive: true },
    data: { isActive: false },
  })

  // Rotate through challenge templates
  const weekNumber = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
  const templates = [
    [
      { title: 'Volume King', description: 'Lift 30,000 lbs this week', type: 'volume', target: 30000, unit: 'lbs' },
      { title: 'Run Club', description: 'Run 20km this week', type: 'distance', target: 20, unit: 'km' },
      { title: 'Consistency King', description: 'Train 5 days this week', type: 'frequency', target: 5, unit: 'days' },
    ],
    [
      { title: 'Heavy Hitter', description: 'Lift 50,000 lbs this week', type: 'volume', target: 50000, unit: 'lbs' },
      { title: 'Sprint Specialist', description: 'Log 10km of running', type: 'distance', target: 10, unit: 'km' },
      { title: 'Streak Builder', description: 'Train 4 days in a row', type: 'streak', target: 4, unit: 'days' },
    ],
    [
      { title: 'Iron Week', description: 'Complete 6 workouts this week', type: 'frequency', target: 6, unit: 'days' },
      { title: 'Cardio Crusher', description: 'Run 30km this week', type: 'distance', target: 30, unit: 'km' },
      { title: 'PR Hunter', description: 'Set 2 personal records', type: 'frequency', target: 2, unit: 'prs' },
    ],
    [
      { title: 'Protein Champion', description: 'Hit protein target 5 days', type: 'protein_days', target: 5, unit: 'days' },
      { title: 'Volume Beast', description: 'Lift 40,000 lbs this week', type: 'volume', target: 40000, unit: 'lbs' },
      { title: 'Marathon Month', description: 'Run 25km this week', type: 'distance', target: 25, unit: 'km' },
    ],
  ]

  const batch = templates[weekNumber % templates.length]

  await prisma.challenge.createMany({
    skipDuplicates: true,
    data: batch.map(t => ({ ...t, startDate: weekStart, endDate: weekEnd })),
  })
}
