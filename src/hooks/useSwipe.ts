"use client";
import { useRef, useEffect } from "react";

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 60 }: UseSwipeOptions) {
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
    }

    function onTouchEnd(e: TouchEvent) {
      if (startXRef.current === null || startYRef.current === null) return;
      const dx = e.changedTouches[0].clientX - startXRef.current;
      const dy = e.changedTouches[0].clientY - startYRef.current;
      // Only count horizontal swipes (dx must dominate)
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
      }
      startXRef.current = null;
      startYRef.current = null;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold]);
}
