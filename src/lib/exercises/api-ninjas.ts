// API Ninjas — free exercise API with muscle targeting

export interface ApiNinjasExercise {
  name: string;
  type: string;
  muscle: string;
  equipment: string;
  difficulty: string;
  instructions: string;
}

export async function searchApiNinjasExercise(muscle: string): Promise<ApiNinjasExercise[]> {
  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch(
      `https://api.api-ninjas.com/v1/exercises?muscle=${encodeURIComponent(muscle)}&limit=10`,
      {
        headers: { "X-Api-Key": apiKey },
        signal: AbortSignal.timeout(5000),
      }
    );
    return response.json();
  } catch {
    return [];
  }
}

export async function searchApiNinjasExerciseByName(name: string): Promise<ApiNinjasExercise[]> {
  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch(
      `https://api.api-ninjas.com/v1/exercises?name=${encodeURIComponent(name)}&limit=5`,
      {
        headers: { "X-Api-Key": apiKey },
        signal: AbortSignal.timeout(5000),
      }
    );
    return response.json();
  } catch {
    return [];
  }
}
