import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { AI_MODELS } from '@/lib/ai/models'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workoutId, reason, exercisesToSwap } = await request.json()

    // Get the workout with exercises
    const workout = await prisma.workout.findFirst({
      where: { id: workoutId, plan: { userId } },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!workout) return NextResponse.json({ error: 'Workout not found' }, { status: 404 })

    const exerciseList = workout.exercises.map(e =>
      `- ${e.exercise.name} (${e.sets}×${e.repsMin}-${e.repsMax})`
    ).join('\n')

    const prompt = `A user has the following workout planned:

${workout.name}
${exerciseList}

They say: "${reason}"

Exercises they want swapped: ${exercisesToSwap?.join(', ') || 'Let you decide based on their reason'}

Please:
1. Identify which exercises to swap out based on their reason
2. Suggest replacements that target similar muscles but avoid the issue
3. Give brief coaching notes for each swap

Respond in JSON format:
{
  "swaps": [
    {
      "original": "Exercise Name",
      "replacement": "New Exercise Name",
      "reason": "Why this swap works",
      "sets": 3,
      "repsMin": 8,
      "repsMax": 12
    }
  ],
  "coachMessage": "A brief motivating message about today's modified session"
}`

    const message = await anthropic.messages.create({
      model: AI_MODELS.BALANCED,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    let parsed
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { swaps: [], coachMessage: content }
    } catch {
      parsed = { swaps: [], coachMessage: content }
    }

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('Swap workout error:', error?.message)
    return NextResponse.json({ error: 'Could not swap workout' }, { status: 500 })
  }
}
