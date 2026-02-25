// ─── Subscription Feature Gating ──────────────────────────────────────────────
// Wraps existing tier system with hybrid-athlete feature checks

export type SubscriptionTier = 'free' | 'premium'

// Map existing tiers (free/pro/elite) to simple free/premium
export function toSimpleTier(tier: string): SubscriptionTier {
  return tier === 'free' ? 'free' : 'premium'
}

export const LIMITS = {
  free: {
    aiMessagesPerDay: 1,
    canCustomizeWorkouts: false,
    canAccessRaceProgramming: false,
    canAccessNutritionAI: false,
    canAccessRecoveryScore: false,
    canAccessUnlimitedChat: false,
    canSwapExercises: false,
  },
  premium: {
    aiMessagesPerDay: 999,
    canCustomizeWorkouts: true,
    canAccessRaceProgramming: true,
    canAccessNutritionAI: true,
    canAccessRecoveryScore: true,
    canAccessUnlimitedChat: true,
    canSwapExercises: true,
  },
} as const

export function canUseFeature(
  tier: SubscriptionTier,
  feature: keyof typeof LIMITS.free
): boolean {
  return LIMITS[tier][feature] as boolean
}

export function getRemainingMessages(
  tier: SubscriptionTier,
  usedToday: number
): number {
  return Math.max(0, LIMITS[tier].aiMessagesPerDay - usedToday)
}

// Server-side premium check using Prisma
export async function isPremiumUser(userId: string): Promise<boolean> {
  // Dynamic import to avoid circular deps in client code
  const { prisma } = await import('@/lib/prisma')

  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { tier: true, status: true, trialEnd: true }
  })

  if (!sub) return false
  if (sub.tier !== 'free' && sub.status === 'active') return true
  if (sub.trialEnd && new Date(sub.trialEnd) > new Date()) return true

  return false
}
