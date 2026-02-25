export const haptics = {
  light: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10)
  },
  medium: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(25)
  },
  heavy: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([50, 10, 50])
  },
  success: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([10, 50, 10, 50, 80])
  },
  error: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([100, 30, 100])
  },
  selection: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(5)
  },
  timerComplete: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([0, 100, 50, 100, 50, 200])
  },
  prCelebration: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([50, 30, 50, 30, 50, 30, 200])
  },
  workoutComplete: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 100, 50, 300])
  },
  prAlert: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([50, 30, 100, 30, 200])
  },
  streakBroken: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([300])
  },
  levelUp: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 100, 50, 300])
  },
  swipe: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([15])
  },
}
