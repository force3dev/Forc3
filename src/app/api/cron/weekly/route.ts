import { NextResponse } from 'next/server'
import { runWeeklyJobs } from '@/lib/jobs/cron'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await runWeeklyJobs()
  return NextResponse.json({ ok: true })
}
