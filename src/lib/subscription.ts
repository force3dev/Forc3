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
