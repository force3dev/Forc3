import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ history: [] }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const exerciseName = searchParams.get("exercise")
    if (!exerciseName) return NextResponse.json({ history: [] })

    const prs = await prisma.personalRecord.findMany({
      where: { userId, exercise: { name: { contains: exerciseName, mode: "insensitive" } } },
      orderBy: { achievedAt: "asc" },
      take: 20,
      include: { exercise: { select: { name: true } } }
    })

    const history = prs.map(pr => ({
      date: pr.achievedAt,
      dateLabel: new Date(pr.achievedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weight: pr.value,
      reps: pr.reps,
      estimated1RM: Math.round(pr.value * (1 + (pr.reps || 1) / 30)),
    }))

    return NextResponse.json({ history, exerciseName })
  } catch (error: any) {
    console.error("[API Error] /api/progress/strength:", error?.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
