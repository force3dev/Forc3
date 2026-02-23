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
}
