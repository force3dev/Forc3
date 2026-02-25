import { calculateNextWeight } from '@/lib/progressive-overload'

describe('calculateNextWeight', () => {
  it('increases weight when all reps hit', () => {
    const result = calculateNextWeight('Bench Press', 185, 3, 3, [8, 8, 8], 8)
    expect(result.change).toBe('increase')
    expect(result.nextWeight).toBeGreaterThan(185)
  })

  it('decreases weight when reps badly missed', () => {
    const result = calculateNextWeight('Bench Press', 185, 3, 3, [4, 3, 4], 8)
    expect(result.change).toBe('decrease')
    expect(result.nextWeight).toBeLessThan(185)
  })

  it('maintains weight when close but not all reps hit', () => {
    const result = calculateNextWeight('Bench Press', 185, 3, 3, [7, 7, 6], 8)
    expect(result.change).toBe('maintain')
    expect(result.nextWeight).toBe(185)
  })

  it('always returns a positive weight', () => {
    const result = calculateNextWeight('Curl', 10, 1, 3, [2], 10)
    expect(result.nextWeight).toBeGreaterThan(0)
  })

  it('returns a reason string', () => {
    const result = calculateNextWeight('Squat', 225, 3, 3, [5, 5, 5], 5)
    expect(result.reason).toBeDefined()
    expect(result.reason.length).toBeGreaterThan(0)
  })
})
