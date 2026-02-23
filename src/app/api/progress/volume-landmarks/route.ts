import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Israetel MEV (Minimum Effective Volume) / MAV (Maximum Adaptive Volume) per muscle group
// Values in sets per week
const LANDMARKS: Record<string, { mev: number; mav: number; label: string }> = {
  chest:     { mev: 10, mav: 20, label: "Chest" },
  back:      { mev: 10, mav: 25, label: "Back" },
  quads:     { mev: 8,  mav: 20, label: "Quads" },
  hamstrings:{ mev: 6,  mav: 20, label: "Hamstrings" },
  glutes:    { mev: 4,  mav: 16, label: "Glutes" },
  shoulders: { mev: 8,  mav: 20, label: "Shoulders" },
  biceps:    { mev: 8,  mav: 18, label: "Biceps" },
  triceps:   { mev: 8,  mav: 18, label: "Triceps" },
  calves:    { mev: 8,  mav: 16, label: "Calves" },
  core:      { mev: 4,  mav: 16, label: "Core" },
};

// Maps exercise muscle groups to landmark keys
function normalizeMuscle(muscle: string): string | null {
  const m = muscle.toLowerCase().trim();
  if (m.includes("chest") || m.includes("pec")) return "chest";
  if (m.includes("back") || m.includes("lat") || m.includes("trap") || m.includes("rhomboid")) return "back";
  if (m.includes("quad") || m.includes("leg")) return "quads";
  if (m.includes("hamstring")) return "hamstrings";
  if (m.includes("glute")) return "glutes";
  if (m.includes("shoulder") || m.includes("delt")) return "shoulders";
  if (m.includes("bicep")) return "biceps";
  if (m.includes("tricep")) return "triceps";
  if (m.includes("calf") || m.includes("calves")) return "calves";
  if (m.includes("core") || m.includes("abs") || m.includes("oblique")) return "core";
  return null;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const logs = await prisma.workoutLog.findMany({
    where: { userId, startedAt: { gte: sevenDaysAgo }, completedAt: { not: null } },
    include: {
      exerciseLogs: {
        include: {
          sets: { where: { isWarmup: false } },
          exercise: { select: { muscleGroups: true, secondaryMuscles: true } },
        },
      },
    },
  });

  // Count working sets per muscle group
  const setsByMuscle: Record<string, number> = {};

  for (const log of logs) {
    for (const el of log.exerciseLogs) {
      const completedSets = el.sets.length;
      if (completedSets === 0) continue;

      let muscles: string[] = [];
      try { muscles = JSON.parse(el.exercise.muscleGroups); } catch { muscles = []; }
      let secondary: string[] = [];
      try { secondary = JSON.parse(el.exercise.secondaryMuscles); } catch { secondary = []; }

      // Primary muscles get full credit, secondary get 0.5
      for (const m of muscles) {
        const key = normalizeMuscle(m);
        if (key) setsByMuscle[key] = (setsByMuscle[key] || 0) + completedSets;
      }
      for (const m of secondary) {
        const key = normalizeMuscle(m);
        if (key) setsByMuscle[key] = (setsByMuscle[key] || 0) + completedSets * 0.5;
      }
    }
  }

  const result = Object.entries(LANDMARKS).map(([key, { mev, mav, label }]) => {
    const sets = Math.round(setsByMuscle[key] || 0);
    let zone: "below_mev" | "optimal" | "above_mav" = "below_mev";
    if (sets >= mav) zone = "above_mav";
    else if (sets >= mev) zone = "optimal";

    return { muscle: key, label, sets, mev, mav, zone };
  });

  return NextResponse.json({ landmarks: result });
}
