'use client'
import { useState, useEffect, useRef } from 'react'

interface ExerciseGifProps {
  exerciseName: string
  gifUrl?: string
  className?: string
  showControls?: boolean
  autoPlay?: boolean
}

export function ExerciseGif({
  exerciseName,
  gifUrl: propGifUrl,
  className = '',
  showControls = false,
  autoPlay = true,
}: ExerciseGifProps) {
  const [gifUrl, setGifUrl] = useState<string | null>(propGifUrl || null)
  const [loading, setLoading] = useState(!propGifUrl)
  const [error, setError] = useState(false)
  const [paused, setPaused] = useState(!autoPlay)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (propGifUrl) {
      setGifUrl(propGifUrl)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    fetch(`/api/exercises/gif?name=${encodeURIComponent(exerciseName)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.gifUrl) setGifUrl(data.gifUrl)
        else setError(true)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })

    return () => controller.abort()
  }, [exerciseName, propGifUrl])

  const togglePause = () => {
    setPaused((p) => !p)
    if (imgRef.current && gifUrl) {
      if (!paused) {
        // "Freeze" the GIF by appending a fragment to break animation
        imgRef.current.src = `${gifUrl}#static`
      } else {
        // Restart the GIF by busting the cache with a timestamp
        imgRef.current.src = `${gifUrl}?t=${Date.now()}`
      }
    }
  }

  if (loading) {
    return (
      <div
        className={`bg-gray-900 rounded-2xl animate-pulse flex items-center justify-center ${className}`}
      >
        <div className="text-gray-700 text-4xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6.5 6.5h11" />
            <path d="M6.5 17.5h11" />
            <path d="M3 12h1" />
            <path d="M20 12h1" />
            <path d="M6 6.5V4" />
            <path d="M6 20v-2.5" />
            <path d="M18 6.5V4" />
            <path d="M18 20v-2.5" />
          </svg>
        </div>
      </div>
    )
  }

  if (error || !gifUrl) {
    return (
      <div
        className={`bg-gray-900 rounded-2xl flex flex-col items-center justify-center ${className}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-600 mb-2"
        >
          <path d="M6.5 6.5h11" />
          <path d="M6.5 17.5h11" />
          <path d="M3 12h1" />
          <path d="M20 12h1" />
          <path d="M6 6.5V4" />
          <path d="M6 20v-2.5" />
          <path d="M18 6.5V4" />
          <path d="M18 20v-2.5" />
        </svg>
        <p className="text-gray-600 text-xs text-center px-3">{exerciseName}</p>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gray-900 ${className}`}>
      <img
        ref={imgRef}
        src={gifUrl}
        alt={`${exerciseName} demonstration`}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setError(true)}
      />
      {showControls && (
        <button
          onClick={togglePause}
          className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm"
        >
          {paused ? 'Play' : 'Pause'}
        </button>
      )}
    </div>
  )
}
