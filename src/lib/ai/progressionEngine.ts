import { prisma } from "@/lib/prisma";
import { estimateOneRepMax } from "@/lib/calculations/oneRepMax";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgressionSuggestion {
  exerciseId: string;
  suggestedWeight: number;
  progressionType: "increase" | "hold" | "deload" | "first_time";
  badge: string | null; // e.g. "⬆️ +5 lbs" or null
  reason: string;
}

interface LastSetData {
  weight: number;
  reps: number;
  repsMax: number;
  sets: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isLowerBody(muscleGroups: string[]): boolean {
  const lower = ["quads", "hamstrings", "glutes", "calves", "legs"];
  return muscleGroups.some(mg => lower.includes(mg.toLowerCase()));
}

function weightIncrement(isLower: boolean, unitSystem: string): number {
  if (unitSystem === "metric") return isLower ? 2.5 : 1.25;
  return isLower ? 10 : 5; // lbs
}

function shouldDeload(currentWeek: number, deloadFrequency: number): boolean {
  return currentWeek > 1 && currentWeek % deloadFrequency === 0;
}

// ─── Core Function ────────────────────────────────────────────────────────────

/**
 * For each exercise in today's workout, figure out what weight to suggest
 * and whether to show an "up arrow" badge.
 */
export async function getProgressionSuggestions(
  userId: string,
  exercises: Array<{
    exerciseId: string;
    name: string;
    sets: number;
    repsMin: number;
    repsMax: number;
    muscleGroups: string[];
  }>,
  currentWeek: number,
  deloadFrequency: number,
  unitSystem: string = "imperial"
): Promise<Map<string, ProgressionSuggestion>> {
  const results = new Map<string, ProgressionSuggestion>();

  const isDeloadWeek = shouldDeload(currentWeek, deloadFrequency);

  for (const ex of exercises) {
    // Get last workout's sets for this exercise
    const lastLog = await prisma.exerciseLog.findFirst({
      where: {
        exerciseId: ex.exerciseId,
        workoutLog: { userId },
      },
      orderBy: { createdAt: "desc" },
      include: {
        sets: { orderBy: { setNumber: "asc" }, where: { isWarmup: false } },
      },
    });

    const isLower = isLowerBody(ex.muscleGroups);
    const increment = weightIncrement(isLower, unitSystem);

    if (!lastLog || lastLog.sets.length === 0) {
      // First time doing this exercise
      results.set(ex.exerciseId, {
        exerciseId: ex.exerciseId,
        suggestedWeight: isLower ? 135 : 45,
        progressionType: "first_time",
        badge: null,
        reason: "First time — start light and focus on form",
      });
      continue;
    }

    const lastSets = lastLog.sets;
    const lastWeight = lastSets[0]?.weight || 45;
    const completedSets = lastSets.length;

    // Check if user hit top of rep range for ALL sets
    const allSetsHitTopRange = lastSets.every(s => s.reps >= ex.repsMax);
    // Check if user hit at least min reps on all sets
    const allSetsHitMinRange = lastSets.every(s => s.reps >= ex.repsMin);

    if (isDeloadWeek) {
      const deloadWeight = Math.round(lastWeight * 0.8 / 2.5) * 2.5;
      results.set(ex.exerciseId, {
        exerciseId: ex.exerciseId,
        suggestedWeight: deloadWeight,
        progressionType: "deload",
        badge: "🔄 Deload",
        reason: "Deload week — 80% of last weight, focus on recovery",
      });
      continue;
    }

    if (allSetsHitTopRange && completedSets >= ex.sets) {
      // Ready to progress
      const newWeight = lastWeight + increment;
      results.set(ex.exerciseId, {
        exerciseId: ex.exerciseId,
        suggestedWeight: newWeight,
        progressionType: "increase",
        badge: `⬆️ +${increment} ${unitSystem === "metric" ? "kg" : "lbs"}`,
        reason: `Hit top of rep range last session — time to add weight`,
      });
    } else if (!allSetsHitMinRange) {
      // Struggling — hold weight
      results.set(ex.exerciseId, {
        exerciseId: ex.exerciseId,
        suggestedWeight: lastWeight,
        progressionType: "hold",
        badge: "🎯 Hold",
        reason: "Didn't hit minimum reps last session — keep this weight",
      });
    } else {
      // In range, hold and work towards top range
      results.set(ex.exerciseId, {
        exerciseId: ex.exerciseId,
        suggestedWeight: lastWeight,
        progressionType: "hold",
        badge: null,
        reason: "Making progress — keep same weight and aim for top of rep range",
      });
    }
  }

  return results;
}

/**
 * Log a progression snapshot after a workout is completed.
 * Call this from the workout completion handler.
 */
export async function logProgression(
  userId: string,
  exerciseId: string,
  week: number,
  weight: number,
  reps: number,
  sets: number
): Promise<void> {
  const e1rm = estimateOneRepMax(weight, reps);
  const volume = weight * reps * sets;

  await (prisma as any).progressionLog.create({
    data: {
      userId,
      exerciseId,
      week,
      weight,
      reps,
      sets,
      volume,
      e1rm,
    },
  });
}
