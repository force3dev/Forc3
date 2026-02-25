/**
 * Pure progressive-overload calculation utility.
 * No DB access — takes raw set data and returns the next-week recommendation.
 */

export interface WeightSuggestion {
  nextWeight: number;
  reason: string;
  change: "increase" | "maintain" | "decrease";
  badge: string;
}

/**
 * Determines the appropriate weight increment for a given current weight.
 * Uses smaller jumps for lighter weights, larger for heavier compound lifts.
 */
function getIncrement(currentWeight: number): number {
  if (currentWeight < 45) return 2.5;
  if (currentWeight < 135) return 5;
  if (currentWeight < 225) return 5;
  return 10;
}

/**
 * Calculate next week's suggested weight based on this week's performance.
 *
 * @param exercise        Exercise name (for context in reason string)
 * @param currentWeight   Weight used this week (lbs or kg)
 * @param setsCompleted   How many sets were actually finished
 * @param totalSets       How many sets were programmed
 * @param repsCompleted   Array of reps per set (length === setsCompleted)
 * @param targetReps      Target reps per set
 */
export function calculateNextWeight(
  exercise: string,
  currentWeight: number,
  setsCompleted: number,
  totalSets: number,
  repsCompleted: number[],
  targetReps: number
): WeightSuggestion {
  if (currentWeight <= 0) {
    return {
      nextWeight: 45,
      reason: "Starting weight — find your working weight",
      change: "increase",
      badge: "🆕 Start",
    };
  }

  const completionRate = totalSets > 0 ? setsCompleted / totalSets : 0;
  const avgReps =
    repsCompleted.length > 0
      ? repsCompleted.reduce((a, b) => a + b, 0) / repsCompleted.length
      : 0;
  const hitAllReps =
    repsCompleted.length > 0 && repsCompleted.every((r) => r >= targetReps);

  // All sets completed and every set hit target reps → increase
  if (hitAllReps && completionRate === 1) {
    const increment = getIncrement(currentWeight);
    return {
      nextWeight: currentWeight + increment,
      reason: `Hit all reps on ${exercise} — time to progress!`,
      change: "increase",
      badge: `⬆️ +${increment} lbs`,
    };
  }

  // Averaged below 80% of target reps → decrease
  if (avgReps < targetReps * 0.8 || completionRate < 0.75) {
    const nextWeight = Math.round(currentWeight * 0.9 / 2.5) * 2.5; // round to nearest 2.5
    return {
      nextWeight,
      reason: `Struggled with ${exercise} reps — reset and rebuild strength`,
      change: "decrease",
      badge: "⬇️ Reset",
    };
  }

  // Close but not quite → hold weight
  return {
    nextWeight: currentWeight,
    reason: `Almost there on ${exercise} — same weight, aim for all reps`,
    change: "maintain",
    badge: "➡️ Hold",
  };
}

/**
 * Analyze a lift across multiple sessions to detect a plateau (stalled 3+ weeks).
 */
export interface PlateauCheck {
  isPlateaued: boolean;
  weeksStuck: number;
  stuckWeight: number | null;
}

export function detectPlateau(
  recentWeights: number[] // ordered oldest → newest, one entry per session
): PlateauCheck {
  if (recentWeights.length < 3) {
    return { isPlateaued: false, weeksStuck: 0, stuckWeight: null };
  }

  const last3 = recentWeights.slice(-3);
  const allSame = last3.every((w) => w === last3[0]);

  if (allSame) {
    // Count how far back the same weight goes
    let weeksStuck = 3;
    for (let i = recentWeights.length - 4; i >= 0; i--) {
      if (recentWeights[i] === last3[0]) weeksStuck++;
      else break;
    }
    return { isPlateaued: true, weeksStuck, stuckWeight: last3[0] };
  }

  return { isPlateaued: false, weeksStuck: 0, stuckWeight: null };
}

/**
 * Given a set of recent recovery scores, determine if a deload is needed.
 * Returns true when average is below 60 for 2+ data points.
 */
export function needsDeload(recentRecoveryScores: number[]): boolean {
  if (recentRecoveryScores.length < 2) return false;
  const avg =
    recentRecoveryScores.reduce((a, b) => a + b, 0) /
    recentRecoveryScores.length;
  return avg < 60;
}

/**
 * Suggest a plateau-busting protocol variation for a given exercise.
 */
export function getPlateauProtocol(exerciseName: string): {
  week1: string;
  week2: string;
  week3: string;
  week4: string;
} {
  const lower = exerciseName.toLowerCase();

  if (lower.includes("bench")) {
    return {
      week1: "Pause Bench (2-sec pause at bottom)",
      week2: "Close-Grip Bench",
      week3: "Back to competition bench with fresh focus",
      week4: "Test new max 🏆",
    };
  }
  if (lower.includes("squat")) {
    return {
      week1: "Pause Squats (3-sec pause in hole)",
      week2: "Front Squat or Box Squat",
      week3: "Back to regular squat",
      week4: "Test new max 🏆",
    };
  }
  if (lower.includes("deadlift")) {
    return {
      week1: "Romanian Deadlifts (tempo)",
      week2: "Deficit Deadlifts",
      week3: "Regular Deadlift — full reset",
      week4: "Test new max 🏆",
    };
  }
  if (lower.includes("press") || lower.includes("ohp")) {
    return {
      week1: "Seated OHP (removes leg drive variable)",
      week2: "Push Press (heavier load exposure)",
      week3: "Standing OHP — normal",
      week4: "Test new max 🏆",
    };
  }

  // Generic protocol for any other lift
  return {
    week1: `${exerciseName} — Tempo reps (3-1-3)`,
    week2: `${exerciseName} — Drop sets`,
    week3: `${exerciseName} — Back to normal`,
    week4: "Test new max 🏆",
  };
}
