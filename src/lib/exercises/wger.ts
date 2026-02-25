// Wger — completely free, no key, 800+ exercises

export interface WgerExercise {
  id: number;
  name: string;
  description: string;
  muscles: number[];
  muscles_secondary: number[];
  equipment: number[];
  category: { id: number; name: string };
}

// Muscle IDs: 1=Biceps, 2=Anterior Deltoid, 3=Serratus Anterior, 4=Pectoralis Major
// 5=Triceps, 6=Abs, 7=Calves, 8=Glutes, 9=Hamstrings, 10=Quads
// 11=Lats, 12=Traps, 13=Rear Deltoid, 14=Lower Back
export const WGER_MUSCLE_NAMES: Record<number, string> = {
  1: "Biceps",
  2: "Anterior Deltoid",
  3: "Serratus Anterior",
  4: "Pectoralis Major",
  5: "Triceps",
  6: "Abs",
  7: "Calves",
  8: "Glutes",
  9: "Hamstrings",
  10: "Quads",
  11: "Lats",
  12: "Traps",
  13: "Rear Deltoid",
  14: "Lower Back",
};

export async function fetchWgerExercises(offset = 0): Promise<WgerExercise[]> {
  try {
    const response = await fetch(
      `https://wger.de/api/v2/exercise/?format=json&language=2&limit=100&offset=${offset}`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await response.json();
    return data.results || [];
  } catch {
    return [];
  }
}

export async function fetchWgerExercisesByMuscle(muscleId: number): Promise<WgerExercise[]> {
  try {
    const response = await fetch(
      `https://wger.de/api/v2/exercise/?format=json&language=2&muscles=${muscleId}&limit=50`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await response.json();
    return data.results || [];
  } catch {
    return [];
  }
}

export async function fetchAllWgerExercises(): Promise<WgerExercise[]> {
  const allExercises: WgerExercise[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const batch = await fetchWgerExercises(offset);
    if (batch.length === 0) break;
    allExercises.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  return allExercises;
}
