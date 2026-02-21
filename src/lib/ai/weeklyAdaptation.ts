import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyAnalysis {
  weekStart: Date;
  weekEnd: Date;
  workoutsCompleted: number;
  targetWorkouts: number;
  totalVolume: number;
  avgRpe: number | null;
  prsHit: number;
  complianceRate: number; // 0-1
  volumeTrend: "increasing" | "decreasing" | "stable" | "first_week";
  strengthTrend: "increasing" | "decreasing" | "stable" | "first_week";
  recoveryScore: number; // 0-10
  insights: string[];
  recommendations: string[];
  nextWeekFocus: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekBounds(weeksAgo: number = 0): { start: Date; end: Date } {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - weeksAgo * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

// ─── Main Function ────────────────────────────────────────────────────────────

export async function analyzeWeek(userId: string): Promise<WeeklyAnalysis> {
  const { start: weekStart, end: weekEnd } = getWeekBounds(0);
  const { start: prevWeekStart, end: prevWeekEnd } = getWeekBounds(1);

  // Get training plan for targets
  const plan = await prisma.trainingPlan.findUnique({ where: { userId } });
  const targetWorkouts = plan?.daysPerWeek || 4;

  // Get this week's logs
  const thisWeekLogs = await prisma.workoutLog.findMany({
    where: {
      userId,
      startedAt: { gte: weekStart, lte: weekEnd },
      completedAt: { not: null },
    },
    include: {
      exerciseLogs: { include: { sets: true } },
    },
  });

  // Get last week's logs
  const lastWeekLogs = await prisma.workoutLog.findMany({
    where: {
      userId,
      startedAt: { gte: prevWeekStart, lte: prevWeekEnd },
      completedAt: { not: null },
    },
    include: {
      exerciseLogs: { include: { sets: true } },
    },
  });

  const workoutsCompleted = thisWeekLogs.length;

  // Calculate volume
  function calcVolume(logs: typeof thisWeekLogs): number {
    return logs.reduce((sum, log) =>
      sum + log.exerciseLogs.reduce((s, el) =>
        s + el.sets.reduce((ss, set) => ss + set.weight * set.reps, 0), 0
      ), 0
    );
  }

  const totalVolume = calcVolume(thisWeekLogs);
  const prevVolume = calcVolume(lastWeekLogs);

  // Calculate avg RPE
  const rpeLogs = thisWeekLogs.filter(l => l.overallRpe !== null);
  const avgRpe = rpeLogs.length > 0
    ? rpeLogs.reduce((s, l) => s + (l.overallRpe || 0), 0) / rpeLogs.length
    : null;

  // Count PRs this week
  const prsHit = thisWeekLogs.reduce((sum, log) =>
    sum + log.exerciseLogs.reduce((s, el) =>
      s + el.sets.filter(set => set.isPR).length, 0
    ), 0
  );

  const complianceRate = Math.min(1, workoutsCompleted / targetWorkouts);

  // Trends
  let volumeTrend: WeeklyAnalysis["volumeTrend"] = "first_week";
  let strengthTrend: WeeklyAnalysis["strengthTrend"] = "first_week";

  if (lastWeekLogs.length > 0) {
    const volDiff = ((totalVolume - prevVolume) / Math.max(prevVolume, 1)) * 100;
    volumeTrend = volDiff > 5 ? "increasing" : volDiff < -5 ? "decreasing" : "stable";
    strengthTrend = prsHit > 0 ? "increasing" : lastWeekLogs.length > 0 ? "stable" : "first_week";
  }

  // Recovery score (0-10): lower RPE + more compliance = better recovery
  let recoveryScore = 7; // baseline
  if (avgRpe !== null) {
    if (avgRpe >= 9) recoveryScore -= 2;
    else if (avgRpe >= 8) recoveryScore -= 1;
    else if (avgRpe <= 6) recoveryScore += 1;
  }
  if (complianceRate >= 1) recoveryScore += 1;
  if (complianceRate < 0.5) recoveryScore -= 2;
  recoveryScore = Math.min(10, Math.max(0, recoveryScore));

  // Generate insights
  const insights: string[] = [];
  if (workoutsCompleted === 0) {
    insights.push("No workouts logged this week yet — the week isn't over!");
  } else if (complianceRate >= 1) {
    insights.push(`Perfect week! Hit all ${targetWorkouts} planned sessions.`);
  } else {
    insights.push(`Completed ${workoutsCompleted}/${targetWorkouts} sessions (${Math.round(complianceRate * 100)}% compliance).`);
  }
  if (volumeTrend === "increasing") insights.push("Volume is up from last week — great progressive overload.");
  if (volumeTrend === "decreasing") insights.push("Volume dropped this week — consider adding a set or two per exercise.");
  if (prsHit > 0) insights.push(`Hit ${prsHit} personal record${prsHit > 1 ? "s" : ""} this week!`);
  if (avgRpe !== null && avgRpe >= 8.5) insights.push("High average RPE — prioritize sleep and nutrition for recovery.");

  // Recommendations
  const recommendations: string[] = [];
  if (complianceRate < 0.75) {
    recommendations.push("Aim for consistency over intensity — hit your session targets first.");
  }
  if (volumeTrend === "stable" && complianceRate >= 1) {
    recommendations.push("You're ready to add volume — try an extra set on your main lifts.");
  }
  if (avgRpe !== null && avgRpe >= 9 && complianceRate >= 1) {
    recommendations.push("Consider a light deload session next week to manage fatigue.");
  }
  if (prsHit === 0 && workoutsCompleted >= 2) {
    recommendations.push("Push harder on your first sets — that's where PRs happen.");
  }

  // Next week focus
  let nextWeekFocus = "Maintain consistency and progressive overload";
  if (complianceRate < 1) nextWeekFocus = "Prioritize hitting all sessions this week";
  else if (volumeTrend === "increasing" && avgRpe !== null && avgRpe >= 8.5) nextWeekFocus = "Deload to consolidate gains";
  else if (prsHit > 0) nextWeekFocus = "Build on this week's PRs — keep the momentum";

  // Save weekly report
  const existing = await prisma.weeklyReport.findFirst({
    where: { userId, weekStart: { gte: weekStart, lte: weekEnd } },
  });

  if (!existing) {
    await prisma.weeklyReport.create({
      data: {
        userId,
        weekStart,
        weekEnd,
        workoutsCompleted,
        totalVolume,
        avgRpe,
        prsHit,
        streakDays: 0, // will be updated separately
        insights: JSON.stringify(insights),
        recommendations: JSON.stringify(recommendations),
        volumeTrend,
        strengthTrend,
        recoveryScore,
      },
    });
  } else {
    await prisma.weeklyReport.update({
      where: { id: existing.id },
      data: {
        workoutsCompleted,
        totalVolume,
        avgRpe,
        prsHit,
        insights: JSON.stringify(insights),
        recommendations: JSON.stringify(recommendations),
        volumeTrend,
        strengthTrend,
        recoveryScore,
      },
    });
  }

  return {
    weekStart,
    weekEnd,
    workoutsCompleted,
    targetWorkouts,
    totalVolume,
    avgRpe,
    prsHit,
    complianceRate,
    volumeTrend,
    strengthTrend,
    recoveryScore,
    insights,
    recommendations,
    nextWeekFocus,
  };
}
