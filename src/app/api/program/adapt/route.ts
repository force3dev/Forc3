import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODELS } from "@/lib/ai/models";

export const dynamic = "force-dynamic";

function getClient() {
  const key = process.env.CLAUDE_API_KEY;
  if (!key) throw new Error("CLAUDE_API_KEY not set");
  return new Anthropic({ apiKey: key });
}

function parseReps(reps: string): { min: number; max: number } {
  const range = reps?.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (range) return { min: parseInt(range[1]), max: parseInt(range[2]) };
  const single = reps?.match(/^(\d+)$/);
  if (single) return { min: parseInt(single[1]), max: parseInt(single[1]) };
  return { min: 8, max: 12 };
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const client = getClient();

    // Gather last week's performance data
    const [profile, plan, recentLogs] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.trainingPlan.findUnique({
        where: { userId },
        include: {
          workouts: {
            include: {
              exercises: { include: { exercise: { select: { name: true } } } },
            },
          },
        },
      }),
      prisma.workoutLog.findMany({
        where: {
          userId,
          startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        include: {
          exerciseLogs: {
            include: {
              exercise: { select: { name: true } },
              sets: true,
            },
          },
        },
        orderBy: { startedAt: "desc" },
      }),
    ]);

    if (!plan) {
      return NextResponse.json({ error: "No training plan found" }, { status: 404 });
    }

    const plannedDays = plan.workouts.length;
    const completedDays = recentLogs.filter(l => l.completedAt).length;

    // Find exercises where they hit all reps vs struggled
    const hitReps: string[] = [];
    const struggled: string[] = [];

    for (const log of recentLogs) {
      for (const el of log.exerciseLogs) {
        const planExercise = plan.workouts
          .flatMap(w => w.exercises)
          .find(ex => ex.exercise.name === el.exercise.name);

        if (planExercise && el.sets.length > 0) {
          const allSetsComplete = el.sets.every(s => s.reps >= (planExercise.repsMin || 8));
          if (allSetsComplete) {
            if (!hitReps.includes(el.exercise.name)) hitReps.push(el.exercise.name);
          } else {
            if (!struggled.includes(el.exercise.name)) struggled.push(el.exercise.name);
          }
        }
      }
    }

    const prompt = `You are Coach Alex. Adapt this athlete's program for next week based on last week's performance.

Current Program: ${plan.name}
Athlete Goal: ${profile?.goal || "general"}
Experience: ${profile?.experienceLevel || "intermediate"}

Last Week's Performance:
- Workouts completed: ${completedDays}/${plannedDays}
- Exercises where they hit all target reps: ${hitReps.join(", ") || "none recorded"}
- Exercises where they struggled: ${struggled.join(", ") || "none recorded"}
- Recovery score: good (no health data available)

Current exercises:
${plan.workouts.map(w => `${w.name}: ${w.exercises.map(e => e.exercise.name).join(", ")}`).join("\n")}

Adaptation rules:
- If completed all workouts: slightly increase volume (add 1 set or increase reps by 2)
- If missed workouts: keep same difficulty, focus on consistency
- Progress weights/volume where they hit all reps
- Modify or swap exercises they struggled with
- Keep the same overall structure unless there's a clear reason to change

Return a JSON object with adaptations:
{
  "adaptations": [
    {
      "workoutName": "string",
      "changes": [
        {
          "exerciseName": "string",
          "action": "increase_sets|increase_reps|swap|keep|reduce",
          "newSets": number,
          "newReps": "string",
          "reason": "string"
        }
      ]
    }
  ],
  "coachNote": "string",
  "weekFocus": "string"
}

Return only the JSON.`;

    const response = await client.messages.create({
      model: AI_MODELS.BALANCED,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const adaptations = JSON.parse(cleaned);

    // Apply adaptations to the database
    for (const workoutAdaptation of adaptations.adaptations || []) {
      const workout = plan.workouts.find(w => w.name === workoutAdaptation.workoutName);
      if (!workout) continue;

      for (const change of workoutAdaptation.changes || []) {
        if (change.action === "keep") continue;

        const workoutExercise = workout.exercises.find(
          e => e.exercise.name === change.exerciseName
        );
        if (!workoutExercise) continue;

        if (change.action === "increase_sets" || change.action === "increase_reps" || change.action === "reduce") {
          const { min, max } = parseReps(change.newReps || "8-12");
          await prisma.workoutExercise.update({
            where: { id: workoutExercise.id },
            data: {
              sets: change.newSets || workoutExercise.sets,
              repsMin: min,
              repsMax: max,
            },
          });
        }
      }
    }

    // Increment current week
    await prisma.trainingPlan.update({
      where: { userId },
      data: { currentWeek: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      adaptations,
      message: adaptations.coachNote || "Program adapted for next week.",
    });
  } catch (err) {
    console.error("Program adaptation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to adapt program" },
      { status: 500 }
    );
  }
}
