import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/session'
import { getUserSeasonData } from '@/lib/seasons/season.service'

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await getUserSeasonData(userId)
    if (!data) return NextResponse.json({ season: null })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to get season data' }, { status: 500 })
  }
}
