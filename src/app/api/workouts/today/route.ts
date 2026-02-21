import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getSuggestedWeight } from "@/lib/progression";

// Map day of week number to our day keys
const dayMap: Record<number, string> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    const targetUser = user || await prisma.user.findFirst();
    
    if (!targetUser) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }
    
    // Get user's training plan
    const plan = await prisma.trainingPlan.findUnique({
      where: { userId: targetUser.id },
      include: {
        weeks: {
          where: { weekNumber: { lte: 4 } }, // Get first 4 weeks for now
          include: {
            sessions: {
              include: {
                exercises: {
                  orderBy: { exerciseOrder: 'asc' },
                },
              },
            },
          },
          orderBy: { weekNumber: 'asc' },
        },
      },
    });
    
    if (!plan) {
      return NextResponse.json({ error: "No plan found", needsOnboarding: true }, { status: 404 });
    }
    
    // Get today's day of week
    const today = new Date();
    const todayKey = dayMap[today.getDay()];
    const currentWeek = plan.currentWeek;
    
    // Find today's sessions
    const weekData = plan.weeks.find(w => w.weekNumber === currentWeek);
    if (!weekData) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }
    
    const todaySessions = weekData.sessions.filter(s => s.dayOfWeek === todayKey);
    
    // If no sessions today, it's a rest day
    if (todaySessions.length === 0) {
      return NextResponse.json({
        isRestDay: true,
        dayOfWeek: todayKey,
        currentWeek,
        message: "Rest day. Recover well.",
      });
    }
    
    // Enhance exercises with suggested weights from progression history
    const enhancedSessions = await Promise.all(
      todaySessions.map(async (session) => {
        if (session.exercises.length === 0) {
          // Cardio session
          return session;
        }
        
        // Strength session - get suggested weights
        const exercisesWithWeights = await Promise.all(
          session.exercises.map(async (exercise) => {
            const suggestedWeight = await getSuggestedWeight(
              targetUser.id,
              exercise.exerciseName,
              exercise.targetWeight || 45
            );
            return {
              ...exercise,
              suggestedWeight,
            };
          })
        );
        
        return {
          ...session,
          exercises: exercisesWithWeights,
        };
      })
    );
    
    return NextResponse.json({
      isRestDay: false,
      dayOfWeek: todayKey,
      currentWeek,
      isDeload: weekData.isDeload,
      sessions: enhancedSessions,
    });
  } catch (error) {
    console.error('Today workout fetch error:', error);
    return NextResponse.json({ error: "Failed to fetch today's workout" }, { status: 500 });
  }
}
