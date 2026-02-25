import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [profile, streak, lastLog, prs, memories] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.streak.findUnique({ where: { userId } }),
      prisma.workoutLog.findFirst({
        where: { userId, completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        include: { workout: { select: { name: true } } },
      }),
      prisma.personalRecord.findMany({
        where: { userId },
        orderBy: { achievedAt: "desc" },
        take: 3,
        include: { exercise: { select: { name: true } } },
      }),
      prisma.coachMemory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const suggestions: string[] = [];

    // Recovery-based suggestion
    const daysSinceLastWorkout = lastLog?.completedAt
      ? Math.floor((Date.now() - new Date(lastLog.completedAt).getTime()) / 86400000)
      : null;

    if (daysSinceLastWorkout !== null && daysSinceLastWorkout >= 3) {
      suggestions.push(`I've been off for ${daysSinceLastWorkout} days — how do I get back on track?`);
    } else if (daysSinceLastWorkout === 0) {
      suggestions.push("I just finished a workout. What should I do for recovery?");
    }

    // Streak-based
    if (streak?.currentStreak && streak.currentStreak >= 7) {
      suggestions.push(`I'm on a ${streak.currentStreak}-day streak — how do I keep the momentum?`);
    } else if (!streak?.currentStreak || streak.currentStreak === 0) {
      suggestions.push("How do I build a consistent training habit?");
    }

    // PR-based
    if (prs.length > 0) {
      const latestPR = prs[0];
      const daysSincePR = Math.floor((Date.now() - new Date(latestPR.achievedAt).getTime()) / 86400000);
      if (daysSincePR <= 7) {
        suggestions.push(`I just hit a ${latestPR.exercise.name} PR! What's my next goal?`);
      } else {
        suggestions.push(`My ${latestPR.exercise.name} has stalled — how do I break through?`);
      }
    }

    // Race goal based
    const raceGoals = Array.isArray(profile?.raceGoals) ? profile!.raceGoals as { type?: string; date?: string }[] : [];
    const nearest = raceGoals
      .filter(r => r.date)
      .map(r => ({
        type: r.type,
        days: Math.max(0, Math.round((new Date(r.date!).getTime() - Date.now()) / 86400000)),
      }))
      .sort((a, b) => a.days - b.days)[0];

    if (nearest && nearest.days <= 30) {
      suggestions.push(`My ${nearest.type?.replace(/_/g, " ")} is in ${nearest.days} days — am I ready?`);
    } else if (nearest) {
      suggestions.push(`How should I structure my training for my ${nearest.type?.replace(/_/g, " ")}?`);
    }

    // Memory-based suggestions
    const injuryMemory = memories.find(m => m.type === "injury");
    if (injuryMemory) {
      suggestions.push("My injury is bothering me — should I modify my program?");
    }

    // Defaults to fill up to 4
    const defaults = [
      "How should I structure my training this week?",
      "What should I eat before a heavy workout?",
      "How do I avoid overtraining?",
      "What does my recovery look like right now?",
      "How do I keep improving when progress slows?",
    ];

    for (const d of defaults) {
      if (suggestions.length >= 4) break;
      if (!suggestions.includes(d)) suggestions.push(d);
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, 4) });
  } catch {
    return NextResponse.json({
      suggestions: [
        "How should I structure my training this week?",
        "What should I eat before a heavy workout?",
        "How do I avoid overtraining?",
        "What does my recovery look like?",
      ],
    });
  }
}
