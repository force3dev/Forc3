import { NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        subscription: true,
        streak: true,
      }
    })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const isPremium = user.subscription?.tier !== "free" && user.subscription?.status === "active"

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isPremium,
      streak: user.streak?.currentStreak || 0,
      xp: user.streak?.totalXP || 0,
      level: user.streak?.level || 1,
      goal: user.profile?.goal,
      units: user.profile?.unitSystem || "imperial",
      onboardingCompleted: user.profile?.onboardingDone || false,
      createdAt: user.createdAt,
    })
  } catch (error: any) {
    console.error("[API Error] /api/user/me:", error?.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
