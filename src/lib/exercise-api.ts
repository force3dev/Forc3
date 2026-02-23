/**
 * Exercise API Integration — ExerciseDB + Wger fallback
 * Fetches exercise data from external APIs and caches in our DB.
 */

import { prisma } from "./prisma";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ExternalExercise {
  name: string;
  category: string;
  muscleGroups: string[];
  secondaryMuscles: string[];
  equipment: string[];
  imageUrl?: string;
  gifUrl?: string;
  instructions?: string[];
  source: "exercisedb" | "wger" | "local";
}

// ── ExerciseDB (RapidAPI) ──────────────────────────────────────────────────

async function fetchFromExerciseDB(query: string): Promise<ExternalExercise[]> {
  const apiKey = process.env.EXERCISEDB_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(query)}?limit=10`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
      next: { revalidate: 86400 }, // 24h cache
    });

    if (!res.ok) return [];
    const data = await res.json();

    return (data as any[]).map((ex: any) => ({
      name: ex.name,
      category: mapExerciseDBCategory(ex.bodyPart, ex.target),
      muscleGroups: [ex.target].filter(Boolean),
      secondaryMuscles: ex.secondaryMuscles || [],
      equipment: ex.equipment ? [ex.equipment] : [],
      gifUrl: ex.gifUrl,
      source: "exercisedb" as const,
    }));
  } catch {
    return [];
  }
}

function mapExerciseDBCategory(bodyPart: string, target: string): string {
  const bp = bodyPart?.toLowerCase() || "";
  if (bp.includes("chest")) return "compound";
  if (bp.includes("back")) return "compound";
  if (bp.includes("shoulder")) return "compound";
  if (bp.includes("upper arm") || bp.includes("bicep") || bp.includes("tricep")) return "isolation";
  if (bp.includes("upper leg") || bp.includes("lower leg")) return "compound";
  if (bp.includes("waist") || bp.includes("core")) return "core";
  if (bp.includes("cardio")) return "cardio";
  return "compound";
}

// ── Wger API (free, no key required) ──────────────────────────────────────

async function fetchFromWger(query: string): Promise<ExternalExercise[]> {
  try {
    const url = `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(query)}&language=english&format=json`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    const suggestions = data.suggestions || [];

    return suggestions.slice(0, 10).map((s: any) => ({
      name: s.value,
      category: "compound",
      muscleGroups: [],
      secondaryMuscles: [],
      equipment: [],
      source: "wger" as const,
    }));
  } catch {
    return [];
  }
}

// ── Local DB Search ────────────────────────────────────────────────────────

export async function searchLocalExercises(query: string, filters?: {
  muscleGroup?: string;
  equipment?: string;
  category?: string;
  limit?: number;
}) {
  const limit = filters?.limit || 20;

  const exercises = await prisma.exercise.findMany({
    where: {
      AND: [
        query ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { muscleGroups: { contains: query, mode: "insensitive" } },
          ],
        } : {},
        filters?.muscleGroup
          ? { muscleGroups: { contains: filters.muscleGroup, mode: "insensitive" } }
          : {},
        filters?.equipment
          ? { equipment: { contains: filters.equipment, mode: "insensitive" } }
          : {},
        filters?.category
          ? { category: { equals: filters.category } }
          : {},
      ],
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  return exercises.map(ex => ({
    ...ex,
    muscleGroupsParsed: safeJsonParse(ex.muscleGroups, []),
    secondaryMusclesParsed: safeJsonParse(ex.secondaryMuscles, []),
    equipmentParsed: safeJsonParse(ex.equipment, []),
    formTipsParsed: safeJsonParse(ex.formTips, []),
    coachingCuesParsed: safeJsonParse(ex.coachingCues, []),
    alternativesParsed: safeJsonParse(ex.alternatives, []),
  }));
}

export async function getExerciseBySlug(slug: string) {
  const ex = await prisma.exercise.findFirst({
    where: { OR: [{ slug }, { name: slug.replace(/-/g, " ") }] },
  });
  if (!ex) return null;
  return {
    ...ex,
    muscleGroupsParsed: safeJsonParse(ex.muscleGroups, []),
    secondaryMusclesParsed: safeJsonParse(ex.secondaryMuscles, []),
    equipmentParsed: safeJsonParse(ex.equipment, []),
    formTipsParsed: safeJsonParse(ex.formTips, []),
    coachingCuesParsed: safeJsonParse(ex.coachingCues, []),
    alternativesParsed: safeJsonParse(ex.alternatives, []),
    avoidIfInjuryParsed: safeJsonParse(ex.avoidIfInjury, []),
  };
}

// ── Combined Search ────────────────────────────────────────────────────────

export async function searchExercises(query: string, filters?: {
  muscleGroup?: string;
  equipment?: string;
  category?: string;
}) {
  // Always search local DB first (instant)
  const localResults = await searchLocalExercises(query, { ...filters, limit: 20 });

  // If we have enough local results, return them
  if (localResults.length >= 10 || !query) {
    return localResults;
  }

  // Otherwise augment with external APIs (in parallel)
  const [edbResults, wgerResults] = await Promise.allSettled([
    fetchFromExerciseDB(query),
    fetchFromWger(query),
  ]);

  const external: ExternalExercise[] = [
    ...(edbResults.status === "fulfilled" ? edbResults.value : []),
    ...(wgerResults.status === "fulfilled" ? wgerResults.value : []),
  ];

  // Filter out duplicates with local results
  const localNames = new Set(localResults.map(ex => ex.name.toLowerCase()));
  const newExternal = external.filter(ex => !localNames.has(ex.name.toLowerCase()));

  return { local: localResults, external: newExternal };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val) as T; }
  catch { return fallback; }
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
