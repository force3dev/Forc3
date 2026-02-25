import { calculateRecoveryScore } from '@/lib/recovery-score'

describe('calculateRecoveryScore', () => {
  it('returns high score for good recovery conditions', () => {
    const result = calculateRecoveryScore({
      workoutsLast3Days: 0,
      hardWorkoutsLast3Days: 0,
      restDaysLast7Days: 4,
      consecutiveTrainingDays: 0,
      userReportedSleep: 9,
      userReportedEnergy: 9,
    })
    expect(result.score).toBeGreaterThan(80)
    expect(result.status).toBe('excellent')
  })

  it('returns low score for overtraining conditions', () => {
    const result = calculateRecoveryScore({
      workoutsLast3Days: 3,
      hardWorkoutsLast3Days: 3,
      restDaysLast7Days: 0,
      consecutiveTrainingDays: 7,
      userReportedSleep: 3,
      userReportedEnergy: 2,
    })
    expect(result.score).toBeLessThan(40)
  })

  it('always returns score between 0 and 100', () => {
    const cases = [
      { workoutsLast3Days: 3, hardWorkoutsLast3Days: 3, restDaysLast7Days: 0, consecutiveTrainingDays: 10, userReportedSleep: 1, userReportedEnergy: 1 },
      { workoutsLast3Days: 0, hardWorkoutsLast3Days: 0, restDaysLast7Days: 7, consecutiveTrainingDays: 0, userReportedSleep: 10, userReportedEnergy: 10 },
    ]
    for (const c of cases) {
      const result = calculateRecoveryScore(c)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    }
  })

  it('returns a recommendation string', () => {
    const result = calculateRecoveryScore({
      workoutsLast3Days: 2,
      hardWorkoutsLast3Days: 1,
      restDaysLast7Days: 2,
      consecutiveTrainingDays: 3,
    })
    expect(result.recommendation).toBeDefined()
    expect(result.recommendation.length).toBeGreaterThan(0)
  })

  it('returns a status string', () => {
    const result = calculateRecoveryScore({
      workoutsLast3Days: 1,
      hardWorkoutsLast3Days: 0,
      restDaysLast7Days: 3,
      consecutiveTrainingDays: 2,
    })
    expect(result.status).toBeDefined()
    expect(['excellent', 'good', 'moderate', 'low', 'rest_needed']).toContain(result.status)
  })
})
