import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { calculateStrengthProgression } from "@/lib/progression";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const targetUser = user || await prisma.user.findFirst();
    
    if (!targetUser) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Create workout log
    const workoutLog = await prisma.workoutLog.create({
      data: {
        userId: targetUser.id,
        plannedSessionId: data.sessionId,
        sessionType: data.sessionType,
        status: data.status || 'completed',
        actualDuration: data.duration,
        actualDistance: data.distance,
        actualPace: data.pace,
        avgHeartRate: data.heartRate,
        perceivedEffort: data.effort,
        notes: data.notes,
      },
    });
    
    // Log exercises if this is a strength workout
    const progressionResults: any[] = [];
    
    if (data.exercises && Array.isArray(data.exercises)) {
      for (const exercise of data.exercises) {
        // Create exercise log
        const exerciseLog = await prisma.exerciseLog.create({
          data: {
            workoutLogId: workoutLog.id,
            exerciseName: exercise.name,
            exerciseOrder: exercise.order || 0,
            notes: exercise.notes,
          },
        });
        
        // Log each set
        if (exercise.sets && Array.isArray(exercise.sets)) {
          for (const set of exercise.sets) {
            await prisma.setLog.create({
              data: {
                exerciseLogId: exerciseLog.id,
                setNumber: set.setNumber,
                targetReps: set.targetReps,
                actualReps: set.actualReps,
                targetWeight: set.targetWeight,
                actualWeight: set.actualWeight,
                rpe: set.rpe,
                completed: set.completed !== false,
              },
            });
          }
          
          // Calculate progression for this exercise
          const progression = await calculateStrengthProgression({
            userId: targetUser.id,
            exerciseName: exercise.name,
            targetSets: exercise.targetSets || exercise.sets.length,
            targetReps: exercise.targetReps || 8,
            completedSets: exercise.sets.map((s: any) => ({
              reps: s.actualReps,
              weight: s.actualWeight,
              completed: s.completed !== false,
            })),
          });
          
          progressionResults.push({
            exercise: exercise.name,
            ...progression,
          });
        }
      }
    }
    
    return NextResponse.json({
      ok: true,
      workoutLogId: workoutLog.id,
      progressionUpdates: progressionResults,
    });
  } catch (error) {
    console.error('Workout log error:', error);
    return NextResponse.json({ error: "Failed to log workout" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const targetUser = user || await prisma.user.findFirst();
    
    if (!targetUser) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }
    
    // Get recent workout logs
    const logs = await prisma.workoutLog.findMany({
      where: { userId: targetUser.id },
      include: {
        exerciseLogs: {
          include: {
            sets: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 20,
    });
    
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Workout logs fetch error:', error);
    return NextResponse.json({ error: "Failed to fetch workout logs" }, { status: 500 });
  }
}
