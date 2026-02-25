'use client'
import { useEffect, useState } from 'react'

export function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const step = value / (duration / 16)
    let current = 0

    const timer = setInterval(() => {
      current += step
      if (current >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(current))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value, duration])

  return <>{display.toLocaleString()}</>
}

export default AnimatedNumber
