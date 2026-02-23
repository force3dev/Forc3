import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Monthly boss definitions
const BOSS_TEMPLATES = [
  { name: "The Iron Golem", description: "A creature forged from cold iron. Crush it with raw volume.", bossIcon: "🪨", requirements: [{ type: "workouts", target: 12, unit: "sessions", label: "Complete 12 workouts" }, { type: "volume", target: 50000, unit: "kg", label: "Lift 50,000 kg total" }], xpReward: 750 },
  { name: "Shadow Phantom", description: "It feeds on missed sessions. Don't give it an inch.", bossIcon: "👻", requirements: [{ type: "workouts", target: 15, unit: "sessions", label: "Complete 15 workouts" }, { type: "streak", target: 7, unit: "days", label: "Hit a 7-day streak" }], xpReward: 600 },
  { name: "The Kraken", description: "A beast of endurance. Outlast it.", bossIcon: "🦑", requirements: [{ type: "workouts", target: 10, unit: "sessions", label: "Complete 10 workouts" }, { type: "cardio_minutes", target: 300, unit: "minutes", label: "Log 300 minutes of cardio" }], xpReward: 700 },
  { name: "Thunder Drake", description: "Speed and power. Match its energy.", bossIcon: "🐉", requirements: [{ type: "workouts", target: 16, unit: "sessions", label: "Complete 16 workouts" }, { type: "prs", target: 3, unit: "PRs", label: "Hit 3 new PRs" }], xpReward: 800 },
  { name: "The Colossus", description: "Immovable. Unstoppable. Unless you show up every day.", bossIcon: "⚡", requirements: [{ type: "workouts", target: 20, unit: "sessions", label: "Complete 20 workouts" }, { type: "streak", target: 14, unit: "days", label: "Maintain 14-day streak" }], xpReward: 1000 },
  { name: "Frost Wraith", description: "Tries to freeze your gains. Keep moving.", bossIcon: "❄️", requirements: [{ type: "workouts", target: 12, unit: "sessions", label: "Complete 12 workouts" }, { type: "cardio_minutes", target: 200, unit: "minutes", label: "Log 200 minutes of cardio" }], xpReward: 650 },
];

async function seedBoss(month: number, year: number) {
  const templateIdx = (month - 1) % BOSS_TEMPLATES.length;
  const template = BOSS_TEMPLATES[templateIdx];

  return prisma.bossBattle.upsert({
    where: { month_year: { month, year } },
    create: { month, year, ...template },
    update: {},
  });
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const boss = await seedBoss(month, year);

  const entry = await prisma.bossBattleEntry.findUnique({
    where: { userId_bossBattleId: { userId, bossBattleId: boss.id } },
  });

  // Count total defeated for community stat
  const defeatedCount = await prisma.bossBattleEntry.count({
    where: { bossBattleId: boss.id, defeated: true },
  });

  return NextResponse.json({ boss, entry, defeatedCount });
}

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const boss = await seedBoss(month, year);

  const entry = await prisma.bossBattleEntry.upsert({
    where: { userId_bossBattleId: { userId, bossBattleId: boss.id } },
    create: {
      userId,
      bossBattleId: boss.id,
      progress: { workouts: 0, volume: 0, cardio_minutes: 0, streak: 0, prs: 0 },
    },
    update: {},
  });

  return NextResponse.json({ boss, entry });
}
