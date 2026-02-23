
import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';
export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY! });

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId } });
  const raceGoals = profile?.raceGoals as Array<{ type: string; date: string; priority: string }> | null;
  const primaryRace = raceGoals?.find(r => r.priority === 'A') || raceGoals?.[0];

  if (!primaryRace) return NextResponse.json({ error: 'No race goal set' }, { status: 404 });

  const raceDate = new Date(primaryRace.date);
  const daysUntilRace = Math.floor((raceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const prompt = `Generate a race week training plan.
Race: ${primaryRace.type} on ${raceDate.toDateString()}
Days until race: ${daysUntilRace}

Race week plan (Mon-Sun):
- Monday-Wednesday: very light maintenance
- Thursday: complete rest  
- Friday: 20-min shakeout
- Saturday: rest/prep
- Sunday: RACE DAY

Include race morning routine: wake time, breakfast, warm up.
Keep volume under 30% of normal. Coach tone: calm, confident.`;

  const msg = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  const plan = (msg.content[0] as { type: string; text: string }).text;
  return NextResponse.json({ plan, raceDate: primaryRace.date, raceType: primaryRace.type, daysUntilRace });
}
