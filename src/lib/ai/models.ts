// Single source of truth for all AI model choices
// Change here and it updates everywhere

export const AI_MODELS = {
  // Cheapest - for quick structured tasks, JSON extraction, simple analysis
  FAST: 'claude-haiku-4-5-20251001',

  // Balanced - for user-facing responses that need to feel smart
  BALANCED: 'claude-sonnet-4-6',

  // Most capable - ONLY for one-time complex generation
  POWERFUL: 'claude-opus-4-20250514',
} as const

// Usage guide:
// FAST: NLP food parsing, memory extraction, injury flags, form cues, quick JSON, calorie estimation
// BALANCED: Coach chat, weekly reviews, workout swaps, program adaptation, meal plans, morning check-in messages, welcome messages
// POWERFUL: Initial program generation ONLY, race periodization planning
