const EXERCISEDB_API = "https://exercisedb.p.rapidapi.com";

export interface ExerciseDBExercise {
  id: string;
  name: string;
  gifUrl: string;
  target: string;
  bodyPart: string;
  equipment: string;
  secondaryMuscles: string[];
  instructions: string[];
}

export async function getExerciseByName(name: string): Promise<ExerciseDBExercise | null> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `${EXERCISEDB_API}/exercises/name/${encodeURIComponent(name.toLowerCase())}?limit=1`,
      {
        headers: {
          "X-RapidAPI-Key": key,
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
        next: { revalidate: 86400 }, // cache 24h
      }
    );
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

export async function getExerciseGif(exerciseName: string): Promise<string | null> {
  const ex = await getExerciseByName(exerciseName);
  return ex?.gifUrl || null;
}
