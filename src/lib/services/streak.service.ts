import { prisma } from '@/lib/prisma'

export async function updateStreak(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const streak = await prisma.streak.findUnique({ where: { userId } })

  if (!streak) {
    return prisma.streak.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastWorkoutDate: new Date() }
    })
  }

  const lastDate = streak.lastWorkoutDate ? new Date(streak.lastWorkoutDate) : null
  if (lastDate) lastDate.setHours(0, 0, 0, 0)

  const isToday = lastDate?.getTime() === today.getTime()
  const isYesterday = lastDate?.getTime() === yesterday.getTime()

  if (isToday) return streak // Already counted today

  const newCurrent = isYesterday ? streak.currentStreak + 1 : 1
  const newLongest = Math.max(streak.longestStreak, newCurrent)

  return prisma.streak.update({
    where: { userId },
    data: { currentStreak: newCurrent, longestStreak: newLongest, lastWorkoutDate: new Date(), totalWorkouts: { increment: 1 } }
  })
}

export async function getStreak(userId: string) {
  const streak = await prisma.streak.findUnique({ where: { userId } })
  if (!streak) return { current: 0, longest: 0, isAtRisk: false }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const lastDate = streak.lastWorkoutDate ? new Date(streak.lastWorkoutDate) : null
  if (lastDate) lastDate.setHours(0, 0, 0, 0)

  const isActive = lastDate?.getTime() === today.getTime() || lastDate?.getTime() === yesterday.getTime()

  return {
    current: isActive ? streak.currentStreak : 0,
    longest: streak.longestStreak,
    lastTrainedAt: streak.lastWorkoutDate,
    isAtRisk: lastDate?.getTime() === yesterday.getTime(),
  }
}
