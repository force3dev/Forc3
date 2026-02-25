import { useRef, useCallback } from 'react'

interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
}

export function useSwipeGesture(options: SwipeOptions) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const threshold = options.threshold || 50

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    }
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (Math.max(absDx, absDy) < threshold) return

    if (absDx > absDy) {
      if (dx > 0) options.onSwipeRight?.()
      else options.onSwipeLeft?.()
    } else {
      if (dy > 0) options.onSwipeDown?.()
      else options.onSwipeUp?.()
    }

    touchStart.current = null
  }, [options, threshold])

  return { onTouchStart, onTouchEnd }
}

export default useSwipeGesture
