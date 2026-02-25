'use client'
import { useState, useEffect, useCallback } from 'react'
import { UnitSystem, displayWeight, displayDistance, displayPace } from '@/lib/units'

export function useUnits() {
  const [units, setUnits] = useState<UnitSystem>('imperial')

  useEffect(() => {
    const stored = localStorage.getItem('forc3_units')
    if (stored === 'kg' || stored === 'metric') setUnits('metric')
    else setUnits('imperial')
  }, [])

  const toggleUnits = useCallback(() => {
    const next: UnitSystem = units === 'imperial' ? 'metric' : 'imperial'
    setUnits(next)
    localStorage.setItem('forc3_units', next === 'metric' ? 'kg' : 'lbs')
  }, [units])

  const weight = useCallback((lbs: number) => displayWeight(lbs, units), [units])
  const distance = useCallback((km: number) => displayDistance(km, units), [units])
  const pace = useCallback((minPerKm: number) => displayPace(minPerKm, units), [units])

  return { units, toggleUnits, weight, distance, pace }
}
