import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const body = await request.json()
    const { event, properties, timestamp } = body

    if (!event) return NextResponse.json({ error: "Event required" }, { status: 400 })

    await prisma.pageView.create({
      data: {
        userId: userId || "anonymous",
        path: event,
        userAgent: properties ? JSON.stringify(properties) : null,
      }
    })

    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] ${event}`, properties || "")
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
