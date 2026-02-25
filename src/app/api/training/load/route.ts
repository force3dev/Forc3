import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/session'
import { calculateACWR } from '@/lib/training/acwr.service'

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await calculateACWR(userId)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to calculate training load' }, { status: 500 })
  }
}
