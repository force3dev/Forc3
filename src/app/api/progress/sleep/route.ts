import { NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ data: [] }, { status: 401 })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const checkIns = await prisma.morningCheckIn.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        sleepHours: true,
        sleepQuality: true,
        recoveryScore: true,
      }
    })

    return NextResponse.json({ data: checkIns })
  } catch (error: any) {
    console.error("[API Error] /api/progress/sleep:", error?.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
