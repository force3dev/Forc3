"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MuscleDiagram from "@/components/MuscleDiagram";

type ExerciseDetail = {
  id: string;
  name: string;
  slug: string | null;
  category: string;
  movementPattern: string | null;
  skillLevel: string;
  muscleGroupsParsed: string[];
  secondaryMusclesParsed: string[];
  equipmentParsed: string[];
  formTipsParsed: string[];
  coachingCuesParsed: string[];
  alternativesParsed: string[];
  avoidIfInjuryParsed: string[];
  imageUrl: string | null;
  fatigueRating: number | null;
};

export default function ExerciseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const router = useRouter();
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"form" | "muscles" | "tips">("form");

  useEffect(() => {
    fetch(`/api/exercises/${params.slug}`)
      .then(r => r.json())
      .then(d => {
        setExercise(d.exercise);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!exercise) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-neutral-400">Exercise not found</p>
        <button onClick={() => router.back()} className="text-[#0066FF] text-sm">
          ← Go back
        </button>
      </main>
    );
  }

  const skillColor =
    exercise.skillLevel === "beginner"
      ? "text-green-400"
      : exercise.skillLevel === "intermediate"
      ? "text-yellow-400"
      : "text-red-400";

  const categoryLabel =
    exercise.category === "compound"
      ? "Compound"
      : exercise.category === "isolation"
      ? "Isolation"
      : exercise.category === "cardio"
      ? "Cardio"
      : exercise.category === "core"
      ? "Core"
      : exercise.category;

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="px-5 pt-8 pb-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400"
        >
          ←
        </button>
        <h1 className="text-lg font-bold flex-1 line-clamp-1">{exercise.name}</h1>
      </header>

      {/* Badges */}
      <div className="px-5 flex flex-wrap gap-2 mb-5">
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a1a1a] border border-[#262626] text-neutral-300">
          {categoryLabel}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full bg-[#1a1a1a] border border-[#262626] capitalize ${skillColor}`}>
          {exercise.skillLevel}
        </span>
        {exercise.movementPattern && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a1a1a] border border-[#262626] text-neutral-300 capitalize">
            {exercise.movementPattern.replace(/_/g, " ")}
          </span>
        )}
        {exercise.equipmentParsed.map(eq => (
          <span key={eq} className="text-xs px-2 py-0.5 rounded-full bg-[#0066FF15] border border-[#0066FF30] text-[#0066FF] capitalize">
            {eq.replace(/_/g, " ")}
          </span>
        ))}
      </div>

      {/* Muscle Diagram */}
      {exercise.muscleGroupsParsed.length > 0 && (
        <div className="px-5 mb-5">
          <MuscleDiagram
            primaryMuscles={exercise.muscleGroupsParsed}
            secondaryMuscles={exercise.secondaryMusclesParsed}
            size="md"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex bg-[#141414] rounded-xl p-1 gap-1">
          {(["form", "muscles", "tips"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${
                tab === t ? "bg-[#0066FF] text-white" : "text-neutral-400"
              }`}
            >
              {t === "form" ? "How To" : t === "muscles" ? "Muscles" : "Coach Tips"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-5">
        {tab === "form" && (
          <div className="space-y-3">
            {exercise.formTipsParsed.length > 0 ? (
              exercise.formTipsParsed.map((tip, i) => (
                <div key={i} className="flex gap-3 bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                  <span className="w-6 h-6 rounded-full bg-[#0066FF] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-neutral-200 leading-relaxed">{tip}</p>
                </div>
              ))
            ) : (
              <p className="text-neutral-500 text-sm text-center py-8">No instructions available yet.</p>
            )}
          </div>
        )}

        {tab === "muscles" && (
          <div className="space-y-4">
            {exercise.muscleGroupsParsed.length > 0 && (
              <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Primary</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.muscleGroupsParsed.map(m => (
                    <span key={m} className="text-sm px-2 py-0.5 rounded-full bg-[#0066FF20] text-[#0066FF] capitalize">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {exercise.secondaryMusclesParsed.length > 0 && (
              <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Secondary</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.secondaryMusclesParsed.map(m => (
                    <span key={m} className="text-sm px-2 py-0.5 rounded-full bg-[#ffffff10] text-neutral-300 capitalize">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {exercise.avoidIfInjuryParsed.length > 0 && (
              <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Avoid if injury to</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.avoidIfInjuryParsed.map(m => (
                    <span key={m} className="text-sm px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 capitalize">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {exercise.alternativesParsed.length > 0 && (
              <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Alternatives</p>
                <div className="flex flex-col gap-1">
                  {exercise.alternativesParsed.map(a => (
                    <p key={a} className="text-sm text-neutral-300">• {a}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "tips" && (
          <div className="space-y-3">
            {exercise.coachingCuesParsed.length > 0 ? (
              exercise.coachingCuesParsed.map((cue, i) => (
                <div key={i} className="flex gap-3 bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                  <span className="text-lg flex-shrink-0">💡</span>
                  <p className="text-sm text-neutral-200 leading-relaxed">{cue}</p>
                </div>
              ))
            ) : (
              <p className="text-neutral-500 text-sm text-center py-8">No coaching tips yet.</p>
            )}
            {exercise.fatigueRating && (
              <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a] flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Fatigue Rating</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Central nervous system demand</p>
                </div>
                <FatigueBar rating={exercise.fatigueRating} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function FatigueBar({ rating }: { rating: number }) {
  const pct = Math.min((rating / 3) * 100, 100);
  const color = pct < 40 ? "#22c55e" : pct < 70 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-xs font-bold" style={{ color }}>{rating.toFixed(1)}/3</span>
      <div className="w-20 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
