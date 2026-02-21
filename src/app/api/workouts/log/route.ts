import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { estimateOneRepMax } from "@/lib/calculations/oneRepMax";
import { checkAndAwardAchievements, seedAchievements } from "@/lib/gamification/achievements";

export const dynamic = "force-dynamic";

// POST: Start or complete a workout log
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "start") {
      // Start a new workout session
      const log = await prisma.workoutLog.create({
        data: {
          userId,
          workoutId: body.workoutId,
          startedAt: new Date(),
          notes: body.notes || null,
        },
      });
      return NextResponse.json({ logId: log.id });
    }

    if (action === "log_set") {
      // Log a single set for an exercise
      const { logId, exerciseId, setNumber, weight, reps, rpe, isWarmup } = body;

      // Get or create exercise log
      let exerciseLog = await prisma.exerciseLog.findFirst({
        where: { workoutLogId: logId, exerciseId },
      });

      if (!exerciseLog) {
        exerciseLog = await prisma.exerciseLog.create({
          data: { workoutLogId: logId, exerciseId },
        });
      }

      // Check 1RM PR
      const currentBest1RM = await prisma.personalRecord.findFirst({
        where: { userId, exerciseId, type: "1rm" },
        orderBy: { value: "desc" },
      });

      const estimated1RM = estimateOneRepMax(weight, reps);
      const is1RMPR = !currentBest1RM || estimated1RM > currentBest1RM.value;

      // Check volume PR (weight × reps for a single set)
      const currentBestVolume = await prisma.personalRecord.findFirst({
        where: { userId, exerciseId, type: "volume" },
        orderBy: { value: "desc" },
      });
      const setVolume = weight * reps;
      const isVolumePR = !currentBestVolume || setVolume > currentBestVolume.value;

      const isPR = is1RMPR || isVolumePR;

      // Log the set
      const setLog = await prisma.setLog.create({
        data: {
          exerciseLogId: exerciseLog.id,
          setNumber,
          weight,
          reps,
          rpe: rpe || null,
          isWarmup: isWarmup || false,
          isPR,
        },
      });

      // Update PRs if applicable
      if (!isWarmup) {
        if (is1RMPR) {
          await prisma.personalRecord.create({
            data: { userId, exerciseId, type: "1rm", value: estimated1RM, reps },
          });
        }
        if (isVolumePR) {
          await prisma.personalRecord.create({
            data: { userId, exerciseId, type: "volume", value: setVolume, reps },
          });
        }
      }

      // Update streak
      await updateStreak(userId);

      // Check achievements on PR
      if (isPR && !isWarmup) {
        await seedAchievements();
        await checkAndAwardAchievements(userId);
      }

      return NextResponse.json({
        setId: setLog.id,
        isPR,
        prType: is1RMPR ? "1rm" : isVolumePR ? "volume" : null,
        estimated1RM,
        exerciseLogId: exerciseLog.id,
      });
    }

    if (action === "complete") {
      // Complete the workout
      const { logId, overallRpe, energyLevel, mood, notes } = body;

      const log = await prisma.workoutLog.findFirst({
        where: { id: logId, userId },
        include: { exerciseLogs: { include: { sets: true } } },
      });

      if (!log) return NextResponse.json({ error: "Log not found" }, { status: 404 });

      const duration = Math.round(
        (Date.now() - log.startedAt.getTime()) / 60000
      );

      // Calculate total volume
      const totalVolume = log.exerciseLogs.reduce((sum, el) => {
        return sum + el.sets.reduce((s, set) => s + set.weight * set.reps, 0);
      }, 0);

      await prisma.workoutLog.update({
        where: { id: logId },
        data: {
          completedAt: new Date(),
          duration,
          overallRpe: overallRpe || null,
          energyLevel: energyLevel || null,
          mood: mood || null,
          notes: notes || null,
        },
      });

      // Check and award achievements
      await seedAchievements(); // idempotent upsert
      const newAchievements = await checkAndAwardAchievements(userId);

      return NextResponse.json({ success: true, duration, totalVolume, newAchievements });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Workout log error:", err);
    return NextResponse.json({ error: "Failed to log workout" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  const logs = await prisma.workoutLog.findMany({
    where: { userId, completedAt: { not: null } },
    include: {
      workout: { select: { name: true } },
      exerciseLogs: {
        include: {
          exercise: { select: { name: true } },
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
    orderBy: { startedAt: "desc" },
    take: limit,
    skip: offset,
  });

  return NextResponse.json({ logs });
}

async function updateStreak(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await prisma.streak.findUnique({ where: { userId } });
  if (!streak) {
    await prisma.streak.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastWorkoutDate: new Date() },
    });
    return;
  }

  const lastDate = streak.lastWorkoutDate;
  if (!lastDate) {
    await prisma.streak.update({
      where: { userId },
      data: { currentStreak: 1, longestStreak: Math.max(1, streak.longestStreak), lastWorkoutDate: new Date() },
    });
    return;
  }

  const lastWorkoutDay = new Date(lastDate);
  lastWorkoutDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - lastWorkoutDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return; // already logged today
  if (diffDays === 1 || diffDays === 2) { // grace period: 1 rest day doesn't break streak
    const newStreak = streak.currentStreak + 1;
    await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastWorkoutDate: new Date(),
      },
    });
  } else {
    await prisma.streak.update({
      where: { userId },
      data: { currentStreak: 1, lastWorkoutDate: new Date() },
    });
  }
}
