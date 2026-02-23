// ─── Recovery Score Calculator ────────────────────────────────────────────────

export interface RecoveryInput {
  workoutsLast3Days: number
  hardWorkoutsLast3Days: number
  restDaysLast7Days: number
  consecutiveTrainingDays: number
  userReportedSleep?: number  // 1-10
  userReportedEnergy?: number // 1-10
}

export interface RecoveryResult {
  score: number // 0-100
  status: 'excellent' | 'good' | 'moderate' | 'low' | 'rest_needed'
  recommendation: string
}

export function calculateRecoveryScore(data: RecoveryInput): RecoveryResult {
  let score = 100

  // Deduct for recent training stress
  score -= data.hardWorkoutsLast3Days * 15
  score -= data.workoutsLast3Days * 8

  // Deduct for consecutive training days
  if (data.consecutiveTrainingDays >= 5) {
    score -= 20
  }

  // Add for rest days
  score += data.restDaysLast7Days * 10

  // Adjust for self-reported sleep
  if (data.userReportedSleep !== undefined) {
    // 1-10 scale: 8+ is good, below 5 is bad
    const sleepDelta = (data.userReportedSleep - 7) * 3
    score += sleepDelta
  }

  // Adjust for self-reported energy
  if (data.userReportedEnergy !== undefined) {
    const energyDelta = (data.userReportedEnergy - 6) * 2
    score += energyDelta
  }

  // Clamp 0-100
  score = Math.max(0, Math.min(100, Math.round(score)))

  let status: RecoveryResult['status']
  let recommendation: string

  if (score >= 85) {
    status = 'excellent'
    recommendation = 'You\'re fully recovered. Push hard today — this is your day to set PRs.'
  } else if (score >= 70) {
    status = 'good'
    recommendation = 'Good recovery. Train as planned. Focus on progressive overload.'
  } else if (score >= 55) {
    status = 'moderate'
    recommendation = 'Moderate fatigue detected. Consider scaling back intensity by 10-15%.'
  } else if (score >= 40) {
    status = 'low'
    recommendation = 'Recovery is low. Stick to easy cardio or active recovery only today.'
  } else {
    status = 'rest_needed'
    recommendation = 'Your body needs rest. Take the day off — growth happens in recovery.'
  }

  return { score, status, recommendation }
}
