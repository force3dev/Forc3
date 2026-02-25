export type UnitSystem = 'imperial' | 'metric'

export function displayWeight(lbs: number, units: UnitSystem): string {
  if (units === 'metric') return `${(lbs / 2.205).toFixed(1)} kg`
  return `${lbs} lbs`
}

export function displayDistance(km: number, units: UnitSystem): string {
  if (units === 'imperial') return `${(km * 0.621).toFixed(2)} mi`
  return `${km.toFixed(1)} km`
}

export function displayPace(minutesPerKm: number, units: UnitSystem): string {
  if (units === 'imperial') {
    const minPerMile = minutesPerKm * 1.609
    const mins = Math.floor(minPerMile)
    const secs = Math.round((minPerMile - mins) * 60)
    return `${mins}:${secs.toString().padStart(2, '0')}/mi`
  }
  const mins = Math.floor(minutesPerKm)
  const secs = Math.round((minutesPerKm - mins) * 60)
  return `${mins}:${secs.toString().padStart(2, '0')}/km`
}

export function calculatePlates(totalWeight: number, barWeight = 45): number[] {
  const availablePlates = [45, 35, 25, 10, 5, 2.5]
  const weightPerSide = (totalWeight - barWeight) / 2
  if (weightPerSide <= 0) return []

  const plates: number[] = []
  let remaining = weightPerSide

  for (const plate of availablePlates) {
    while (remaining >= plate) {
      plates.push(plate)
      remaining -= plate
      remaining = Math.round(remaining * 100) / 100
    }
  }

  return plates
}
