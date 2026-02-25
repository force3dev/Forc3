import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ supplements: [] }, { status: 401 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const logs = await prisma.supplementLog.findMany({
      where: { userId, date: { gte: today, lt: tomorrow } },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ supplements: logs })
  } catch (error: any) {
    console.error("[API Error] /api/supplements:", error?.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, dose, time } = await request.json()
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })

    const log = await prisma.supplementLog.create({
      data: { userId, name, dose, time, date: new Date() }
    })

    return NextResponse.json({ log })
  } catch (error: any) {
    console.error("[API Error] /api/supplements:", error?.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
