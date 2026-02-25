import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/session'
import { searchFoods } from '@/lib/nutrition/search'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ foods: [] }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''

  if (query.length < 2) return NextResponse.json({ foods: [] })

  try {
    const foods = await searchFoods(query)
    return NextResponse.json({ foods })
  } catch (error: any) {
    console.error('Nutrition search error:', error?.message)
    return NextResponse.json({ foods: [], error: 'Search temporarily unavailable' })
  }
}
