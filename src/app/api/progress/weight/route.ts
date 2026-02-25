import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const measurements = await prisma.bodyMeasurement.findMany({
      where: { userId, weight: { not: null } },
      orderBy: { date: "desc" },
      take: 30,
      select: { date: true, weight: true }
    })

    return NextResponse.json({ weights: measurements.reverse() })
  } catch (error: any) {
    console.error("[API Error] /api/progress/weight:", error?.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { weight } = await request.json()
    if (!weight || typeof weight !== "number") {
      return NextResponse.json({ error: "Weight is required" }, { status: 400 })
    }

    const entry = await prisma.bodyMeasurement.create({
      data: { userId, weight, date: new Date() }
    })

    return NextResponse.json({ entry })
  } catch (error: any) {
    console.error("[API Error] /api/progress/weight:", error?.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
