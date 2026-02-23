export const XP_VALUES = {
  completeWorkout: 100,
  completeCardio: 75,
  logAllSets: 25,
  newPR: 150,
  sevenDayStreak: 200,
  thirtyDayStreak: 500,
  firstWorkout: 50,
  connectStrava: 50,
  completeOnboarding: 100,
} as const

export const LEVELS = [
  { level: 1, name: 'Rookie',     minXP: 0,     maxXP: 500 },
  { level: 2, name: 'Athlete',    minXP: 500,   maxXP: 1500 },
  { level: 3, name: 'Competitor', minXP: 1500,  maxXP: 3500 },
  { level: 4, name: 'Elite',      minXP: 3500,  maxXP: 7000 },
  { level: 5, name: 'Champion',   minXP: 7000,  maxXP: 15000 },
  { level: 6, name: 'Legend',     minXP: 15000, maxXP: Infinity },
] as const

export type Level = typeof LEVELS[number]

export function getLevelFromXP(xp: number): Level {
  const found = [...LEVELS].reverse().find(l => xp >= l.minXP)
  return found ?? LEVELS[0]
}

export function getXPProgressPercent(xp: number): number {
  const level = getLevelFromXP(xp)
  if (level.maxXP === Infinity) return 100
  return Math.min(100, ((xp - level.minXP) / (level.maxXP - level.minXP)) * 100)
}

export function getNextLevel(xp: number): Level | null {
  const current = getLevelFromXP(xp)
  const nextIndex = LEVELS.findIndex(l => l.level === current.level) + 1
  return nextIndex < LEVELS.length ? LEVELS[nextIndex] : null
}
