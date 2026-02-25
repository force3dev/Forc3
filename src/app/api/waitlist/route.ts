import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, name, goal, source } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    await prisma.waitlistEntry.upsert({
      where: { email: email.toLowerCase() },
      update: {},
      create: { email: email.toLowerCase(), name, goal, source: source || 'landing' }
    })

    // Send welcome email if Resend configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
          to: email,
          subject: "You're on the FORC3 waitlist 🔥",
          html: `<h2>Welcome to FORC3</h2><p>You're on the list. We'll reach out when premium is available.</p>`,
        })
      } catch {}
    }

    const position = await prisma.waitlistEntry.count()
    return NextResponse.json({ success: true, position })
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ success: true, alreadyJoined: true })
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
