import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ races: [] }, { status: 401 })

    const races = await prisma.raceGoal.findMany({
      where: { userId },
      orderBy: { date: "asc" }
    })

    // Map to frontend-friendly shape
    const mapped = races.map(r => ({
      id: r.id,
      raceName: r.name,
      raceType: r.type,
      raceDate: r.date,
      targetTime: r.goalTime,
      status: r.status,
      result: r.result,
    }))

    return NextResponse.json({ races: mapped })
  } catch (error: any) {
    console.error("[API Error] /api/races:", error?.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { raceName, raceType, raceDate, targetTime } = body

    if (!raceType || !raceDate) {
      return NextResponse.json({ error: "Race type and date required" }, { status: 400 })
    }

    const race = await prisma.raceGoal.create({
      data: {
        userId,
        name: raceName || raceType,
        type: raceType,
        date: new Date(raceDate),
        goalTime: targetTime || null,
      }
    })

    return NextResponse.json({
      race: {
        id: race.id,
        raceName: race.name,
        raceType: race.type,
        raceDate: race.date,
        targetTime: race.goalTime,
      }
    })
  } catch (error: any) {
    console.error("[API Error] /api/races:", error?.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      await prisma.raceGoal.deleteMany({ where: { id, userId } })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[API Error] /api/races:", error?.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
