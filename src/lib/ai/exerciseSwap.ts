import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SwapOption {
  exerciseId: string;
  name: string;
  muscleGroups: string[];
  equipment: string[];
  fatigueRating: number;
  reason: string;
}

// ─── Core Function ─────────────────────────────────────────────────────────────

/**
 * Find alternative exercises for a given exercise.
 * Matches by muscle group overlap, available equipment, and excludes injury-related movements.
 */
export async function findSwapOptions(
  exerciseId: string,
  userEquipment: string,   // full_gym, home_gym, minimal, bodyweight
  userInjuries: string[]   // array of injury strings
): Promise<SwapOption[]> {
  // Get the exercise to swap
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
  });

  if (!exercise) return [];

  const targetMuscles: string[] = JSON.parse(exercise.muscleGroups || "[]");

  // Get all exercises
  const allExercises = await prisma.exercise.findMany({
    where: { id: { not: exerciseId } },
  });

  // Equipment compatibility map
  const equipmentCompat: Record<string, string[]> = {
    full_gym: ["barbell", "dumbbell", "cable", "machine", "bodyweight", "kettlebell"],
    home_gym: ["barbell", "dumbbell", "bodyweight", "kettlebell", "resistance_band"],
    minimal: ["dumbbell", "bodyweight", "resistance_band", "kettlebell"],
    bodyweight: ["bodyweight"],
  };
  const allowedEquipment = equipmentCompat[userEquipment] || equipmentCompat.full_gym;

  // Filter and score candidates (all done in JS since SQLite can't do array filters)
  const candidates = allExercises.filter(ex => {
    const exMuscles: string[] = JSON.parse(ex.muscleGroups || "[]");
    const exEquipment: string[] = JSON.parse(ex.equipment || "[]");
    const exAvoidInjury: string[] = JSON.parse(ex.avoidIfInjury || "[]");

    // Must share at least one primary muscle group
    const muscleOverlap = exMuscles.some(m => targetMuscles.includes(m));
    if (!muscleOverlap) return false;

    // Must be compatible with user's equipment (if exercise specifies equipment)
    if (exEquipment.length > 0) {
      const hasEquipment = exEquipment.some(e => allowedEquipment.includes(e));
      if (!hasEquipment) return false;
    }

    // Must not conflict with user's injuries
    if (userInjuries.length > 0 && exAvoidInjury.length > 0) {
      const hasInjuryConflict = exAvoidInjury.some(inj =>
        userInjuries.some(ui => ui.toLowerCase().includes(inj.toLowerCase()))
      );
      if (hasInjuryConflict) return false;
    }

    return true;
  });

  // Score and sort by muscle overlap
  const scored = candidates.map(ex => {
    const exMuscles: string[] = JSON.parse(ex.muscleGroups || "[]");
    const overlap = exMuscles.filter(m => targetMuscles.includes(m)).length;
    const overlapRatio = overlap / Math.max(targetMuscles.length, 1);
    return { ex, score: overlapRatio - ex.fatigueRating * 0.1 };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 6).map(({ ex }) => {
    const exMuscles: string[] = JSON.parse(ex.muscleGroups || "[]");
    const exEquipment: string[] = JSON.parse(ex.equipment || "[]");
    const overlap = exMuscles.filter(m => targetMuscles.includes(m));

    return {
      exerciseId: ex.id,
      name: ex.name,
      muscleGroups: exMuscles,
      equipment: exEquipment,
      fatigueRating: ex.fatigueRating,
      reason: `Targets ${overlap.join(", ")} — same as ${exercise.name}`,
    };
  });
}
