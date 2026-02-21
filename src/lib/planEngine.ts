/**
 * Plan Generation Engine for FORCE3
 * 
 * Generates personalized training plans based on user profile.
 * Uses deterministic rules with AI enhancement (when available).
 */

import { prisma } from "./prisma";

// ============================================
// TYPES
// ============================================

interface UserProfile {
  goal: string;
  experience: string;
  trainingDays: string[]; // ['mon', 'wed', 'fri', 'sat']
  sports: string[]; // ['running', 'lifting', 'cycling']
  eventType?: string;
  eventDate?: Date;
  injuries?: string[];
  age?: number;
  weightKg?: number;
}

interface GeneratedPlan {
  name: string;
  description: string;
  splitType: string;
  totalWeeks: number;
  weeks: GeneratedWeek[];
  aiWelcomeMessage: string;
}

interface GeneratedWeek {
  weekNumber: number;
  isDeload: boolean;
  sessions: GeneratedSession[];
}

interface GeneratedSession {
  dayOfWeek: string;
  sessionType: string;
  sessionOrder: number;
  exercises?: GeneratedExercise[];
  cardioType?: string;
  targetDuration?: number;
  targetDistance?: number;
  notes?: string;
}

interface GeneratedExercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
}

// ============================================
// EXERCISE DATABASE
// ============================================

const EXERCISES = {
  push: [
    { name: 'Barbell Bench Press', sets: 4, reps: '6-8', rest: 120, primary: true },
    { name: 'Overhead Press', sets: 3, reps: '8-10', rest: 90 },
    { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: 90 },
    { name: 'Cable Flyes', sets: 3, reps: '12-15', rest: 60 },
    { name: 'Lateral Raises', sets: 3, reps: '12-15', rest: 60 },
    { name: 'Tricep Pushdowns', sets: 3, reps: '12-15', rest: 60 },
  ],
  pull: [
    { name: 'Barbell Rows', sets: 4, reps: '6-8', rest: 120, primary: true },
    { name: 'Pull-ups', sets: 3, reps: '8-10', rest: 90 },
    { name: 'Lat Pulldowns', sets: 3, reps: '10-12', rest: 90 },
    { name: 'Face Pulls', sets: 3, reps: '15-20', rest: 60 },
    { name: 'Barbell Curls', sets: 3, reps: '10-12', rest: 60 },
    { name: 'Hammer Curls', sets: 3, reps: '12-15', rest: 60 },
  ],
  legs: [
    { name: 'Barbell Squats', sets: 4, reps: '6-8', rest: 180, primary: true },
    { name: 'Romanian Deadlifts', sets: 3, reps: '8-10', rest: 120 },
    { name: 'Leg Press', sets: 3, reps: '10-12', rest: 90 },
    { name: 'Walking Lunges', sets: 3, reps: '12 each', rest: 90 },
    { name: 'Leg Curls', sets: 3, reps: '12-15', rest: 60 },
    { name: 'Calf Raises', sets: 4, reps: '15-20', rest: 60 },
  ],
  legs_no_deadlift: [
    { name: 'Barbell Squats', sets: 4, reps: '6-8', rest: 180, primary: true },
    { name: 'Leg Press', sets: 4, reps: '8-10', rest: 120 },
    { name: 'Bulgarian Split Squats', sets: 3, reps: '10-12', rest: 90 },
    { name: 'Walking Lunges', sets: 3, reps: '12 each', rest: 90 },
    { name: 'Leg Curls', sets: 3, reps: '12-15', rest: 60 },
    { name: 'Calf Raises', sets: 4, reps: '15-20', rest: 60 },
  ],
  upper: [
    { name: 'Barbell Bench Press', sets: 4, reps: '6-8', rest: 120, primary: true },
    { name: 'Barbell Rows', sets: 4, reps: '6-8', rest: 120, primary: true },
    { name: 'Overhead Press', sets: 3, reps: '8-10', rest: 90 },
    { name: 'Lat Pulldowns', sets: 3, reps: '10-12', rest: 90 },
    { name: 'Lateral Raises', sets: 3, reps: '12-15', rest: 60 },
    { name: 'Tricep Pushdowns', sets: 2, reps: '12-15', rest: 60 },
    { name: 'Barbell Curls', sets: 2, reps: '12-15', rest: 60 },
  ],
  lower: [
    { name: 'Barbell Squats', sets: 4, reps: '6-8', rest: 180, primary: true },
    { name: 'Romanian Deadlifts', sets: 3, reps: '8-10', rest: 120 },
    { name: 'Leg Press', sets: 3, reps: '10-12', rest: 90 },
    { name: 'Walking Lunges', sets: 3, reps: '12 each', rest: 90 },
    { name: 'Leg Curls', sets: 3, reps: '12-15', rest: 60 },
    { name: 'Calf Raises', sets: 4, reps: '15-20', rest: 60 },
  ],
  full_body: [
    { name: 'Barbell Squats', sets: 3, reps: '6-8', rest: 150, primary: true },
    { name: 'Barbell Bench Press', sets: 3, reps: '6-8', rest: 120, primary: true },
    { name: 'Barbell Rows', sets: 3, reps: '6-8', rest: 120, primary: true },
    { name: 'Overhead Press', sets: 3, reps: '8-10', rest: 90 },
    { name: 'Romanian Deadlifts', sets: 3, reps: '8-10', rest: 90 },
    { name: 'Pull-ups', sets: 3, reps: '8-10', rest: 90 },
  ],
  core: [
    { name: 'Planks', sets: 3, reps: '45-60 sec', rest: 60 },
    { name: 'Dead Bugs', sets: 3, reps: '12 each', rest: 60 },
    { name: 'Cable Woodchops', sets: 3, reps: '12 each', rest: 60 },
    { name: 'Hanging Leg Raises', sets: 3, reps: '10-12', rest: 60 },
  ],
  mobility: [
    { name: 'Hip 90/90 Stretch', sets: 2, reps: '60 sec each', rest: 30 },
    { name: 'Cat-Cow', sets: 2, reps: '10 reps', rest: 30 },
    { name: 'World\'s Greatest Stretch', sets: 2, reps: '5 each', rest: 30 },
    { name: 'Foam Rolling', sets: 1, reps: '10 min', rest: 0 },
  ],
};

// ============================================
// SPLIT DETERMINATION
// ============================================

function determineSplit(daysPerWeek: number, sports: string[]): string {
  const hasRunning = sports.includes('running');
  const hasCycling = sports.includes('cycling');
  const hasEndurance = hasRunning || hasCycling || sports.includes('swimming');
  
  if (daysPerWeek <= 2) {
    return 'full_body';
  } else if (daysPerWeek === 3) {
    return hasEndurance ? 'full_body' : 'ppl'; // Full body allows more flexibility for cardio
  } else if (daysPerWeek === 4) {
    return hasEndurance ? 'upper_lower' : 'ppl';
  } else {
    return 'ppl'; // 5+ days, PPL gives best recovery
  }
}

// ============================================
// SESSION SCHEDULING
// ============================================

function scheduleStrengthSessions(
  days: string[],
  split: string,
  sports: string[]
): { day: string; type: string }[] {
  const hasCardio = sports.some(s => ['running', 'cycling', 'swimming', 'rowing'].includes(s));
  const sessions: { day: string; type: string }[] = [];
  
  if (split === 'ppl') {
    // Push, Pull, Legs rotation
    const rotation = ['push', 'pull', 'legs'];
    const strengthDays = hasCardio ? days.slice(0, Math.min(days.length, 4)) : days;
    strengthDays.forEach((day, i) => {
      sessions.push({ day, type: rotation[i % 3] });
    });
  } else if (split === 'upper_lower') {
    // Alternate upper/lower
    const rotation = ['upper', 'lower'];
    const strengthDays = hasCardio ? days.slice(0, Math.min(days.length, 4)) : days;
    strengthDays.forEach((day, i) => {
      sessions.push({ day, type: rotation[i % 2] });
    });
  } else {
    // Full body
    const strengthDays = hasCardio ? days.slice(0, Math.min(days.length, 3)) : days;
    strengthDays.forEach(day => {
      sessions.push({ day, type: 'full_body' });
    });
  }
  
  return sessions;
}

function scheduleCardioSessions(
  days: string[],
  strengthDays: string[],
  sports: string[],
  experience: string
): GeneratedSession[] {
  const sessions: GeneratedSession[] = [];
  const hasRunning = sports.includes('running');
  const hasCycling = sports.includes('cycling');
  const hasSwimming = sports.includes('swimming');
  const hasRowing = sports.includes('rowing');
  
  if (!hasRunning && !hasCycling && !hasSwimming && !hasRowing) {
    return sessions;
  }
  
  // Find available days (not strength days, or add as second session)
  const availableDays = days.filter(d => !strengthDays.includes(d));
  
  if (hasRunning) {
    // Schedule running sessions
    const runTypes = experience === 'beginner' 
      ? ['easy', 'easy', 'long']
      : ['easy', 'tempo', 'intervals', 'long'];
    
    let runIndex = 0;
    
    // Add runs to available days first
    for (const day of availableDays) {
      if (runIndex < runTypes.length) {
        sessions.push({
          dayOfWeek: day,
          sessionType: 'run',
          sessionOrder: 1,
          cardioType: runTypes[runIndex],
          targetDuration: runTypes[runIndex] === 'long' ? 60 : 30,
          notes: getRunNotes(runTypes[runIndex]),
        });
        runIndex++;
      }
    }
    
    // If we still have runs to schedule, add as PM sessions on strength days
    for (const day of strengthDays) {
      if (runIndex < runTypes.length && runTypes[runIndex] === 'easy') {
        sessions.push({
          dayOfWeek: day,
          sessionType: 'run',
          sessionOrder: 2, // PM session
          cardioType: 'easy',
          targetDuration: 25,
          notes: 'Easy recovery run. Keep it conversational.',
        });
        runIndex++;
      }
    }
  }
  
  if (hasCycling) {
    // Add cycling if there are remaining days
    const cyclingDay = availableDays.find(d => 
      !sessions.some(s => s.dayOfWeek === d && s.sessionOrder === 1)
    );
    if (cyclingDay) {
      sessions.push({
        dayOfWeek: cyclingDay,
        sessionType: 'bike',
        sessionOrder: 1,
        cardioType: 'easy',
        targetDuration: 45,
        notes: 'Zone 2 ride. Keep heart rate moderate.',
      });
    }
  }
  
  return sessions;
}

function getRunNotes(type: string): string {
  switch (type) {
    case 'easy':
      return 'Conversational pace. Should feel comfortable.';
    case 'tempo':
      return 'Comfortably hard. 10 min warmup, 20 min tempo, 5 min cooldown.';
    case 'intervals':
      return '10 min warmup. 6x400m at 5K pace with 90 sec rest. 10 min cooldown.';
    case 'long':
      return 'Easy pace. Build aerobic base. Walk breaks are fine.';
    default:
      return '';
  }
}

// ============================================
// PLAN GENERATION
// ============================================

export async function generateTrainingPlan(profile: UserProfile): Promise<GeneratedPlan> {
  const {
    goal,
    experience,
    trainingDays,
    sports,
    eventType,
    eventDate,
    injuries = [],
  } = profile;
  
  const daysPerWeek = trainingDays.length;
  const split = determineSplit(daysPerWeek, sports);
  
  // Handle injuries
  const hasNoDeadlift = injuries.some(i => 
    i.toLowerCase().includes('deadlift') || 
    i.toLowerCase().includes('back') ||
    i.toLowerCase().includes('spine')
  );
  
  // Schedule strength sessions
  const strengthSchedule = scheduleStrengthSessions(trainingDays, split, sports);
  const strengthDays = strengthSchedule.map(s => s.day);
  
  // Schedule cardio sessions
  const cardioSessions = scheduleCardioSessions(trainingDays, strengthDays, sports, experience);
  
  // Build weeks
  const totalWeeks = eventDate ? calculateWeeksToEvent(eventDate) : 4;
  const weeks: GeneratedWeek[] = [];
  
  for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
    const isDeload = weekNum % 4 === 0;
    const sessions: GeneratedSession[] = [];
    
    // Add strength sessions
    for (const { day, type } of strengthSchedule) {
      let exerciseList = EXERCISES[type as keyof typeof EXERCISES] || EXERCISES.full_body;
      
      // Swap for no-deadlift version if needed
      if (type === 'legs' && hasNoDeadlift) {
        exerciseList = EXERCISES.legs_no_deadlift;
      }
      if (type === 'lower' && hasNoDeadlift) {
        exerciseList = exerciseList.filter(e => !e.name.toLowerCase().includes('deadlift'));
      }
      
      // Reduce volume for deload
      const exercises = exerciseList.map(e => ({
        name: e.name,
        sets: isDeload ? Math.max(2, e.sets - 1) : e.sets,
        reps: e.reps,
        restSeconds: e.rest,
      }));
      
      // Adjust based on experience
      const adjustedExercises = adjustForExperience(exercises, experience);
      
      sessions.push({
        dayOfWeek: day,
        sessionType: type,
        sessionOrder: 1,
        exercises: adjustedExercises,
      });
    }
    
    // Add cardio sessions
    for (const cardio of cardioSessions) {
      // Reduce intensity/duration for deload
      sessions.push({
        ...cardio,
        targetDuration: isDeload ? Math.round((cardio.targetDuration || 30) * 0.7) : cardio.targetDuration,
        notes: isDeload ? 'Deload week: Easy effort only.' : cardio.notes,
      });
    }
    
    weeks.push({
      weekNumber: weekNum,
      isDeload,
      sessions,
    });
  }
  
  // Generate plan name and description
  const planName = generatePlanName(goal, split, sports, eventType);
  const description = generatePlanDescription(profile, split);
  const aiWelcomeMessage = generateWelcomeMessage(profile, split, weeks[0]);
  
  return {
    name: planName,
    description,
    splitType: split,
    totalWeeks,
    weeks,
    aiWelcomeMessage,
  };
}

function adjustForExperience(exercises: GeneratedExercise[], experience: string): GeneratedExercise[] {
  if (experience === 'beginner') {
    // Fewer exercises, more rest
    return exercises.slice(0, 4).map(e => ({
      ...e,
      sets: Math.min(e.sets, 3),
      restSeconds: e.restSeconds + 30,
    }));
  } else if (experience === 'advanced') {
    // Can handle more volume
    return exercises.map(e => ({
      ...e,
      sets: e.sets + 1,
    }));
  }
  return exercises;
}

function calculateWeeksToEvent(eventDate: Date): number {
  const now = new Date();
  const diffTime = eventDate.getTime() - now.getTime();
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return Math.max(4, Math.min(diffWeeks, 16)); // Between 4-16 weeks
}

function generatePlanName(
  goal: string,
  split: string,
  sports: string[],
  eventType?: string
): string {
  if (eventType) {
    return `${eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Prep`;
  }
  
  const goalNames: Record<string, string> = {
    fat_loss: 'Lean & Strong',
    muscle_gain: 'Mass Builder',
    maintenance: 'Performance Maintenance',
    performance: 'Athletic Performance',
  };
  
  const hasEndurance = sports.some(s => ['running', 'cycling', 'swimming'].includes(s));
  const suffix = hasEndurance ? ' + Endurance' : '';
  
  return (goalNames[goal] || 'Custom Training') + suffix;
}

function generatePlanDescription(profile: UserProfile, split: string): string {
  const splitNames: Record<string, string> = {
    ppl: 'Push/Pull/Legs',
    upper_lower: 'Upper/Lower',
    full_body: 'Full Body',
  };
  
  return `A ${splitNames[split] || split} program designed for your ${profile.goal?.replace('_', ' ')} goal. ` +
    `Training ${profile.trainingDays?.length || 4} days per week with progressive overload built in.`;
}

function generateWelcomeMessage(
  profile: UserProfile,
  split: string,
  firstWeek: GeneratedWeek
): string {
  // This will be replaced with AI-generated content when available
  const goalDescriptions: Record<string, string> = {
    fat_loss: "focused on fat loss while preserving muscle",
    muscle_gain: "designed to maximize muscle growth",
    maintenance: "built to maintain your current fitness",
    performance: "optimized for athletic performance",
    event_training: `preparing you for your upcoming ${profile.eventType?.replace('_', ' ')}`,
  };
  
  const injuryNote = profile.injuries?.length 
    ? `\n\nI've noted your constraints (${profile.injuries.join(', ')}) and adjusted your programming accordingly.`
    : '';
  
  const enduranceNote = profile.sports?.some(s => ['running', 'cycling', 'swimming'].includes(s))
    ? "\n\nYour endurance work is strategically placed to complement your strength training, not compete with it."
    : '';
  
  return `Welcome to FORCE3.

Based on what you've told me, I've built a plan ${goalDescriptions[profile.goal || 'maintenance']}.

You'll train ${profile.trainingDays?.length || 4} days per week using a ${split.replace('_', ' ')} structure. Each session is designed to be efficient — get in, work hard, get out.${injuryNote}${enduranceNote}

Week 1 is about establishing baselines. I want to see what you can do before we start pushing.

Let's get to work.`;
}

// ============================================
// SAVE PLAN TO DATABASE
// ============================================

export async function savePlanToDatabase(
  userId: string,
  plan: GeneratedPlan
): Promise<string> {
  // Delete existing plan if any
  await prisma.trainingPlan.deleteMany({ where: { userId } });
  
  // Create new plan
  const createdPlan = await prisma.trainingPlan.create({
    data: {
      userId,
      name: plan.name,
      description: plan.description,
      splitType: plan.splitType,
      totalWeeks: plan.totalWeeks,
      currentWeek: 1,
      daysPerWeek: plan.weeks[0]?.sessions.length || 4,
      weeks: {
        create: plan.weeks.map(week => ({
          weekNumber: week.weekNumber,
          isDeload: week.isDeload,
          sessions: {
            create: week.sessions.map(session => ({
              dayOfWeek: session.dayOfWeek,
              sessionType: session.sessionType,
              sessionOrder: session.sessionOrder,
              cardioType: session.cardioType,
              targetDuration: session.targetDuration,
              targetDistance: session.targetDistance,
              notes: session.notes,
              exercises: session.exercises ? {
                create: session.exercises.map((ex, idx) => ({
                  exerciseName: ex.name,
                  exerciseOrder: idx + 1,
                  targetSets: ex.sets,
                  targetReps: ex.reps,
                  restSeconds: ex.restSeconds,
                  notes: ex.notes,
                })),
              } : undefined,
            })),
          },
        })),
      },
    },
  });
  
  return createdPlan.id;
}
