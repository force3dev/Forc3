
import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';
export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY! });

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayLogs, todayWorkout, target] = await Promise.all([
    prisma.nutritionLog.findMany({ where: { userId, date: { gte: today, lt: tomorrow } } }),
    prisma.workoutLog.findFirst({ where: { userId, startedAt: { gte: today } }, include: { workout: { select: { name: true } } } }),
    prisma.nutritionTarget.findUnique({ where: { userId } }),
  ]);

  const totals = todayLogs.reduce((acc, l) => ({
    calories: acc.calories + l.calories,
    protein: acc.protein + l.protein,
    carbs: acc.carbs + l.carbs,
    fat: acc.fat + l.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const prompt = `You are Coach Alex, expert sports nutritionist for hybrid athletes.

Today's training: ${todayWorkout?.workout?.name || 'Rest day'}
Current macros: ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, ${Math.round(totals.fat)}g fat, ${Math.round(totals.calories)} kcal
Targets: ${target ? `${target.protein}g protein, ${target.carbs}g carbs, ${target.fat}g fat, ${target.calories} kcal` : 'Not set'}
Phase: ${target?.phase || 'maintain'}

Give specific, actionable nutrition advice for today. Reference what they've eaten. Suggest foods to hit remaining targets. Under 80 words. Coach tone.`;

  const msg = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const advice = (msg.content[0] as { type: string; text: string }).text;
  return NextResponse.json({ advice, totals, target });
}
