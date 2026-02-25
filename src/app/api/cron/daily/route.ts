import { NextResponse } from 'next/server'
import { runDailyJobs } from '@/lib/jobs/cron'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await runDailyJobs()
  return NextResponse.json({ ok: true })
}
