// ─── TDEE + Macro Calculator ──────────────────────────────────────────────────

export function calculateTDEE(user: {
  weight: number   // kg
  height: number   // cm
  age: number
  gender: 'male' | 'female'
  activityLevel: string
}): number {
  // Mifflin-St Jeor BMR
  let bmr: number
  if (user.gender === 'male') {
    bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5
  } else {
    bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161
  }

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  }

  return Math.round(bmr * (multipliers[user.activityLevel] ?? 1.55))
}

export function calculateMacros(tdee: number, phase: string, weightKg: number) {
  let calories = tdee
  if (phase === 'cut') calories = tdee - 400
  if (phase === 'bulk') calories = tdee + 300

  // High protein for hybrid athletes
  const protein = Math.round(weightKg * 2.2)      // 2.2g/kg
  const fat = Math.round((calories * 0.25) / 9)
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4)

  return { calories, protein, carbs, fat }
}
