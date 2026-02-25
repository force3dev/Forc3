import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { calculateRecoveryScore } from "@/lib/recovery-score";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);
    const monday = new Date(now);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0,0,0,0);
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    const [profile, sub, streak, plan, weekLogs3, weekLogs7, totalWorkouts] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.subscription.findUnique({ where: { userId } }),
      prisma.streak.findUnique({ where: { userId } }),
      prisma.trainingPlan.findUnique({
        where: { userId },
        include: {
          workouts: {
            orderBy: { order: "asc" },
            include: {
              exercises: {
                orderBy: { order: "asc" },
                include: { exercise: { select: { name: true, muscleGroups: true } } }
              }
            }
          }
        }
      }),
      prisma.workoutLog.findMany({
        where: { userId, startedAt: { gte: threeDaysAgo }, completedAt: { not: null } },
        select: { startedAt: true, overallRpe: true }
      }),
      prisma.workoutLog.findMany({
        where: { userId, startedAt: { gte: sevenDaysAgo }, completedAt: { not: null } },
        select: { startedAt: true }
      }),
      prisma.workoutLog.count({ where: { userId, completedAt: { not: null } } })
    ]);

    if (!profile) return NextResponse.json({ needsOnboarding: true });

    // Recovery score
    const hardWorkouts = weekLogs3.filter(l => (l.overallRpe ?? 0) >= 8).length;
    const trainingDays = new Set(weekLogs7.map(l => l.startedAt.toISOString().slice(0,10))).size;
    const restDays = 7 - trainingDays;
    let consecutiveDays = 0;
    const allDates = new Set(weekLogs7.map(l => l.startedAt.toISOString().slice(0,10)));
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() - i * 86400000).toISOString().slice(0,10);
      if (allDates.has(d)) consecutiveDays++; else break;
    }
    const recovery = calculateRecoveryScore({
      workoutsLast3Days: weekLogs3.length,
      hardWorkoutsLast3Days: hardWorkouts,
      restDaysLast7Days: restDays,
      consecutiveTrainingDays: consecutiveDays
    });

    // Today's workout from plan — match by actual dayOfWeek
    const jsDay = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    let todayWorkout = null;
    let inProgressLog = null;
    if (plan?.workouts?.length) {
      // Find workout where dayOfWeek matches today's JS day
      const workout = plan.workouts.find(w => w.dayOfWeek === jsDay) || null;
      if (workout) {
        todayWorkout = {
          id: workout.id,
          name: workout.name,
          exercises: workout.exercises.map(e => ({
            id: e.id,
            exerciseId: e.exerciseId,
            name: e.exercise?.name || "",
            sets: e.sets,
            repsMin: e.repsMin || 8,
            repsMax: e.repsMax || 12,
          }))
        };
        // Check for in-progress log
        const activeLog = await prisma.workoutLog.findFirst({
          where: { userId, workoutId: workout.id, completedAt: null },
          orderBy: { startedAt: "desc" }
        });
        inProgressLog = activeLog?.id || null;
      }
    }

    // Today's cardio from plan
    const todayCardio = await prisma.cardioActivity.findFirst({
      where: {
        userId,
        completed: false,
        date: { gte: todayStart, lte: todayEnd },
      },
      select: { id: true, title: true, type: true, duration: true, intensity: true },
    }).catch(() => null);

    // Week progress (Mon-Sun) — use actual dayOfWeek from plan
    const weekProgress = [];
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    // Map Mon-Sun index (0-6) to JS getDay() (Mon=1,...Sat=6,Sun=0)
    const monToJsDay = [1, 2, 3, 4, 5, 6, 0];
    const scheduledJsDays = new Set(plan?.workouts?.map(w => w.dayOfWeek) || []);
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getTime() + i * 86400000);
      const dStr = d.toISOString().slice(0,10);
      const jsDayForThisSlot = monToJsDay[i];
      const isRest = !scheduledJsDays.has(jsDayForThisSlot);
      weekProgress.push({
        dayIndex: i,
        dayName: days[i],
        date: dStr,
        completed: allDates.has(dStr),
        isRest,
        isFuture: d > now
      });
    }

    // Morning message
    const morningMessage = sub?.morningCheckinMessage && sub.morningCheckinDate &&
      new Date(sub.morningCheckinDate).toISOString().slice(0,10) === now.toISOString().slice(0,10)
      ? sub.morningCheckinMessage : null;

    // Quick stats
    const workoutsThisWeek = weekLogs7.filter(l => new Date(l.startedAt) >= monday).length;

    const xpLevel = streak?.totalXP ?? 0;
    // Simple level calculation
    const level = Math.floor(Math.sqrt(xpLevel / 100)) + 1;

    return NextResponse.json({
      user: {
        name: profile.name || "Athlete",
        avatarUrl: null,
        level,
        totalXP: xpLevel,
        streak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
        isPremium: sub?.tier !== "free" && !!sub
      },
      recovery,
      todayWorkout,
      inProgressLog,
      morningMessage,
      weekProgress,
      quickStats: {
        workoutsThisWeek,
        totalWorkouts,
        streakDays: streak?.currentStreak ?? 0
      },
      isRestDay: !todayWorkout && !todayCardio,
      todayCardio: todayCardio || null,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
