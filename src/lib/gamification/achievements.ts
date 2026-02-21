import { prisma } from "@/lib/prisma";

// ─── Achievement Definitions ──────────────────────────────────────────────────

export const ACHIEVEMENT_DEFS = [
  {
    code: "first_workout",
    name: "First Sweat",
    description: "Complete your first workout",
    icon: "🏋️",
    category: "milestone",
    requirement: JSON.stringify({ type: "workouts_completed", value: 1 }),
    xpReward: 50,
  },
  {
    code: "ten_workouts",
    name: "Getting Consistent",
    description: "Complete 10 workouts",
    icon: "💪",
    category: "milestone",
    requirement: JSON.stringify({ type: "workouts_completed", value: 10 }),
    xpReward: 100,
  },
  {
    code: "fifty_workouts",
    name: "Dedicated Athlete",
    description: "Complete 50 workouts",
    icon: "🔑",
    category: "milestone",
    requirement: JSON.stringify({ type: "workouts_completed", value: 50 }),
    xpReward: 250,
  },
  {
    code: "first_pr",
    name: "Personal Best",
    description: "Set your first personal record",
    icon: "🏆",
    category: "strength",
    requirement: JSON.stringify({ type: "prs_total", value: 1 }),
    xpReward: 75,
  },
  {
    code: "ten_prs",
    name: "PR Machine",
    description: "Set 10 personal records",
    icon: "🥇",
    category: "strength",
    requirement: JSON.stringify({ type: "prs_total", value: 10 }),
    xpReward: 200,
  },
  {
    code: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day workout streak",
    icon: "🔥",
    category: "consistency",
    requirement: JSON.stringify({ type: "streak", value: 7 }),
    xpReward: 150,
  },
  {
    code: "streak_30",
    name: "Iron Discipline",
    description: "Maintain a 30-day workout streak",
    icon: "⚡",
    category: "consistency",
    requirement: JSON.stringify({ type: "streak", value: 30 }),
    xpReward: 500,
  },
  {
    code: "volume_100k",
    name: "Century Club",
    description: "Lift 100,000 lbs total volume",
    icon: "🦾",
    category: "strength",
    requirement: JSON.stringify({ type: "total_volume", value: 100000 }),
    xpReward: 300,
  },
  {
    code: "sets_100",
    name: "The Grinder",
    description: "Log 100 total sets",
    icon: "⚙️",
    category: "milestone",
    requirement: JSON.stringify({ type: "total_sets", value: 100 }),
    xpReward: 100,
  },
  {
    code: "nutrition_logged",
    name: "Fueled Right",
    description: "Log your nutrition for the first time",
    icon: "🥗",
    category: "nutrition",
    requirement: JSON.stringify({ type: "nutrition_logs", value: 1 }),
    xpReward: 50,
  },
  {
    code: "nutrition_week",
    name: "Macro Master",
    description: "Log nutrition for 7 consecutive days",
    icon: "📊",
    category: "nutrition",
    requirement: JSON.stringify({ type: "nutrition_streak", value: 7 }),
    xpReward: 200,
  },
  {
    code: "perfect_week",
    name: "Perfect Week",
    description: "Hit 100% of your weekly training sessions",
    icon: "⭐",
    category: "consistency",
    requirement: JSON.stringify({ type: "weekly_compliance", value: 1 }),
    xpReward: 150,
  },
] as const;

// ─── Seeder ───────────────────────────────────────────────────────────────────

export async function seedAchievements() {
  for (const def of ACHIEVEMENT_DEFS) {
    await prisma.achievement.upsert({
      where: { code: def.code },
      update: { name: def.name, description: def.description, icon: def.icon, xpReward: def.xpReward },
      create: def,
    });
  }
}

// ─── Checker ─────────────────────────────────────────────────────────────────

export interface NewAchievement {
  code: string;
  name: string;
  icon: string;
  xpReward: number;
}

export async function checkAndAwardAchievements(userId: string): Promise<NewAchievement[]> {
  // Gather current user stats
  const [logs, prs, streak, profile] = await Promise.all([
    prisma.workoutLog.findMany({
      where: { userId, completedAt: { not: null } },
      include: { exerciseLogs: { include: { sets: true } } },
    }),
    prisma.personalRecord.findMany({ where: { userId } }),
    prisma.streak.findUnique({ where: { userId } }),
    prisma.profile.findUnique({ where: { userId } }),
  ]);

  const totalWorkouts = logs.length;
  const totalSets = logs.reduce((s, l) => s + l.exerciseLogs.reduce((ss, el) => ss + el.sets.length, 0), 0);
  const totalVolume = logs.reduce((s, l) =>
    s + l.exerciseLogs.reduce((ss, el) => ss + el.sets.reduce((sss, set) => sss + set.weight * set.reps, 0), 0), 0
  );
  const totalPRs = prs.length;
  const currentStreak = streak?.currentStreak || 0;

  // Nutrition logs count
  const nutritionCount = await prisma.nutritionLog.count({ where: { userId } });

  // Get already-unlocked achievements
  const unlocked = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const unlockedIds = new Set(unlocked.map(u => u.achievementId));

  // Get all achievement records
  const allAchievements = await prisma.achievement.findMany();

  // Weekly compliance check
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const plan = await prisma.trainingPlan.findUnique({ where: { userId } });
  const targetDays = plan?.daysPerWeek || 4;
  const thisWeekCount = logs.filter(l => new Date(l.startedAt) >= monday).length;
  const weekCompliance = thisWeekCount >= targetDays ? 1 : 0;

  const newlyAwarded: NewAchievement[] = [];

  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;

    const req = JSON.parse(achievement.requirement);
    let met = false;

    switch (req.type) {
      case "workouts_completed": met = totalWorkouts >= req.value; break;
      case "prs_total": met = totalPRs >= req.value; break;
      case "streak": met = currentStreak >= req.value; break;
      case "total_volume": met = totalVolume >= req.value; break;
      case "total_sets": met = totalSets >= req.value; break;
      case "nutrition_logs": met = nutritionCount >= req.value; break;
      case "nutrition_streak": met = nutritionCount >= req.value * 3; break; // approx 3 logs/day
      case "weekly_compliance": met = weekCompliance >= req.value && thisWeekCount > 0; break;
    }

    if (met) {
      await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });
      newlyAwarded.push({
        code: achievement.code,
        name: achievement.name,
        icon: achievement.icon,
        xpReward: achievement.xpReward,
      });
    }
  }

  return newlyAwarded;
}
