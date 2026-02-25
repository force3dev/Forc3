import { NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ days: [] }, { status: 401 })

    const yearAgo = new Date()
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)

    const logs = await prisma.workoutLog.findMany({
      where: { userId, startedAt: { gte: yearAgo } },
      select: { startedAt: true }
    })

    const countMap = new Map<string, number>()
    logs.forEach(log => {
      const key = new Date(log.startedAt).toISOString().split("T")[0]
      countMap.set(key, (countMap.get(key) || 0) + 1)
    })

    const days: { date: string; workouts: number }[] = []
    const current = new Date(yearAgo)
    const today = new Date()
    while (current <= today) {
      const key = current.toISOString().split("T")[0]
      days.push({ date: key, workouts: countMap.get(key) || 0 })
      current.setDate(current.getDate() + 1)
    }

    return NextResponse.json({ days })
  } catch (error: any) {
    console.error("[API Error] /api/progress/heatmap:", error?.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
