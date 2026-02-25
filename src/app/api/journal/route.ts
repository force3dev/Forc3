import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/session'

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const entries = await prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30,
    })

    return NextResponse.json({ entries })
  } catch {
    return NextResponse.json({ error: 'Failed to get journal entries' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { entry, mood, date } = await req.json()

    const journalEntry = await prisma.journalEntry.create({
      data: {
        userId,
        entry,
        mood: mood || null,
        date: date ? new Date(date) : new Date(),
      },
    })

    return NextResponse.json({ entry: journalEntry })
  } catch {
    return NextResponse.json({ error: 'Failed to save journal entry' }, { status: 500 })
  }
}
