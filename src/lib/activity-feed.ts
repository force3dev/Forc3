import { prisma } from './prisma'

// ─── Activity Feed Utility ─────────────────────────────────────────────────────

export async function postToFeed(
  userId: string,
  type: string,
  data: object,
  isPublic = true
) {
  try {
    await prisma.activity.create({
      data: { userId, type, data, isPublic },
    })
  } catch (err) {
    console.error('[activity-feed] Failed to post activity:', err)
  }
}
