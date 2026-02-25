import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/session'
import { awardXP } from '@/lib/services/xp.service'
import { updateStreak } from '@/lib/services/streak.service'
import { checkAndAwardAchievements } from '@/lib/services/achievement.service'
import { createWorkoutPost } from '@/lib/services/post.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { workoutId, name, startedAt, exercises, notes } = body

    if (!workoutId) return NextResponse.json({ error: 'workoutId required' }, { status: 400 })

    const duration = startedAt
      ? Math.round((Date.now() - new Date(startedAt).getTime()) / 60000)
      : 45

    // Create workout log
    const log = await prisma.workoutLog.create({
      data: {
        userId,
        workoutId,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        completedAt: new Date(),
        duration,
        notes,
      }
    })

    // Create exercise logs
    const newPRs: { exerciseName: string; weight: number; reps: number }[] = []
    if (exercises?.length) {
      for (const ex of exercises) {
        if (!ex.exerciseId) continue
        const exLog = await prisma.exerciseLog.create({
          data: { workoutLogId: log.id, exerciseId: ex.exerciseId }
        })

        let setNumber = 1
        for (const set of (ex.sets || [])) {
          if (!set.weight || !set.reps) { setNumber++; continue }
          await prisma.setLog.create({
            data: {
              exerciseLogId: exLog.id,
              setNumber,
              weight: set.weight,
              reps: set.reps,
              rpe: set.rpe || null,
            }
          })

          // Check for PR (1RM via Epley formula)
          const estimated1RM = Math.round(set.weight * (1 + set.reps / 30))
          const existing = await prisma.personalRecord.findFirst({
            where: { userId, exerciseId: ex.exerciseId, type: '1rm' },
            orderBy: { value: 'desc' }
          })

          if (!existing || estimated1RM > existing.value) {
            await prisma.personalRecord.create({
              data: {
                userId,
                exerciseId: ex.exerciseId,
                type: '1rm',
                value: estimated1RM,
                reps: set.reps,
              }
            })
            newPRs.push({ exerciseName: ex.name || ex.exerciseId, weight: set.weight, reps: set.reps })
          }

          setNumber++
        }
      }
    }

    // Award XP
    const baseXP = await awardXP(userId, 'COMPLETE_WORKOUT')
    let prXP = null
    if (newPRs.length > 0) {
      prXP = await awardXP(userId, 'NEW_PR')
    }

    // Update streak
    const streak = await updateStreak(userId)

    // Check achievements
    const newAchievements = await checkAndAwardAchievements(userId)

    // Create social post
    await createWorkoutPost(userId, {
      id: log.id,
      name: name || 'Workout',
      exercises,
      duration,
    })

    return NextResponse.json({
      success: true,
      workoutLog: log,
      newPRs,
      xpAwarded: baseXP.xpAwarded + (prXP?.xpAwarded || 0),
      leveledUp: baseXP.leveledUp || prXP?.leveledUp,
      newLevel: baseXP.leveledUp ? baseXP.newLevel : prXP?.newLevel,
      streak: { current: (streak as any).currentStreak, longest: (streak as any).longestStreak },
      newAchievements,
    })
  } catch (error: any) {
    console.error('Workout complete error:', error?.message)
    return NextResponse.json({ error: 'Could not save workout' }, { status: 500 })
  }
}
