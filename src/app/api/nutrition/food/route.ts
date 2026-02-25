import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, calories, protein, carbs, fat, servingSize, servingUnit, quantity, meal, date, source } = body

    const qty = quantity || 1

    const log = await prisma.nutritionLog.create({
      data: {
        userId,
        foodName: name || 'Unknown food',
        calories: Math.round((calories || 0) * qty),
        protein: Math.round((protein || 0) * qty * 10) / 10,
        carbs: Math.round((carbs || 0) * qty * 10) / 10,
        fat: Math.round((fat || 0) * qty * 10) / 10,
        quantity: qty,
        unit: servingUnit || 'serving',
        meal: meal || 'snack',
        date: date ? new Date(date) : new Date(),
        source: source || 'search',
      }
    })

    return NextResponse.json({ success: true, log })
  } catch (error) {
    console.error('Food log error:', error)
    return NextResponse.json({ error: 'Failed to log food' }, { status: 500 })
  }
}
