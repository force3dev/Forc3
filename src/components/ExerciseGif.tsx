"use client";
import { useState } from "react";

interface ExerciseGifProps {
  gifUrl?: string | null;
  exerciseName: string;
  size?: "thumbnail" | "medium" | "large";
  className?: string;
}

export function ExerciseGif({
  gifUrl,
  exerciseName,
  size = "medium",
  className = "",
}: ExerciseGifProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const sizeClasses = {
    thumbnail: "w-16 h-16",
    medium: "w-full h-56",
    large: "w-full h-96",
  };

  const dimClass = sizeClasses[size];

  if (!gifUrl || error) {
    return (
      <div
        className={`${dimClass} bg-[#0a0a0a] rounded-xl flex flex-col items-center justify-center gap-2 border border-[#1a1a1a] ${className}`}
      >
        <span className="text-4xl">💪</span>
        {size !== "thumbnail" && (
          <>
            <p className="text-neutral-400 text-xs text-center px-2 font-medium">
              {exerciseName}
            </p>
            <p className="text-neutral-600 text-xs">No animation available</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${dimClass} relative rounded-xl overflow-hidden bg-[#0a0a0a] ${className}`}
    >
      {/* Skeleton while loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-[#141414] animate-pulse" />
      )}

      {/* Loading spinner */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* GIF */}
      <img
        src={gifUrl}
        alt={`${exerciseName} demonstration`}
        loading="lazy"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />

      {/* Exercise name overlay for medium/large */}
      {loaded && size !== "thumbnail" && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <p className="text-white text-sm font-semibold">{exerciseName}</p>
        </div>
      )}
    </div>
  );
}

export default ExerciseGif;
