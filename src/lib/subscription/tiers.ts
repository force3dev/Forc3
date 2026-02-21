// ─── Tier Definitions ─────────────────────────────────────────────────────────

export type SubscriptionTier = "free" | "pro" | "elite";

export type Feature =
  | "analytics"         // Charts & analytics page
  | "weekly_report"     // Weekly adaptive engine
  | "exercise_swap"     // AI exercise swap
  | "progression"       // Progression engine suggestions
  | "history_unlimited" // Unlimited history (free: 30 logs)
  | "plate_calculator"  // Plate calculator (always free)
  | "nutrition_logging" // Nutrition logging (free: 7 logs/week)
  | "custom_plan"       // Custom plan editing
  | "export"            // Data export
  | "priority_support"; // Priority support

const TIER_FEATURES: Record<SubscriptionTier, Feature[]> = {
  free: ["plate_calculator", "progression", "nutrition_logging"],
  pro: [
    "plate_calculator", "progression", "nutrition_logging",
    "analytics", "weekly_report", "exercise_swap",
    "history_unlimited", "custom_plan",
  ],
  elite: [
    "plate_calculator", "progression", "nutrition_logging",
    "analytics", "weekly_report", "exercise_swap",
    "history_unlimited", "custom_plan", "export", "priority_support",
  ],
};

export function canAccess(tier: SubscriptionTier, feature: Feature): boolean {
  return TIER_FEATURES[tier].includes(feature);
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

export const PLANS = {
  pro: {
    name: "Pro",
    price: 9.99,
    interval: "month" as const,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || "",
    features: [
      "Analytics & charts",
      "Weekly adaptive engine",
      "AI exercise swap",
      "Unlimited history",
      "Custom plan editing",
    ],
  },
  elite: {
    name: "Elite",
    price: 19.99,
    interval: "month" as const,
    stripePriceId: process.env.STRIPE_ELITE_PRICE_ID || "",
    features: [
      "Everything in Pro",
      "Data export (CSV/PDF)",
      "Priority support",
      "Early access to new features",
    ],
  },
} as const;

export const TRIAL_DAYS = 7;
