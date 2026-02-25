import { prisma } from '@/lib/prisma'
import { awardXP } from './xp.service'
import { createNotification } from './notification.service'

export const ACHIEVEMENTS = [
  { code: 'first_workout',  title: 'First Step',        desc: 'Complete your first workout',           emoji: '🎯', xp: 200  },
  { code: 'streak_7',       title: 'Week Warrior',      desc: '7-day training streak',                  emoji: '🔥', xp: 200  },
  { code: 'streak_30',      title: 'Iron Discipline',   desc: '30-day training streak',                 emoji: '⚡', xp: 500  },
  { code: 'streak_100',     title: 'Century Club',      desc: '100-day training streak',                emoji: '💎', xp: 1000 },
  { code: 'workouts_10',    title: 'Getting Started',   desc: 'Complete 10 workouts',                   emoji: '💪', xp: 150  },
  { code: 'workouts_50',    title: 'Consistent',        desc: 'Complete 50 workouts',                   emoji: '🏋️', xp: 300  },
  { code: 'workouts_100',   title: 'Centurion',         desc: 'Complete 100 workouts',                  emoji: '🏆', xp: 500  },
  { code: 'first_pr',       title: 'New Heights',       desc: 'Set your first personal record',         emoji: '📈', xp: 150  },
  { code: 'pr_5',           title: 'Getting Stronger',  desc: 'Set 5 personal records',                 emoji: '🌟', xp: 250  },
  { code: 'run_10k',        title: '10K Club',          desc: 'Run 10km total',                         emoji: '🏃', xp: 200  },
  { code: 'run_100k',       title: 'Century Runner',    desc: 'Run 100km total',                        emoji: '🗺️', xp: 500  },
  { code: 'nutrition_week', title: 'Fueling Right',     desc: 'Hit protein target 7 days in a row',     emoji: '🥗', xp: 200  },
  { code: 'early_bird',     title: 'Early Bird',        desc: 'Complete 5 workouts before 7am',         emoji: '🌅', xp: 150  },
  { code: 'night_owl',      title: 'Night Owl',         desc: 'Complete 5 workouts after 9pm',          emoji: '🌙', xp: 150  },
  { code: 'social_10',      title: 'Community',         desc: 'Get 10 reactions on your posts',         emoji: '👥', xp: 100  },
]

async function ensureAchievement(code: string) {
  const ach = ACHIEVEMENTS.find(a => a.code === code)
  if (!ach) return null
  return prisma.achievement.upsert({
    where: { code },
    update: {},
    create: {
      code,
      name: ach.title,
      description: ach.desc,
      icon: ach.emoji,
      category: 'milestone',
      requirement: JSON.stringify({ code }),
      xpReward: ach.xp,
    }
  })
}

export async function checkAndAwardAchievements(userId: string): Promise<string[]> {
  const earned: string[] = []

  const [workoutLogs, personalRecords, streak, existing, cardioActivities, reactionCount] = await Promise.all([
    prisma.workoutLog.count({ where: { userId, completedAt: { not: null } } }),
    prisma.personalRecord.count({ where: { userId } }),
    prisma.streak.findUnique({ where: { userId } }),
    prisma.userAchievement.findMany({ where: { userId }, include: { achievement: { select: { code: true } } } }),
    prisma.cardioActivity.findMany({ where: { userId, type: 'run' }, select: { distance: true } }),
    prisma.reaction.count({
      where: { activity: { userId } },
    }),
  ])

  const unlockedCodes = new Set(existing.map(e => e.achievement?.code).filter(Boolean))
  const totalKmRun = cardioActivities.reduce((sum, log) => sum + ((log.distance || 0) / 1000), 0) // distance stored in meters

  // Check early bird (5 workouts before 7am) and night owl (5 after 9pm)
  let earlyBirdCount = 0
  let nightOwlCount = 0
  let nutritionWeekStreak = false

  if (!unlockedCodes.has('early_bird') || !unlockedCodes.has('night_owl')) {
    const allLogs = await prisma.workoutLog.findMany({
      where: { userId, completedAt: { not: null } },
      select: { startedAt: true },
    })
    earlyBirdCount = allLogs.filter(l => l.startedAt.getHours() < 7).length
    nightOwlCount = allLogs.filter(l => l.startedAt.getHours() >= 21).length
  }

  // Check nutrition_week (hit protein target 7 consecutive days)
  if (!unlockedCodes.has('nutrition_week')) {
    const target = await prisma.nutritionTarget.findUnique({ where: { userId } })
    if (target) {
      const last14Days = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      const dailyProtein = await prisma.nutritionLog.groupBy({
        by: ['date'],
        where: { userId, date: { gte: last14Days } },
        _sum: { protein: true },
        orderBy: { date: 'asc' },
      })

      let consecutiveDays = 0
      for (const day of dailyProtein) {
        if ((day._sum.protein || 0) >= target.protein) {
          consecutiveDays++
          if (consecutiveDays >= 7) { nutritionWeekStreak = true; break }
        } else {
          consecutiveDays = 0
        }
      }
    }
  }

  const checks: Record<string, boolean> = {
    first_workout: workoutLogs >= 1,
    streak_7: (streak?.longestStreak || 0) >= 7,
    streak_30: (streak?.longestStreak || 0) >= 30,
    streak_100: (streak?.longestStreak || 0) >= 100,
    workouts_10: workoutLogs >= 10,
    workouts_50: workoutLogs >= 50,
    workouts_100: workoutLogs >= 100,
    first_pr: personalRecords >= 1,
    pr_5: personalRecords >= 5,
    run_10k: totalKmRun >= 10,
    run_100k: totalKmRun >= 100,
    nutrition_week: nutritionWeekStreak,
    early_bird: earlyBirdCount >= 5,
    night_owl: nightOwlCount >= 5,
    social_10: reactionCount >= 10,
  }

  for (const [code, qualified] of Object.entries(checks)) {
    if (qualified && !unlockedCodes.has(code)) {
      try {
        const achievement = await ensureAchievement(code)
        if (!achievement) continue
        await prisma.userAchievement.create({ data: { userId, achievementId: achievement.id } })
        const achDef = ACHIEVEMENTS.find(a => a.code === code)!
        await awardXP(userId, 'UNLOCK_ACHIEVEMENT')
        await createNotification(userId, 'achievement', `${achDef.emoji} Achievement Unlocked!`, achDef.title)
        earned.push(code)
      } catch {
        // Already unlocked or constraint violation
      }
    }
  }

  return earned
}
