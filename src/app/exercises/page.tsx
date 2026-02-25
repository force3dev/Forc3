"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MuscleDiagram from "@/components/MuscleDiagram";
import { ExerciseGif } from "@/components/ExerciseGif";

type Exercise = {
  id: string;
  name: string;
  slug: string | null;
  category: string;
  skillLevel: string;
  muscleGroupsParsed: string[];
  secondaryMusclesParsed: string[];
  equipmentParsed: string[];
  gifUrl?: string | null;
};

const MUSCLE_GROUPS = [
  "All", "Chest", "Back", "Shoulders", "Biceps", "Triceps",
  "Quadriceps", "Hamstrings", "Glutes", "Calves", "Core",
];

const EQUIPMENT_FILTERS = [
  "All", "Barbell", "Dumbbell", "Cable", "Machine", "Bodyweight", "Kettlebell", "Resistance Band",
];

const CATEGORY_FILTERS = [
  "All", "Compound", "Isolation", "Cardio", "Core",
];

export default function ExerciseBrowserPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("All");
  const [equipmentFilter, setEquipmentFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [diagramMuscles, setDiagramMuscles] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (muscleFilter !== "All") params.set("muscle", muscleFilter.toLowerCase());
    if (equipmentFilter !== "All") params.set("equipment", equipmentFilter.toLowerCase());
    if (categoryFilter !== "All") params.set("category", categoryFilter.toLowerCase());

    try {
      const res = await fetch(`/api/exercises/search?${params}`);
      const data = await res.json();
      // Handle both {results: [...]} and {local: [...], external: [...]}
      if (Array.isArray(data.results)) {
        setExercises(data.results);
      } else if (data.local) {
        setExercises(data.local);
      } else {
        setExercises([]);
      }
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, [query, muscleFilter, equipmentFilter, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchExercises, 300);
    return () => clearTimeout(timer);
  }, [fetchExercises]);

  // Update diagram when muscle filter changes
  useEffect(() => {
    if (muscleFilter !== "All") {
      setDiagramMuscles([muscleFilter.toLowerCase()]);
    } else {
      setDiagramMuscles([]);
    }
  }, [muscleFilter]);

  const skillColor = (level: string) =>
    level === "beginner" ? "text-green-400"
    : level === "advanced" ? "text-red-400"
    : "text-yellow-400";

  const activeFiltersCount = [
    muscleFilter !== "All",
    equipmentFilter !== "All",
    categoryFilter !== "All",
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400"
          >
            ←
          </button>
          <h1 className="text-xl font-bold">Exercise Library</h1>
          <span className="ml-auto text-xs text-neutral-500">{exercises.length} exercises</span>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#141414] border border-[#1a1a1a] rounded-xl px-4 py-2.5">
            <span className="text-neutral-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search exercises..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-600 outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-neutral-500 text-xs">✕</button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`px-3 rounded-xl border text-sm font-medium transition-colors ${
              activeFiltersCount > 0
                ? "bg-[#0066FF] border-[#0066FF] text-white"
                : "bg-[#141414] border-[#1a1a1a] text-neutral-400"
            }`}
          >
            Filters{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
          </button>
        </div>
      </header>

      {/* Muscle Diagram (when filtering by muscle) */}
      {muscleFilter !== "All" && (
        <div className="px-5 mb-4 flex justify-center">
          <MuscleDiagram primaryMuscles={diagramMuscles} size="sm" />
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-5 mb-4 space-y-3">
          <FilterRow
            label="Muscle Group"
            options={MUSCLE_GROUPS}
            value={muscleFilter}
            onChange={setMuscleFilter}
          />
          <FilterRow
            label="Equipment"
            options={EQUIPMENT_FILTERS}
            value={equipmentFilter}
            onChange={setEquipmentFilter}
          />
          <FilterRow
            label="Type"
            options={CATEGORY_FILTERS}
            value={categoryFilter}
            onChange={setCategoryFilter}
          />
          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                setMuscleFilter("All");
                setEquipmentFilter("All");
                setCategoryFilter("All");
              }}
              className="text-xs text-[#0066FF]"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Muscle Group Quick Filter Pills */}
      {!showFilters && (
        <div className="px-5 mb-4 overflow-x-auto">
          <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
            {MUSCLE_GROUPS.map(m => (
              <button
                key={m}
                onClick={() => setMuscleFilter(m)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  muscleFilter === m
                    ? "bg-[#0066FF] text-white"
                    : "bg-[#141414] text-neutral-400 border border-[#1a1a1a]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="px-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-2xl">🏋️</p>
            <p className="text-neutral-400 text-sm">No exercises found</p>
            <button
              onClick={() => { setQuery(""); setMuscleFilter("All"); setEquipmentFilter("All"); setCategoryFilter("All"); }}
              className="text-[#0066FF] text-sm mt-2"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {exercises.map(ex => (
              <Link
                key={ex.id}
                href={`/exercise/${ex.slug || ex.id}`}
                className="flex items-center gap-3 bg-[#141414] border border-[#1a1a1a] rounded-xl px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
              >
                {/* Exercise GIF Thumbnail */}
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                  <ExerciseGif
                    gifUrl={ex.gifUrl}
                    exerciseName={ex.name}
                    size="thumbnail"
                    className="!w-10 !h-10 !rounded-xl"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ex.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {ex.muscleGroupsParsed.slice(0, 2).map(m => (
                      <span key={m} className="text-xs text-neutral-500 capitalize">{m}</span>
                    ))}
                    {ex.muscleGroupsParsed.length > 2 && (
                      <span className="text-xs text-neutral-600">+{ex.muscleGroupsParsed.length - 2}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs capitalize ${skillColor(ex.skillLevel)}`}>
                    {ex.skillLevel}
                  </span>
                  {ex.equipmentParsed[0] && (
                    <span className="text-xs text-neutral-600 capitalize">
                      {ex.equipmentParsed[0].replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                <span className="text-neutral-600 text-sm">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1.5">{label}</p>
      <div className="overflow-x-auto">
        <div className="flex gap-1.5 pb-1" style={{ width: "max-content" }}>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                value === opt
                  ? "bg-[#0066FF] text-white"
                  : "bg-[#1a1a1a] text-neutral-400 border border-[#262626]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function categoryIcon(category: string): string {
  switch (category) {
    case "compound": return "🏋️";
    case "isolation": return "💪";
    case "cardio": return "🏃";
    case "core": return "🎯";
    default: return "⚡";
  }
}
