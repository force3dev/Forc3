import { NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const logs = await prisma.workoutLog.findMany({
      where: { userId, startedAt: { gte: monthStart } },
      include: {
        exerciseLogs: {
          include: { sets: true }
        }
      }
    })

    let totalVolume = 0
    logs.forEach(log => {
      log.exerciseLogs.forEach(el => {
        el.sets.forEach(set => {
          if (!set.isWarmup) {
            totalVolume += set.weight * set.reps
          }
        })
      })
    })

    return NextResponse.json({
      totalVolume: Math.round(totalVolume),
      workoutCount: logs.length,
      month: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    })
  } catch (error: any) {
    console.error("[API Error] /api/progress/monthly-volume:", error?.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
