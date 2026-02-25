import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/session'

// In-memory store for live sessions (use Redis in production)
const sessions = new Map<string, {
  id: string
  roomCode: string
  participants: string[]
  updates: Array<{ userId: string; userName: string; exercise: string; weight: number; reps: number; timestamp: number }>
  createdAt: number
}>()

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'FORC3-' + Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    if (body.action === 'create') {
      const roomCode = generateRoomCode()
      const sessionId = `live_${Date.now()}_${Math.random().toString(36).slice(2)}`
      sessions.set(sessionId, {
        id: sessionId,
        roomCode,
        participants: [userId],
        updates: [],
        createdAt: Date.now(),
      })
      return NextResponse.json({ sessionId, roomCode })
    }

    if (body.action === 'join') {
      const session = Array.from(sessions.values()).find(s => s.roomCode === body.roomCode)
      if (!session) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      if (!session.participants.includes(userId)) session.participants.push(userId)
      return NextResponse.json({ sessionId: session.id, roomCode: session.roomCode })
    }

    if (body.action === 'update') {
      const session = sessions.get(body.sessionId)
      if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      session.updates.push({
        userId,
        userName: body.userName || 'Athlete',
        exercise: body.exercise,
        weight: body.weight,
        reps: body.reps,
        timestamp: Date.now(),
      })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const sessionId = url.searchParams.get('sessionId')
    const since = parseInt(url.searchParams.get('since') || '0')

    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    const session = sessions.get(sessionId)
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const updates = session.updates.filter(u => u.timestamp > since)
    return NextResponse.json({ updates })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
