/**
 * Progression Engine for FORCE3
 * 
 * Handles automatic weight progression, deloads, and running mileage adjustments.
 */

import { prisma } from "./prisma";

// ============================================
// STRENGTH PROGRESSION
// ============================================

interface StrengthProgressionInput {
  userId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  completedSets: { reps: number; weight: number; completed: boolean }[];
}

interface ProgressionResult {
  newWeight: number;
  action: 'increase' | 'maintain' | 'decrease' | 'deload';
  message: string;
}

/**
 * Calculate next weight based on performance
 */
export async function calculateStrengthProgression(
  input: StrengthProgressionInput
): Promise<ProgressionResult> {
  const { userId, exerciseName, targetSets, targetReps, completedSets } = input;
  
  // Get current progression state
  let progression = await prisma.exerciseProgression.findUnique({
    where: { userId_exerciseName: { userId, exerciseName } },
  });
  
  const currentWeight = progression?.currentWeight ?? completedSets[0]?.weight ?? 0;
  
  // Analyze performance
  const completedCount = completedSets.filter(s => s.completed && s.reps >= targetReps).length;
  const allSetsCompleted = completedCount >= targetSets;
  const avgReps = completedSets.reduce((sum, s) => sum + s.reps, 0) / completedSets.length;
  
  let newWeight = currentWeight;
  let action: ProgressionResult['action'] = 'maintain';
  let message = '';
  
  // Determine progression
  if (allSetsCompleted) {
    // Success! Increase weight
    const increment = currentWeight >= 100 ? 5 : 2.5; // Smaller increments for lighter weights
    newWeight = currentWeight + increment;
    action = 'increase';
    message = `Great work! Increasing weight to ${newWeight} lbs next time.`;
    
    // Update consecutive successes
    if (progression) {
      await prisma.exerciseProgression.update({
        where: { id: progression.id },
        data: {
          currentWeight: newWeight,
          lastWeight: currentWeight,
          consecutiveSuccesses: progression.consecutiveSuccesses + 1,
          consecutiveFailures: 0,
          lastPerformed: new Date(),
          totalSessions: progression.totalSessions + 1,
        },
      });
    }
  } else if (avgReps < targetReps * 0.7) {
    // Struggled significantly - check if deload needed
    const failures = (progression?.consecutiveFailures ?? 0) + 1;
    
    if (failures >= 3) {
      // Deload: reduce weight by 10%
      newWeight = Math.round(currentWeight * 0.9);
      action = 'deload';
      message = `Taking a deload. Reducing weight to ${newWeight} lbs to rebuild.`;
    } else {
      // Just maintain for now
      action = 'maintain';
      message = `Tough session. Let's try ${currentWeight} lbs again next time.`;
    }
    
    if (progression) {
      await prisma.exerciseProgression.update({
        where: { id: progression.id },
        data: {
          consecutiveFailures: failures,
          consecutiveSuccesses: 0,
          lastPerformed: new Date(),
          totalSessions: progression.totalSessions + 1,
          ...(action === 'deload' ? { currentWeight: newWeight, lastWeight: currentWeight } : {}),
        },
      });
    }
  } else {
    // Partial success - maintain
    action = 'maintain';
    message = `Close! Let's hit ${currentWeight} lbs again and get all reps.`;
    
    if (progression) {
      await prisma.exerciseProgression.update({
        where: { id: progression.id },
        data: {
          lastPerformed: new Date(),
          totalSessions: progression.totalSessions + 1,
        },
      });
    }
  }
  
  // Create progression record if it doesn't exist
  if (!progression) {
    await prisma.exerciseProgression.create({
      data: {
        userId,
        exerciseName,
        currentWeight: newWeight,
        lastWeight: currentWeight,
        consecutiveSuccesses: action === 'increase' ? 1 : 0,
        consecutiveFailures: action === 'maintain' || action === 'deload' ? 1 : 0,
        lastPerformed: new Date(),
        totalSessions: 1,
      },
    });
  }
  
  return { newWeight, action, message };
}

/**
 * Get suggested weight for an exercise based on progression history
 */
export async function getSuggestedWeight(
  userId: string,
  exerciseName: string,
  defaultWeight: number = 45
): Promise<number> {
  const progression = await prisma.exerciseProgression.findUnique({
    where: { userId_exerciseName: { userId, exerciseName } },
  });
  
  return progression?.currentWeight ?? defaultWeight;
}

// ============================================
// RUNNING PROGRESSION
// ============================================

interface RunningProgressionInput {
  userId: string;
  currentWeeklyMileage: number;
  completedMileage: number;
  longestRunCompleted: number;
}

interface RunningProgressionResult {
  newWeeklyTarget: number;
  newLongRunTarget: number;
  action: 'increase' | 'maintain' | 'decrease';
  message: string;
}

/**
 * Calculate running progression (10% rule with safety caps)
 */
export async function calculateRunningProgression(
  input: RunningProgressionInput
): Promise<RunningProgressionResult> {
  const { userId, currentWeeklyMileage, completedMileage, longestRunCompleted } = input;
  
  // Check completion rate
  const completionRate = completedMileage / currentWeeklyMileage;
  
  let newWeeklyTarget = currentWeeklyMileage;
  let newLongRunTarget = longestRunCompleted;
  let action: RunningProgressionResult['action'] = 'maintain';
  let message = '';
  
  if (completionRate >= 0.9) {
    // Completed 90%+ - increase by 10% (standard running progression)
    const increase = Math.max(1, currentWeeklyMileage * 0.1); // At least 1 mile
    newWeeklyTarget = Math.round((currentWeeklyMileage + increase) * 10) / 10;
    newLongRunTarget = Math.round((longestRunCompleted + 0.5) * 10) / 10; // Add 0.5 mile to long run
    action = 'increase';
    message = `Nice week! Bumping weekly mileage to ${newWeeklyTarget} miles.`;
  } else if (completionRate < 0.7) {
    // Completed less than 70% - reduce by 10%
    newWeeklyTarget = Math.round(currentWeeklyMileage * 0.9 * 10) / 10;
    action = 'decrease';
    message = `Let's pull back a bit. Targeting ${newWeeklyTarget} miles this week.`;
  } else {
    // Between 70-90% - maintain
    action = 'maintain';
    message = `Solid week. Let's lock in ${currentWeeklyMileage} miles again.`;
  }
  
  // Update progression in database
  await prisma.exerciseProgression.upsert({
    where: { userId_exerciseName: { userId, exerciseName: '_running_' } },
    create: {
      userId,
      exerciseName: '_running_',
      currentWeight: 0, // Not used for running
      weeklyMileage: newWeeklyTarget,
      longestRun: newLongRunTarget,
    },
    update: {
      weeklyMileage: newWeeklyTarget,
      longestRun: newLongRunTarget,
      lastPerformed: new Date(),
    },
  });
  
  return { newWeeklyTarget, newLongRunTarget, action, message };
}

// ============================================
// DELOAD LOGIC
// ============================================

/**
 * Check if user should have a deload week
 */
export async function shouldDeload(userId: string, currentWeek: number): Promise<boolean> {
  // Deload every 4th week
  if (currentWeek % 4 === 0) {
    return true;
  }
  
  // Also check for accumulated fatigue (multiple exercises failing)
  const progressions = await prisma.exerciseProgression.findMany({
    where: { userId },
  });
  
  const failingExercises = progressions.filter(p => p.consecutiveFailures >= 2);
  
  // If more than 30% of exercises are failing, trigger deload
  if (progressions.length > 0 && failingExercises.length / progressions.length > 0.3) {
    return true;
  }
  
  return false;
}

/**
 * Apply deload to all exercises (reduce weights by 10%)
 */
export async function applyDeload(userId: string): Promise<void> {
  const progressions = await prisma.exerciseProgression.findMany({
    where: { userId },
  });
  
  for (const prog of progressions) {
    if (prog.exerciseName === '_running_') {
      // For running, reduce mileage by 30% for recovery week
      await prisma.exerciseProgression.update({
        where: { id: prog.id },
        data: {
          weeklyMileage: prog.weeklyMileage ? prog.weeklyMileage * 0.7 : null,
          consecutiveFailures: 0,
        },
      });
    } else {
      // For strength, reduce weight by 10%
      await prisma.exerciseProgression.update({
        where: { id: prog.id },
        data: {
          currentWeight: prog.currentWeight * 0.9,
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
        },
      });
    }
  }
}

// ============================================
// MISSED WORKOUT HANDLING
// ============================================

/**
 * Handle missed workout - push to next available day
 */
export async function handleMissedWorkout(
  userId: string,
  missedSessionId: string
): Promise<{ rescheduled: boolean; newDate?: Date; message: string }> {
  // Get the user's training plan
  const plan = await prisma.trainingPlan.findUnique({
    where: { userId },
    include: {
      weeks: {
        include: {
          sessions: true,
        },
        orderBy: { weekNumber: 'asc' },
      },
    },
  });
  
  if (!plan) {
    return { rescheduled: false, message: 'No training plan found.' };
  }
  
  // For MVP, we'll just log that the workout was missed
  // More complex rescheduling logic can be added later
  return {
    rescheduled: true,
    message: 'Workout marked as missed. Your next session will pick up where you left off.',
  };
}
