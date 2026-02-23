const fs = require('fs');
const path = require('path');

function write(filePath, content) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('✅', filePath);
}

// ─── API: Referral ────────────────────────────────────────────────────────────

write('src/app/api/referral/route.ts', `
import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, referralCredits: true, referralsSent: { select: { status: true } } },
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const totalReferrals = user.referralsSent.length;
  const converted = user.referralsSent.filter(r => r.status === 'converted').length;

  return NextResponse.json({
    code: user.referralCode || '',
    totalReferrals,
    converted,
    credits: user.referralCredits || 0,
  });
}
`);

write('src/app/api/referral/apply/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { referralCode } = await req.json();
  if (!referralCode) return NextResponse.json({ error: 'referralCode required' }, { status: 400 });

  const referrer = await prisma.user.findUnique({ where: { referralCode } });
  if (!referrer) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });

  await prisma.user.update({ where: { id: userId }, data: { referredBy: referralCode } });
  await prisma.referral.create({
    data: { referrerId: referrer.id, referredId: userId, referralCode, status: 'signed_up' },
  }).catch(() => {});

  // Extend trial
  await prisma.subscription.update({
    where: { userId },
    data: { trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
`);

write('src/app/api/referral/reward/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { referrerId } = await req.json();
  if (!referrerId) return NextResponse.json({ error: 'referrerId required' }, { status: 400 });

  await prisma.user.update({
    where: { id: referrerId },
    data: { referralCredits: { increment: 1 } },
  });

  await prisma.referral.updateMany({
    where: { referrerId, referredId: userId },
    data: { status: 'converted', rewardGiven: true, convertedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
`);

// ─── API: Admin Stats ─────────────────────────────────────────────────────────

write('src/app/api/admin/stats/route.ts', `
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const today = new Date(now); today.setHours(0, 0, 0, 0);

  const [
    totalUsers, premiumUsers, newUsersThisWeek,
    totalWorkouts, workoutsThisWeek,
    activeToday, activeThisWeek,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { tier: { not: 'free' } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.workoutLog.count({ where: { completedAt: { not: null } } }),
    prisma.workoutLog.count({ where: { completedAt: { gte: weekAgo } } }),
    prisma.workoutLog.groupBy({ by: ['userId'], where: { completedAt: { gte: today } } }).then(r => r.length),
    prisma.workoutLog.groupBy({ by: ['userId'], where: { completedAt: { gte: weekAgo } } }).then(r => r.length),
  ]);

  const mrr = premiumUsers * 14.99;
  const avgWorkoutsPerUser = totalUsers > 0 ? (workoutsThisWeek / Math.max(activeThisWeek, 1)).toFixed(1) : '0';

  return NextResponse.json({
    totalUsers,
    premiumUsers,
    newUsersThisWeek,
    totalWorkouts,
    workoutsThisWeek,
    activeToday,
    activeThisWeek,
    mrr: Math.round(mrr * 100) / 100,
    avgWorkoutsPerUser,
  });
}
`);

write('src/app/api/admin/users/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;
  const tier = searchParams.get('tier');
  const search = searchParams.get('q');

  const where: Record<string, unknown> = {};
  if (tier) where.subscription = { tier };
  if (search) where.OR = [{ email: { contains: search, mode: 'insensitive' } }, { displayName: { contains: search, mode: 'insensitive' } }];

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { subscription: true, streak: true, _count: { select: { workoutLogs: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  const { userId, tier, suspended } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  if (tier !== undefined) {
    await prisma.subscription.update({ where: { userId }, data: { tier } });
  }

  return NextResponse.json({ success: true });
}
`);

// ─── API: Email Routes ────────────────────────────────────────────────────────

write('src/app/api/emails/welcome/route.ts', `
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
`);

write('src/app/api/emails/streak-reminder/route.ts', `
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { streakAtRiskEmail } from '@/lib/email-templates';
export const dynamic = 'force-dynamic';

// Cron: runs daily at 6pm — sends streak reminder to users who haven't trained today
export async function GET() {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const streaks = await prisma.streak.findMany({
    where: { currentStreak: { gte: 3 }, lastWorkoutDate: { lt: today } },
    include: { user: { include: { profile: true } } },
    take: 500,
  });

  let sent = 0;
  for (const s of streaks) {
    try {
      const name = s.user.profile?.name || s.user.email.split('@')[0];
      const { subject, html } = streakAtRiskEmail(name, s.currentStreak);
      await sendEmail({ to: s.user.email, subject, html });
      sent++;
    } catch {}
  }

  return NextResponse.json({ sent });
}
`);

write('src/app/api/emails/weekly-recap/route.ts', `
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { weeklyRecapEmail } from '@/lib/email-templates';
export const dynamic = 'force-dynamic';

export async function GET() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    include: {
      profile: true,
      streak: true,
      workoutLogs: {
        where: { completedAt: { gte: weekAgo } },
        include: { exerciseLogs: { include: { sets: true } } },
      },
      personalRecords: { where: { achievedAt: { gte: weekAgo } } },
    },
    take: 1000,
  });

  let sent = 0;
  for (const user of users) {
    if (user.workoutLogs.length === 0) continue;
    try {
      const name = user.profile?.name || user.email.split('@')[0];
      const volume = user.workoutLogs.reduce((acc, log) =>
        acc + log.exerciseLogs.reduce((a, el) => a + el.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0), 0);
      const { subject, html } = weeklyRecapEmail(name, {
        workouts: user.workoutLogs.length,
        volume,
        streak: user.streak?.currentStreak || 0,
        prs: user.personalRecords.length,
      });
      await sendEmail({ to: user.email, subject, html });
      sent++;
    } catch {}
  }

  return NextResponse.json({ sent });
}
`);

// ─── API: Nutrition Coach ─────────────────────────────────────────────────────

write('src/app/api/nutrition/coach/route.ts', `
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

  const prompt = \`You are Coach Alex, expert sports nutritionist for hybrid athletes.

Today's training: \${todayWorkout?.workout?.name || 'Rest day'}
Current macros: \${Math.round(totals.protein)}g protein, \${Math.round(totals.carbs)}g carbs, \${Math.round(totals.fat)}g fat, \${Math.round(totals.calories)} kcal
Targets: \${target ? \`\${target.protein}g protein, \${target.carbs}g carbs, \${target.fat}g fat, \${target.calories} kcal\` : 'Not set'}
Phase: \${target?.phase || 'maintain'}

Give specific, actionable nutrition advice for today. Reference what they've eaten. Suggest foods to hit remaining targets. Under 80 words. Coach tone.\`;

  const msg = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const advice = (msg.content[0] as { type: string; text: string }).text;
  return NextResponse.json({ advice, totals, target });
}
`);

// ─── API: Injury ──────────────────────────────────────────────────────────────

write('src/app/api/injury/list/route.ts', `
import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const flags = await prisma.injuryFlag.findMany({
    where: { userId, acknowledged: false },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return NextResponse.json({ flags });
}
`);

write('src/app/api/injury/acknowledge/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  await prisma.injuryFlag.update({ where: { id, userId }, data: { acknowledged: true } });
  return NextResponse.json({ success: true });
}
`);

// ─── API: Race Planner ────────────────────────────────────────────────────────

write('src/app/api/race-planner/race-week/route.ts', `
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

  const prompt = \`Generate a race week training plan.
Race: \${primaryRace.type} on \${raceDate.toDateString()}
Days until race: \${daysUntilRace}

Race week plan (Mon-Sun):
- Monday-Wednesday: very light maintenance
- Thursday: complete rest  
- Friday: 20-min shakeout
- Saturday: rest/prep
- Sunday: RACE DAY

Include race morning routine: wake time, breakfast, warm up.
Keep volume under 30% of normal. Coach tone: calm, confident.\`;

  const msg = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  const plan = (msg.content[0] as { type: string; text: string }).text;
  return NextResponse.json({ plan, raceDate: primaryRace.date, raceType: primaryRace.type, daysUntilRace });
}
`);

// ─── API: Challenges ──────────────────────────────────────────────────────────

write('src/app/api/challenges/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const challenges = await prisma.challenge.findMany({
    where: { isActive: true },
    include: {
      entries: {
        orderBy: { progress: 'desc' },
        take: 10,
        include: { user: { select: { displayName: true, avatarUrl: true, username: true } } },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  const myEntries = await prisma.challengeEntry.findMany({
    where: { userId, challengeId: { in: challenges.map(c => c.id) } },
  });

  const myEntryMap = Object.fromEntries(myEntries.map(e => [e.challengeId, e]));

  return NextResponse.json({
    challenges: challenges.map(c => ({
      ...c,
      myEntry: myEntryMap[c.id] || null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { challengeId } = await req.json();

  const entry = await prisma.challengeEntry.upsert({
    where: { challengeId_userId: { challengeId, userId } },
    create: { challengeId, userId, progress: 0 },
    update: {},
  });

  return NextResponse.json({ entry });
}
`);

write('src/app/api/challenges/generate-weekly/route.ts', `
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

const WEEKLY_CHALLENGES = [
  { title: 'Run 20km This Week 🏃', type: 'run_distance', target: 20, unit: 'km', description: 'Log 20km of running across any sessions this week.' },
  { title: 'Complete 4 Workouts 💪', type: 'workout_count', target: 4, unit: 'workouts', description: 'Complete 4 strength or cardio workouts this week.' },
  { title: 'Train 5 Days in a Row 🔥', type: 'streak', target: 5, unit: 'days', description: 'Build a 5-day training streak.' },
  { title: 'Lift 10,000 lbs Total 🏋️', type: 'lift_volume', target: 10000, unit: 'lbs', description: 'Accumulate 10,000 lbs of total training volume.' },
];

export async function GET() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Deactivate old
  await prisma.challenge.updateMany({ where: { endDate: { lt: monday } }, data: { isActive: false } });

  // Check if this week's challenges already exist
  const existing = await prisma.challenge.count({ where: { startDate: { gte: monday, lte: sunday } } });
  if (existing > 0) return NextResponse.json({ message: 'Already generated', count: existing });

  const created = await prisma.challenge.createMany({
    data: WEEKLY_CHALLENGES.map(c => ({
      ...c,
      startDate: monday,
      endDate: sunday,
      isActive: true,
    })),
  });

  return NextResponse.json({ created: created.count });
}
`);

write('src/app/api/challenges/progress/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1); weekStart.setHours(0,0,0,0);

  const challenges = await prisma.challenge.findMany({ where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } } });

  for (const challenge of challenges) {
    let progress = 0;

    if (challenge.type === 'workout_count') {
      progress = await prisma.workoutLog.count({ where: { userId, completedAt: { gte: weekStart } } });
    } else if (challenge.type === 'lift_volume') {
      const logs = await prisma.workoutLog.findMany({
        where: { userId, completedAt: { gte: weekStart } },
        include: { exerciseLogs: { include: { sets: true } } },
      });
      progress = logs.reduce((acc, log) => acc + log.exerciseLogs.reduce((a, el) => a + el.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0), 0);
    } else if (challenge.type === 'run_distance') {
      const cardio = await prisma.cardioActivity.findMany({ where: { userId, completed: true, completedAt: { gte: weekStart }, type: { in: ['run', 'running'] } } });
      progress = cardio.reduce((acc, c) => acc + (c.distance || 0) / 1000, 0); // meters to km
    }

    const completed = progress >= challenge.target;
    await prisma.challengeEntry.upsert({
      where: { challengeId_userId: { challengeId: challenge.id, userId } },
      create: { challengeId: challenge.id, userId, progress, completed, completedAt: completed ? new Date() : null },
      update: { progress, completed: completed || undefined, completedAt: completed ? new Date() : undefined },
    });
  }

  return NextResponse.json({ updated: challenges.length });
}
`);

// ─── API: Leaderboard ─────────────────────────────────────────────────────────

write('src/app/api/leaderboard/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const metric = searchParams.get('metric') || 'workouts';
  const type = searchParams.get('type') || 'weekly';

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since = type === 'weekly' ? weekAgo : new Date(0);

  let entries: { userId: string; value: number }[] = [];

  if (metric === 'workouts') {
    const grouped = await prisma.workoutLog.groupBy({
      by: ['userId'],
      where: { completedAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 100,
    });
    entries = grouped.map(g => ({ userId: g.userId, value: g._count.id }));
  } else if (metric === 'streak') {
    const streaks = await prisma.streak.findMany({ orderBy: { currentStreak: 'desc' }, take: 100 });
    entries = streaks.map(s => ({ userId: s.userId, value: s.currentStreak }));
  }

  const userIds = entries.map(e => e.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true, username: true, avatarUrl: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const ranked = entries.map((e, i) => ({ rank: i + 1, user: userMap[e.userId], value: e.value }));
  const myRank = ranked.findIndex(r => r.user?.id === userId) + 1;

  return NextResponse.json({ entries: ranked, myRank: myRank || null, metric, type });
}
`);

// ─── API: Friends ─────────────────────────────────────────────────────────────

write('src/app/api/friends/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ userId, status: 'accepted' }, { friendId: userId, status: 'accepted' }] },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true, username: true, streak: true } },
      friend: { select: { id: true, displayName: true, avatarUrl: true, username: true, streak: true } },
    },
  });

  const friends = friendships.map(f => f.userId === userId ? f.friend : f.user);
  return NextResponse.json({ friends });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { friendId } = await req.json();
  if (!friendId || friendId === userId) return NextResponse.json({ error: 'Invalid friendId' }, { status: 400 });

  const friendship = await prisma.friendship.upsert({
    where: { userId_friendId: { userId, friendId } },
    create: { userId, friendId, status: 'pending' },
    update: {},
  });

  return NextResponse.json({ friendship });
}
`);

write('src/app/api/friends/search/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const users = await prisma.user.findMany({
    where: {
      id: { not: userId },
      OR: [
        { displayName: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
      ],
      isPrivate: false,
    },
    select: { id: true, displayName: true, username: true, avatarUrl: true, streak: { select: { currentStreak: true } } },
    take: 20,
  });

  return NextResponse.json({ results: users });
}
`);

write('src/app/api/friends/[friendId]/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { friendId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await req.json(); // 'accept' | 'decline'
  const { friendId } = params;

  if (action === 'accept') {
    await prisma.friendship.update({
      where: { userId_friendId: { userId: friendId, friendId: userId } },
      data: { status: 'accepted' },
    });
    // Create reciprocal
    await prisma.friendship.upsert({
      where: { userId_friendId: { userId, friendId } },
      create: { userId, friendId, status: 'accepted' },
      update: { status: 'accepted' },
    });
  } else {
    await prisma.friendship.delete({ where: { userId_friendId: { userId: friendId, friendId: userId } } }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { friendId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { friendId } = params;
  await prisma.friendship.deleteMany({ where: { OR: [{ userId, friendId }, { userId: friendId, friendId: userId }] } });
  return NextResponse.json({ success: true });
}
`);

// ─── App Pages ────────────────────────────────────────────────────────────────

write('src/app/admin/page.tsx', `
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalUsers: number; premiumUsers: number; newUsersThisWeek: number;
  mrr: number; totalWorkouts: number; workoutsThisWeek: number;
  activeToday: number; activeThisWeek: number; avgWorkoutsPerUser: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const cards = stats ? [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), sub: \`+\${stats.newUsersThisWeek} this week\`, color: "#0066FF" },
    { label: "Premium Users", value: stats.premiumUsers.toLocaleString(), sub: \`\${Math.round(stats.premiumUsers / Math.max(stats.totalUsers, 1) * 100)}% of users\`, color: "#00C853" },
    { label: "MRR", value: \`$\${stats.mrr.toLocaleString()}\`, sub: "Monthly recurring revenue", color: "#FFD700" },
    { label: "Active Today", value: stats.activeToday.toLocaleString(), sub: \`\${stats.activeThisWeek} this week\`, color: "#FF6B00" },
    { label: "Total Workouts", value: stats.totalWorkouts.toLocaleString(), sub: \`\${stats.workoutsThisWeek} this week\`, color: "#0066FF" },
    { label: "Avg Workouts/User", value: stats.avgWorkoutsPerUser, sub: "Per week", color: "#00C853" },
  ] : [];

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3 ADMIN</div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-white">← App</Link>
        </div>

        {/* Admin nav */}
        <div className="flex gap-2">
          {[{ label: "Overview", href: "/admin" }, { label: "Users", href: "/admin/users" }, { label: "Analytics", href: "/admin/analytics" }].map(n => (
            <Link key={n.href} href={n.href} className="px-4 py-2 bg-[#141414] border border-[#262626] rounded-xl text-sm hover:border-[#0066FF] transition-colors">
              {n.label}
            </Link>
          ))}
        </div>

        {/* Stats grid */}
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {cards.map(c => (
              <div key={c.label} className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <div className="text-xs text-neutral-500 mb-1">{c.label}</div>
                <div className="text-3xl font-black" style={{ color: c.color }}>{c.value}</div>
                <div className="text-xs text-neutral-600 mt-1">{c.sub}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-[#141414] border border-[#262626] rounded-2xl animate-pulse" />)}
          </div>
        )}
      </div>
    </main>
  );
}
`);

write('src/app/admin/users/page.tsx', `
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface AdminUser {
  id: string; email: string; displayName: string | null;
  createdAt: string; subscription: { tier: string } | null;
  streak: { currentStreak: number } | null;
  _count: { workoutLogs: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");

  function load() {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("q", search);
    if (tierFilter) params.set("tier", tierFilter);
    fetch(\`/api/admin/users?\${params}\`)
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setTotal(d.total || 0); })
      .catch(() => {});
  }

  useEffect(() => { load(); }, [page, search, tierFilter]); // eslint-disable-line

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Users ({total})</h1>
          <Link href="/admin" className="text-sm text-neutral-500">← Admin</Link>
        </div>

        <div className="flex gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email or name..."
            className="flex-1 bg-[#141414] border border-[#262626] rounded-xl px-4 py-2 text-sm" />
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
            className="bg-[#141414] border border-[#262626] rounded-xl px-3 py-2 text-sm">
            <option value="">All tiers</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="elite">Elite</option>
          </select>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[#262626]">
              <tr className="text-left text-neutral-500 text-xs">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Workouts</th>
                <th className="px-4 py-3">Streak</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.displayName || u.email.split('@')[0]}</div>
                    <div className="text-xs text-neutral-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={\`px-2 py-0.5 rounded-full text-xs font-bold \${u.subscription?.tier !== 'free' ? 'bg-[#0066FF]/20 text-[#0066FF]' : 'bg-[#262626] text-neutral-400'}\`}>
                      {u.subscription?.tier || 'free'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-300">{u._count.workoutLogs}</td>
                  <td className="px-4 py-3">{u.streak?.currentStreak || 0}🔥</td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 bg-[#141414] border border-[#262626] rounded-xl text-sm disabled:opacity-40">Prev</button>
          <span className="px-4 py-2 text-sm text-neutral-400">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 bg-[#141414] border border-[#262626] rounded-xl text-sm">Next</button>
        </div>
      </div>
    </main>
  );
}
`);

write('src/app/admin/analytics/page.tsx', `
"use client";
import Link from "next/link";

export default function AdminAnalyticsPage() {
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <Link href="/admin" className="text-sm text-neutral-500">← Admin</Link>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 text-center text-neutral-500">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-sm">Analytics charts coming soon.</p>
          <p className="text-xs mt-2">Install recharts: npm install recharts</p>
        </div>
      </div>
    </main>
  );
}
`);

write('src/app/join/page.tsx', `
"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function JoinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get("ref");

  useEffect(() => {
    if (ref) {
      localStorage.setItem("forc3_referral_code", ref);
    }
  }, [ref]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="text-5xl">🎁</div>
        <div>
          <div className="text-xs font-bold tracking-widest text-[#0066FF] mb-2">⚡ FORC3</div>
          <h1 className="text-3xl font-bold">Your friend invited you</h1>
          <p className="text-neutral-400 mt-3 leading-relaxed">
            {ref ? "You unlock a 14-day free trial instead of the standard 7 days." : "Join FORC3 — the hybrid athlete training app."}
          </p>
        </div>
        {ref && (
          <div className="bg-[#00C853]/10 border border-[#00C853]/30 rounded-2xl p-4 text-sm text-[#00C853] font-semibold">
            ✅ 14-day free trial applied
          </div>
        )}
        <div className="space-y-3">
          <Link href="/signup" className="block w-full py-4 bg-[#0066FF] text-white font-bold rounded-2xl text-lg">
            Create Free Account →
          </Link>
          <Link href="/" className="block text-neutral-500 text-sm hover:text-neutral-300">
            Learn more about FORC3
          </Link>
        </div>
      </div>
    </main>
  );
}
`);

write('src/app/community/page.tsx', `
"use client";
import { useEffect, useState } from "react";
import BottomNav from "@/components/shared/BottomNav";

interface Challenge {
  id: string; title: string; description: string; type: string;
  target: number; unit: string; startDate: string; endDate: string;
  entries: Array<{ progress: number; user: { displayName: string | null; avatarUrl: string | null } }>;
  myEntry: { progress: number; completed: boolean } | null;
}

interface LeaderEntry {
  rank: number;
  user: { id: string; displayName: string | null; username: string | null; avatarUrl: string | null };
  value: number;
}

interface FeedItem {
  id: string; type: string; data: Record<string, unknown>; createdAt: string;
  user: { displayName: string | null; avatarUrl: string | null; username: string | null };
}

export default function CommunityPage() {
  const [tab, setTab] = useState<"challenges" | "leaderboard" | "feed">("challenges");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [metric, setMetric] = useState("workouts");
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "challenges") {
      fetch("/api/challenges").then(r => r.json()).then(d => setChallenges(d.challenges || [])).catch(() => {});
    } else if (tab === "leaderboard") {
      fetch(\`/api/leaderboard?metric=\${metric}&type=weekly\`).then(r => r.json()).then(d => setLeaders(d.entries || [])).catch(() => {});
    } else if (tab === "feed") {
      fetch("/api/social/feed").then(r => r.json()).then(d => setFeed(d.activities || [])).catch(() => {});
    }
  }, [tab, metric]);

  async function joinChallenge(challengeId: string) {
    setJoining(challengeId);
    await fetch("/api/challenges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challengeId }) }).catch(() => {});
    fetch("/api/challenges").then(r => r.json()).then(d => setChallenges(d.challenges || [])).catch(() => {});
    setJoining(null);
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + "m ago";
    if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + "h ago";
    return Math.floor(diff / 86400000) + "d ago";
  }

  function feedDescription(item: FeedItem): string {
    const d = item.data;
    if (item.type === 'workout_complete') return \`completed \${d.workoutName || 'a workout'} 💪\`;
    if (item.type === 'pr') return \`hit a new \${d.exercise} PR 🏆\`;
    if (item.type === 'streak_milestone') return \`is on a \${d.days} day streak 🔥\`;
    if (item.type === 'challenge_complete') return \`completed the \${d.challengeTitle} challenge 🎯\`;
    return 'had an activity';
  }

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <header className="px-6 pt-8 pb-4">
        <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
        <h1 className="text-2xl font-bold mt-1">Community</h1>
      </header>

      {/* Tabs */}
      <div className="px-6 mb-4">
        <div className="flex bg-[#141414] rounded-2xl p-1 border border-[#262626]">
          {([["challenges", "Challenges"], ["leaderboard", "Leaderboard"], ["feed", "Feed"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={\`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors \${tab === id ? 'bg-[#0066FF] text-white' : 'text-neutral-500'}\`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-4">
        {tab === "challenges" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {challenges.map(c => {
                const pct = c.myEntry ? Math.min(100, (c.myEntry.progress / c.target) * 100) : 0;
                const topUsers = c.entries.slice(0, 3);
                return (
                  <div key={c.id} className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-3">
                    <div className="font-semibold text-sm leading-snug">{c.title}</div>
                    <div className="text-xs text-neutral-500">{c.target} {c.unit}</div>
                    {c.myEntry ? (
                      <div className="space-y-1">
                        <div className="text-xs text-neutral-400">{Math.round(c.myEntry.progress)} / {c.target} {c.unit}</div>
                        <div className="h-1.5 bg-[#262626] rounded-full">
                          <div className="h-full bg-[#0066FF] rounded-full" style={{ width: \`\${pct}%\` }} />
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => joinChallenge(c.id)} disabled={joining === c.id}
                        className="w-full py-1.5 bg-[#0066FF] text-white text-xs font-bold rounded-lg disabled:opacity-50">
                        {joining === c.id ? "..." : "Join"}
                      </button>
                    )}
                    {topUsers.length > 0 && (
                      <div className="flex gap-1">
                        {topUsers.map((e, i) => (
                          <div key={i} className="w-6 h-6 bg-[#0066FF] rounded-full flex items-center justify-center text-xs font-bold">
                            {(e.user.displayName || '?')[0]}
                          </div>
                        ))}
                        <span className="text-xs text-neutral-500 self-center ml-1">{c.entries.length} joined</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {challenges.length === 0 && (
              <p className="text-neutral-500 text-sm text-center py-8">No active challenges this week.</p>
            )}
          </>
        )}

        {tab === "leaderboard" && (
          <>
            <div className="flex gap-2">
              {(["workouts", "streak"] as const).map(m => (
                <button key={m} onClick={() => setMetric(m)}
                  className={\`px-4 py-1.5 rounded-full text-xs font-bold transition-colors \${metric === m ? 'bg-[#0066FF] text-white' : 'bg-[#141414] border border-[#262626] text-neutral-400'}\`}>
                  {m === 'workouts' ? '💪 Workouts' : '🔥 Streak'}
                </button>
              ))}
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
              {leaders.slice(0, 20).map(entry => (
                <div key={entry.rank} className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] last:border-0">
                  <div className={\`w-7 text-center font-black \${entry.rank <= 3 ? ['text-yellow-400', 'text-neutral-300', 'text-orange-400'][entry.rank - 1] : 'text-neutral-600'} text-sm\`}>
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : \`#\${entry.rank}\`}
                  </div>
                  <div className="w-8 h-8 bg-[#0066FF] rounded-full flex items-center justify-center font-bold text-sm">
                    {(entry.user?.displayName || entry.user?.username || '?')[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{entry.user?.displayName || entry.user?.username || 'Athlete'}</div>
                  </div>
                  <div className="font-black text-[#0066FF]">{entry.value}{metric === 'streak' ? '🔥' : ''}</div>
                </div>
              ))}
              {leaders.length === 0 && <p className="text-neutral-500 text-sm text-center py-8">No data yet.</p>}
            </div>
          </>
        )}

        {tab === "feed" && (
          <div className="space-y-3">
            {feed.map((item: FeedItem) => (
              <div key={item.id} className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 bg-[#0066FF] rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {(item.user?.displayName || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold">{item.user?.displayName || item.user?.username || 'Athlete'} </span>
                  <span className="text-neutral-400 text-sm">{feedDescription(item)}</span>
                  <div className="text-xs text-neutral-600 mt-1">{timeAgo(item.createdAt)}</div>
                </div>
              </div>
            ))}
            {feed.length === 0 && <p className="text-neutral-500 text-sm text-center py-8">No activity yet. Start training!</p>}
          </div>
        )}
      </div>

      <BottomNav active="home" />
    </main>
  );
}
`);

write('src/app/race-planner/page.tsx', `
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";
import { getRacePhase, getRacePhaseName, calculateTaper } from "@/lib/taper-calculator";

interface RaceWeekData {
  plan: string;
  raceDate: string;
  raceType: string;
  daysUntilRace: number;
}

const PHASES = ["base", "build", "peak", "taper", "race_week", "race_day"];

const CHECKLIST: Record<string, string[]> = {
  marathon: ["Book travel & accommodation", "Pick up race packet", "Plan nutrition strategy", "Prepare race kit", "Set race morning alarm", "Pack gels/nutrition", "Charge GPS watch"],
  half_marathon: ["Book travel", "Race packet pickup", "Plan nutrition", "Prepare kit", "Sleep strategy"],
  "5k": ["Warm-up routine", "Pace strategy", "Race kit ready"],
  ironman: ["Transition bags packed", "Wetsuit ready", "Bike tuned", "Nutrition per leg planned", "Pacing zones set"],
  spartan: ["Grip gloves ready", "Trail shoes prepped", "Obstacle practice", "Pack energy gels"],
};

export default function RacePlannerPage() {
  const router = useRouter();
  const [data, setData] = useState<RaceWeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/race-planner/race-week")
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Failed to load race plan"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full" />
    </main>
  );

  if (error || !data) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="text-4xl">🏁</div>
        <h2 className="text-xl font-bold">No Race Goal Set</h2>
        <p className="text-neutral-400 text-sm">Add a race goal in your profile to unlock the race planner.</p>
        <button onClick={() => router.push("/settings/profile")} className="px-6 py-3 bg-[#0066FF] rounded-xl font-bold text-sm">
          Set Race Goal →
        </button>
      </div>
    </main>
  );

  const raceDate = new Date(data.raceDate);
  const phase = getRacePhase(raceDate, data.raceType);
  const taper = calculateTaper(raceDate, data.raceType);
  const checklist = CHECKLIST[data.raceType] || CHECKLIST.marathon;
  const currentPhaseIdx = PHASES.indexOf(phase);

  // Countdown
  const days = data.daysUntilRace;
  const hours = Math.floor((raceDate.getTime() - Date.now()) / 3600000) % 24;

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <header className="px-6 pt-8 pb-4">
        <div className="text-xs font-bold tracking-widest text-[#0066FF]">RACE PLANNER</div>
        <h1 className="text-2xl font-bold mt-1 capitalize">{data.raceType.replace('_', ' ')}</h1>
        <p className="text-neutral-400 text-sm">{raceDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </header>

      <div className="px-6 space-y-5">
        {/* Countdown */}
        <div className="bg-gradient-to-br from-[#0066FF]/20 to-[#00C853]/10 border border-[#0066FF]/40 rounded-2xl p-6 text-center">
          <div className="text-5xl font-black">{days}<span className="text-2xl font-bold text-neutral-400">d</span> {hours}<span className="text-2xl font-bold text-neutral-400">h</span></div>
          <div className="text-neutral-400 text-sm mt-1">until race day</div>
        </div>

        {/* Phase progress */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Training Phase</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {PHASES.map((p, i) => (
              <div key={p} className={\`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-semibold transition-colors \${i === currentPhaseIdx ? 'bg-[#0066FF] text-white' : i < currentPhaseIdx ? 'bg-[#00C853]/20 text-[#00C853]' : 'bg-[#1a1a1a] text-neutral-600'}\`}>
                {getRacePhaseName(p)}
              </div>
            ))}
          </div>
          <div className="text-sm font-semibold">Current: <span className="text-[#0066FF]">{getRacePhaseName(phase)}</span></div>
          {phase === 'taper' && <p className="text-xs text-neutral-400">Taper starts {taper.taperStart.toLocaleDateString()} · Reduce volume to {Math.round((taper.volumeReduction[0] || 0.7) * 100)}% this week</p>}
        </div>

        {/* AI Race Week Plan */}
        {data.plan && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-2">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">This Week&apos;s Focus</div>
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{data.plan}</p>
          </div>
        )}

        {/* Race Day Checklist */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-3">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Race Day Checklist</div>
          {checklist.map(item => (
            <ChecklistItem key={item} label={item} />
          ))}
        </div>
      </div>

      <BottomNav active="home" />
    </main>
  );
}

function ChecklistItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <button onClick={() => setChecked(!checked)} className="flex items-center gap-3 w-full text-left">
      <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 \${checked ? 'bg-[#00C853] border-[#00C853]' : 'border-[#333]'}\`}>
        {checked && <span className="text-black text-xs">✓</span>}
      </div>
      <span className={\`text-sm \${checked ? 'line-through text-neutral-600' : 'text-neutral-200'}\`}>{label}</span>
    </button>
  );
}
`);

write('src/app/profile/[userId]/page.tsx', `
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

interface UserProfile {
  id: string; displayName: string | null; username: string | null;
  avatarUrl: string | null; bio: string | null;
  streak: { currentStreak: number; totalWorkouts: number } | null;
  followersCount: number; followingCount: number; workoutsCount: number;
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friendStatus, setFriendStatus] = useState<"none" | "pending" | "accepted">("none");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(\`/api/social/user?userId=\${userId}\`)
      .then(r => r.json())
      .then(d => setProfile(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  async function sendFriendRequest() {
    await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ friendId: userId }) });
    setFriendStatus("pending");
  }

  if (loading) return <main className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full" /></main>;

  if (!profile) return <main className="min-h-screen bg-black text-white flex items-center justify-center"><p>User not found</p></main>;

  const initials = (profile.displayName || profile.username || '?').slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <header className="px-6 pt-8 pb-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center text-neutral-400">←</button>
        <span className="font-semibold">Profile</span>
      </header>

      <div className="px-6 space-y-5">
        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0066FF] to-[#00C853] flex items-center justify-center text-2xl font-black">
            {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" /> : initials}
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile.displayName || profile.username}</h1>
            {profile.username && <p className="text-neutral-500 text-sm">@{profile.username}</p>}
            {profile.bio && <p className="text-neutral-400 text-sm mt-1">{profile.bio}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-[#FF6B00]">{profile.streak?.currentStreak || 0}🔥</div>
            <div className="text-xs text-neutral-500">Streak</div>
          </div>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-center">
            <div className="text-2xl font-black">{profile.workoutsCount}</div>
            <div className="text-xs text-neutral-500">Workouts</div>
          </div>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-center">
            <div className="text-2xl font-black">{profile.followersCount}</div>
            <div className="text-xs text-neutral-500">Followers</div>
          </div>
        </div>

        {/* Friend button */}
        {friendStatus === "none" && (
          <button onClick={sendFriendRequest} className="w-full py-3 bg-[#0066FF] text-white font-bold rounded-xl">
            Add Friend
          </button>
        )}
        {friendStatus === "pending" && (
          <div className="w-full py-3 bg-[#1a1a1a] border border-[#262626] text-neutral-400 font-semibold rounded-xl text-center text-sm">
            Request Sent ✓
          </div>
        )}
        {friendStatus === "accepted" && (
          <div className="w-full py-3 bg-[#00C853]/10 border border-[#00C853]/30 text-[#00C853] font-semibold rounded-xl text-center text-sm">
            Friends ✓
          </div>
        )}
      </div>

      <BottomNav active="home" />
    </main>
  );
}
`);

// ─── Add referral to settings ─────────────────────────────────────────────────

console.log('\n✅ All files created!');
console.log('\n📋 Next steps:');
console.log('  npm install stripe @stripe/stripe-js resend recharts');
console.log('  npx prisma db push --accept-data-loss');
console.log('  npm run build');
