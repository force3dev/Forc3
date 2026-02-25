const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || ''
const BASE_URL = 'https://exercisedb.p.rapidapi.com'

const headers = {
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
}

export interface ExerciseDBItem {
  id: string
  name: string
  bodyPart: string
  equipment: string
  gifUrl: string
  target: string
  secondaryMuscles: string[]
  instructions: string[]
}

export async function searchExercises(name: string): Promise<ExerciseDBItem[]> {
  if (!RAPIDAPI_KEY) return []
  try {
    const res = await fetch(
      `${BASE_URL}/exercises/name/${encodeURIComponent(name.toLowerCase())}?limit=5`,
      { headers, next: { revalidate: 86400 } }
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getExercisesByBodyPart(bodyPart: string): Promise<ExerciseDBItem[]> {
  if (!RAPIDAPI_KEY) return []
  try {
    const res = await fetch(
      `${BASE_URL}/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=20`,
      { headers, next: { revalidate: 86400 } }
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getAllExercises(limit = 100, offset = 0): Promise<ExerciseDBItem[]> {
  if (!RAPIDAPI_KEY) return []
  try {
    const res = await fetch(
      `${BASE_URL}/exercises?limit=${limit}&offset=${offset}`,
      { headers, next: { revalidate: 86400 } }
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}
