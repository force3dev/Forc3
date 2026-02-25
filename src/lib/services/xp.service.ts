import { prisma } from '@/lib/prisma'

const LEVELS = [
  { level: 1, name: 'Rookie',     minXP: 0 },
  { level: 2, name: 'Athlete',    minXP: 500 },
  { level: 3, name: 'Competitor', minXP: 1500 },
  { level: 4, name: 'Elite',      minXP: 3000 },
  { level: 5, name: 'Champion',   minXP: 6000 },
  { level: 6, name: 'Legend',     minXP: 12000 },
]

export const XP_EVENTS = {
  COMPLETE_WORKOUT: 100,
  COMPLETE_CARDIO: 75,
  LOG_FOOD_ALL_MEALS: 50,
  HIT_PROTEIN_TARGET: 30,
  MORNING_CHECKIN: 20,
  NEW_PR: 150,
  STREAK_7: 200,
  STREAK_30: 500,
  STREAK_100: 1000,
  UNLOCK_ACHIEVEMENT: 100,
  COMPLETE_CHALLENGE: 250,
  FIRST_WORKOUT: 200,
  ONBOARDING_COMPLETE: 100,
}

export function getLevelFromXP(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      const nextLevel = LEVELS[i + 1]
      return {
        ...LEVELS[i],
        nextLevelXP: nextLevel?.minXP,
        progressToNext: nextLevel
          ? Math.round(((xp - LEVELS[i].minXP) / (nextLevel.minXP - LEVELS[i].minXP)) * 100)
          : 100,
        xpIntoLevel: xp - LEVELS[i].minXP,
        xpNeededForNext: nextLevel ? nextLevel.minXP - xp : 0,
      }
    }
  }
  return { ...LEVELS[0], nextLevelXP: LEVELS[1].minXP, progressToNext: 0, xpIntoLevel: 0, xpNeededForNext: LEVELS[1].minXP }
}

export async function awardXP(userId: string, event: keyof typeof XP_EVENTS, customAmount?: number) {
  const amount = customAmount ?? XP_EVENTS[event]

  // Use Streak model which has totalXP and level
  const existing = await prisma.streak.findUnique({ where: { userId } })
  const currentXP = existing?.totalXP ?? 0
  const newXP = currentXP + amount

  const oldLevel = getLevelFromXP(currentXP)
  const newLevel = getLevelFromXP(newXP)
  const leveledUp = newLevel.level > oldLevel.level

  await prisma.streak.upsert({
    where: { userId },
    update: { totalXP: newXP, level: newLevel.level },
    create: { userId, totalXP: newXP, level: newLevel.level },
  })

  return { xpAwarded: amount, newTotal: newXP, leveledUp, newLevel }
}
