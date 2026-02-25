import { prisma } from '@/lib/prisma'

export async function createWorkoutPost(userId: string, workoutData: any) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, isPrivate: true }
    })
    if (user?.isPrivate) return null

    return prisma.activity.create({
      data: {
        userId,
        type: 'workout_completed',
        data: {
          name: workoutData.name || 'Workout Complete',
          exerciseCount: workoutData.exercises?.length || 0,
          totalVolume: workoutData.totalVolume || 0,
          duration: workoutData.duration || 0,
          logId: workoutData.id,
        },
        isPublic: true,
      }
    })
  } catch {
    return null
  }
}

export async function getFeed(userId: string, page = 0) {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true }
  })
  const followingIds = following.map(f => f.followingId)

  return prisma.activity.findMany({
    where: { userId: { in: [...followingIds, userId] }, isPublic: true },
    include: {
      user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      reactions: true,
      feedComments: {
        include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
        take: 3,
        orderBy: { createdAt: 'desc' }
      },
      _count: { select: { reactions: true, feedComments: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    skip: page * 20,
  })
}
