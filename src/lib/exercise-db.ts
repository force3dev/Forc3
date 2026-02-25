// ExerciseDB via RapidAPI — GIFs for 1300+ exercises
export async function fetchExerciseGif(exerciseName: string): Promise<string | null> {
  if (!process.env.RAPIDAPI_KEY) return null;
  try {
    const name = encodeURIComponent(exerciseName.toLowerCase());
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/name/${name}?limit=1`,
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data[0]?.gifUrl || null;
  } catch {
    return null;
  }
}

export async function fetchAllExercisesFromDB(): Promise<{
  name: string;
  gifUrl: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string[];
}[]> {
  if (!process.env.RAPIDAPI_KEY) return [];
  try {
    const response = await fetch(
      "https://exercisedb.p.rapidapi.com/exercises?limit=1300&offset=0",
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
      }
    );
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}
