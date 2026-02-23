// ─── Taper Calculator ─────────────────────────────────────────────────────────

const TAPER_WEEKS: Record<string, number> = {
  '5k': 1,
  '10k': 1,
  half_marathon: 2,
  marathon: 3,
  sprint_triathlon: 1,
  olympic_triathlon: 2,
  half_ironman: 2,
  ironman: 3,
  spartan: 1,
}

export function calculateTaper(raceDate: Date, raceType: string) {
  const weeksOut = TAPER_WEEKS[raceType] ?? 2
  const taperStart = new Date(raceDate)
  taperStart.setDate(taperStart.getDate() - weeksOut * 7)

  // Volume reduction: e.g. for 3-week taper: [70%, 50%, 30%]
  const volumeReduction = [0.7, 0.5, 0.3].slice(0, weeksOut)

  return {
    taperStart,
    weeksOfTaper: weeksOut,
    volumeReduction,
  }
}

export function getRacePhase(raceDate: Date, raceType: string): string {
  const now = new Date()
  const daysUntilRace = Math.floor((raceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const { weeksOfTaper } = calculateTaper(raceDate, raceType)

  if (daysUntilRace < 0) return 'post_race'
  if (daysUntilRace === 0) return 'race_day'
  if (daysUntilRace <= 7) return 'race_week'
  if (daysUntilRace <= weeksOfTaper * 7) return 'taper'
  if (daysUntilRace <= weeksOfTaper * 7 + 7) return 'peak'
  if (daysUntilRace <= 8 * 7) return 'build'
  return 'base'
}

export function getRacePhaseName(phase: string): string {
  const names: Record<string, string> = {
    base: 'Base Building',
    build: 'Build Phase',
    peak: 'Peak Week',
    taper: 'Taper',
    race_week: 'Race Week',
    race_day: 'Race Day',
    post_race: 'Recovery',
  }
  return names[phase] ?? phase
}
