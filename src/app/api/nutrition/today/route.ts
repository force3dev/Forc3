import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({
      foods: [],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0 }
    })
  }

  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date') || new Date().toISOString().slice(0, 10)

  const start = new Date(dateParam)
  start.setHours(0, 0, 0, 0)
  const end = new Date(dateParam)
  end.setHours(23, 59, 59, 999)

  try {
    const foods = await prisma.nutritionLog.findMany({
      where: { userId, date: { gte: start, lte: end } },
      orderBy: { createdAt: 'asc' }
    })

    const totals = foods.reduce((acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

    // Map to frontend expected format
    const mappedFoods = foods.map(f => ({
      id: f.id,
      name: f.foodName,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      quantity: f.quantity,
      servingUnit: f.unit,
      meal: f.meal,
      source: f.source,
    }))

    return NextResponse.json({ foods: mappedFoods, totals })
  } catch (error) {
    console.error('Nutrition today error:', error)
    return NextResponse.json({
      foods: [],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0 }
    })
  }
}
