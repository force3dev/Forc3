import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/session'

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [workoutLogs, nutritionLogs, measurements, cardioLogs, checkIns] = await Promise.all([
      prisma.workoutLog.findMany({
        where: { userId },
        include: {
          exerciseLogs: { include: { sets: true, exercise: { select: { name: true } } } },
          workout: { select: { name: true } },
        },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.nutritionLog.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      prisma.bodyMeasurement.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      prisma.cardioActivity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.morningCheckIn.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
    ])

    return NextResponse.json({
      workoutLogs,
      nutritionLogs,
      measurements,
      cardioLogs,
      checkIns,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
