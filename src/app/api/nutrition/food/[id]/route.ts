import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params

  try {
    await prisma.nutritionLog.deleteMany({
      where: { id, userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Food delete error:', error)
    return NextResponse.json({ error: 'Failed to delete food' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params

  try {
    const { quantity } = await request.json()

    const food = await prisma.nutritionLog.findFirst({ where: { id, userId } })
    if (!food) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const ratio = quantity / (food.quantity || 1)

    await prisma.nutritionLog.update({
      where: { id },
      data: {
        quantity,
        calories: Math.round(food.calories * ratio),
        protein: Math.round(food.protein * ratio * 10) / 10,
        carbs: Math.round(food.carbs * ratio * 10) / 10,
        fat: Math.round(food.fat * ratio * 10) / 10,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Food update error:', error)
    return NextResponse.json({ error: 'Failed to update food' }, { status: 500 })
  }
}
