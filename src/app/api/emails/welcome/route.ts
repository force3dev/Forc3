
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { welcomeEmail } from '@/lib/email-templates';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const name = user.profile?.name || user.email.split('@')[0];
  const { subject, html } = welcomeEmail(name);
  await sendEmail({ to: user.email, subject, html });

  return NextResponse.json({ success: true });
}
