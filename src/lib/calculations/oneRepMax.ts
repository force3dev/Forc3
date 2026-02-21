// Epley formula: 1RM = weight × (1 + reps/30)
export function calculateEpley(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

// Brzycki formula: 1RM = weight × (36 / (37 - reps))
export function calculateBrzycki(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps >= 37) return weight * 1.5; // avoid division by zero
  return Math.round(weight * (36 / (37 - reps)));
}

// Average of multiple formulas for better accuracy
export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight;
  const epley = calculateEpley(weight, reps);
  const brzycki = calculateBrzycki(weight, reps);
  return Math.round((epley + brzycki) / 2);
}
