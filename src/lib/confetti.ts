import confetti from 'canvas-confetti'

export function celebrateWorkout() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
  })
}

export function celebratePR() {
  const end = Date.now() + 2000
  const interval = setInterval(() => {
    if (Date.now() > end) return clearInterval(interval)
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#f59e0b', '#fbbf24'],
    })
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#f59e0b', '#fbbf24'],
    })
  }, 250)
}
