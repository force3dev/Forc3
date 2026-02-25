import { prisma } from '@/lib/prisma'

export interface FoodResult {
  id: string
  name: string
  brand?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  servingSize: number
  servingUnit: string
  servingDescription?: string
  source: string
  barcode?: string
  imageUrl?: string
  verified?: boolean
}

// Re-export for backward compatibility
export { getFoodByBarcode } from './openFoodFacts'

export async function searchFoods(query: string): Promise<FoodResult[]> {
  if (!query || query.length < 2) return []

  // Check cache first
  try {
    const cached = await prisma.nutritionCache.findUnique({ where: { query: query.toLowerCase() } })
    if (cached && cached.expiresAt > new Date()) {
      return cached.results as unknown as FoodResult[]
    }
  } catch {
    // Cache miss or error, continue with search
  }

  const results: FoodResult[] = []

  // Run all searches in parallel
  const searches = await Promise.allSettled([
    searchOpenFoodFacts(query),
    searchUSDA(query),
    searchNutritionix(query),
    searchCalorieNinjas(query),
  ])

  for (const result of searches) {
    if (result.status === 'fulfilled') {
      results.push(...result.value)
    }
  }

  const deduped = deduplicateResults(results)

  // Cache for 7 days
  try {
    await prisma.nutritionCache.upsert({
      where: { query: query.toLowerCase() },
      update: { results: deduped as unknown as any, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      create: { query: query.toLowerCase(), results: deduped as unknown as any, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    })
  } catch {
    // Cache write failure is non-critical
  }

  return deduped.slice(0, 30)
}

// Backward-compatible alias
export const searchAllNutritionAPIs = searchFoods

// ─── OpenFoodFacts ──────────────────────────────────────────────────────────

async function searchOpenFoodFacts(query: string): Promise<FoodResult[]> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=code,product_name,brands,nutriments,image_small_url,serving_size`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'FORC3-App/1.0 (contact@forc3.app)' },
      signal: AbortSignal.timeout(5000),
    })

    const data = await res.json()

    return (data.products || [])
      .filter((p: Record<string, unknown>) => {
        const n = p.nutriments as Record<string, number> | undefined
        return n && (n['energy-kcal_100g'] || n['energy-kcal'])
      })
      .map((p: Record<string, unknown>): FoodResult => {
        const n = p.nutriments as Record<string, number>
        return {
          id: `off_${p.code}`,
          name: (p.product_name as string) || 'Unknown',
          brand: p.brands as string | undefined,
          calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
          protein: Math.round(n.proteins_100g || n.proteins || 0),
          carbs: Math.round(n.carbohydrates_100g || n.carbohydrates || 0),
          fat: Math.round(n.fat_100g || n.fat || 0),
          fiber: Math.round(n.fiber_100g || n.fiber || 0),
          servingSize: 100,
          servingUnit: 'g',
          source: 'openfoodfacts',
          barcode: p.code as string | undefined,
          imageUrl: p.image_small_url as string | undefined,
          verified: true,
        }
      })
      .slice(0, 12)
  } catch {
    return []
  }
}

// ─── USDA ───────────────────────────────────────────────────────────────────

async function searchUSDA(query: string): Promise<FoodResult[]> {
  try {
    const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY'
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=15&dataType=Foundation,SR%20Legacy,Branded`

    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return []
    const data = await res.json()

    const getNutrient = (nutrients: Array<{ nutrientName: string; value: number }>, name: string) =>
      nutrients.find(n => n.nutrientName === name)?.value || 0

    return (data.foods || []).map((food: {
      fdcId: number
      description: string
      brandOwner?: string
      servingSize?: number
      servingSizeUnit?: string
      foodNutrients: Array<{ nutrientName: string; value: number }>
    }): FoodResult => ({
      id: `usda_${food.fdcId}`,
      name: food.description,
      brand: food.brandOwner,
      calories: Math.round(getNutrient(food.foodNutrients, 'Energy')),
      protein: Math.round(getNutrient(food.foodNutrients, 'Protein')),
      carbs: Math.round(getNutrient(food.foodNutrients, 'Carbohydrate, by difference')),
      fat: Math.round(getNutrient(food.foodNutrients, 'Total lipid (fat)')),
      fiber: Math.round(getNutrient(food.foodNutrients, 'Fiber, total dietary')),
      servingSize: food.servingSize || 100,
      servingUnit: food.servingSizeUnit || 'g',
      source: 'usda',
      verified: true,
    }))
  } catch {
    return []
  }
}

// ─── Nutritionix ────────────────────────────────────────────────────────────

async function searchNutritionix(query: string): Promise<FoodResult[]> {
  try {
    if (!process.env.NUTRITIONIX_APP_ID || !process.env.NUTRITIONIX_API_KEY) return []

    const response = await fetch('https://trackapi.nutritionix.com/v2/search/instant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': process.env.NUTRITIONIX_APP_ID,
        'x-app-key': process.env.NUTRITIONIX_API_KEY,
      },
      body: JSON.stringify({ query, detailed: true }),
      signal: AbortSignal.timeout(5000),
    })
    const data = await response.json()

    const mapItem = (item: any, sourceLabel: string): FoodResult => ({
      id: `nix-${item.nix_item_id || item.food_name}`,
      name: item.food_name,
      brand: item.brand_name || undefined,
      calories: Math.round(item.nf_calories || 0),
      protein: parseFloat((item.nf_protein || 0).toFixed(1)),
      carbs: parseFloat((item.nf_total_carbohydrate || 0).toFixed(1)),
      fat: parseFloat((item.nf_total_fat || 0).toFixed(1)),
      fiber: item.nf_dietary_fiber,
      sugar: item.nf_sugars,
      sodium: item.nf_sodium,
      servingSize: item.serving_qty || 1,
      servingUnit: item.serving_unit || 'serving',
      servingDescription: item.serving_weight_grams ? `${item.serving_weight_grams}g` : undefined,
      source: sourceLabel,
      verified: true,
    })

    return [
      ...(data.branded || []).map((i: any) => mapItem(i, 'nutritionix')),
      ...(data.common || []).map((i: any) => mapItem(i, 'nutritionix')),
    ]
  } catch {
    return []
  }
}

// ─── CalorieNinjas ──────────────────────────────────────────────────────────

async function searchCalorieNinjas(query: string): Promise<FoodResult[]> {
  try {
    if (!process.env.CALORIE_NINJAS_API_KEY) return []

    const response = await fetch(
      `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`,
      {
        headers: { 'X-Api-Key': process.env.CALORIE_NINJAS_API_KEY },
        signal: AbortSignal.timeout(5000),
      }
    )
    const data = await response.json()

    return (data.items || []).map((item: any): FoodResult => ({
      id: `cn-${item.name.replace(/\s/g, '-')}`,
      name: item.name,
      calories: Math.round(item.calories),
      protein: parseFloat(item.protein_g.toFixed(1)),
      carbs: parseFloat(item.carbohydrates_total_g.toFixed(1)),
      fat: parseFloat(item.fat_total_g.toFixed(1)),
      fiber: item.fiber_g ? parseFloat(item.fiber_g.toFixed(1)) : undefined,
      sugar: item.sugar_g ? parseFloat(item.sugar_g.toFixed(1)) : undefined,
      sodium: item.sodium_mg ? Math.round(item.sodium_mg) : undefined,
      servingSize: Math.round(item.serving_size_g || 100),
      servingUnit: 'g',
      source: 'calorieninjas',
      verified: true,
    }))
  } catch {
    return []
  }
}

// ─── Deduplication ──────────────────────────────────────────────────────────

function deduplicateResults(results: FoodResult[]): FoodResult[] {
  const seen = new Map<string, FoodResult>()

  for (const food of results) {
    const key = food.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const existing = seen.get(key)

    if (!existing || getDetailScore(food) > getDetailScore(existing)) {
      seen.set(key, food)
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => {
      // Prefer verified sources
      if (a.verified && !b.verified) return -1
      if (!a.verified && b.verified) return 1
      // Prefer exact name matches
      const queryLower = ''
      const aExact = a.name.toLowerCase().includes(queryLower) ? 1 : 0
      const bExact = b.name.toLowerCase().includes(queryLower) ? 1 : 0
      if (bExact !== aExact) return bExact - aExact
      // Prefer results with more detail
      return getDetailScore(b) - getDetailScore(a)
    })
}

function getDetailScore(food: FoodResult): number {
  let score = 0
  if (food.fiber !== undefined) score++
  if (food.sugar !== undefined) score++
  if (food.sodium !== undefined) score++
  if (food.brand) score++
  if (food.servingDescription) score++
  if (food.verified) score += 3
  if (food.imageUrl) score++
  return score
}
