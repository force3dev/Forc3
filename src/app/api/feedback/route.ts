import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const { message, type } = await request.json()

    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 })

    console.log(`[Feedback] User: ${userId || "anonymous"}, Type: ${type || "general"}, Message: ${message}`)

    return NextResponse.json({ success: true, message: "Thank you for your feedback!" })
  } catch (error: any) {
    console.error("[API Error] /api/feedback:", error?.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
