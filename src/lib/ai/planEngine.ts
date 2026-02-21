// FORC3 Plan Generation Engine
// Evidence-based programming with proper periodization

export interface PlanInput {
  goal: string;            // fat_loss, muscle_gain, strength, endurance, general
  experienceLevel: string; // beginner, intermediate, advanced
  trainingDays: number;    // 2-6
  equipment: string;       // full_gym, home_gym, minimal, bodyweight
  injuries: string[];      // array of injury tags
  sport?: string;          // basketball, running, mma, etc.
  gender?: string;
}

export interface ExerciseSpec {
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  rpe?: number;
  restSeconds: number;
  muscleGroups: string[];
  equipment: string[];
  avoidIfInjury?: string[];
}

export interface WorkoutSpec {
  name: string;
  order: number;
  exercises: ExerciseSpec[];
}

export interface GeneratedPlan {
  name: string;
  type: string;
  split: string;
  daysPerWeek: number;
  workouts: WorkoutSpec[];
  notes: string;
}

// ─── Exercise Database ────────────────────────────────────────────────────────

const EXERCISES = {
  // PUSH - Chest, Shoulders, Triceps
  push: {
    compound: [
      { name: "Barbell Bench Press", equipment: ["barbell"], avoidIfInjury: ["shoulders", "wrists"], muscleGroups: ["chest", "shoulders", "triceps"] },
      { name: "Incline Barbell Bench Press", equipment: ["barbell"], avoidIfInjury: ["shoulders"], muscleGroups: ["upper chest", "shoulders", "triceps"] },
      { name: "Dumbbell Bench Press", equipment: ["dumbbells"], avoidIfInjury: ["shoulders", "wrists"], muscleGroups: ["chest", "shoulders", "triceps"] },
      { name: "Incline Dumbbell Press", equipment: ["dumbbells"], avoidIfInjury: ["shoulders"], muscleGroups: ["upper chest", "shoulders", "triceps"] },
      { name: "Push-Up", equipment: ["bodyweight"], avoidIfInjury: ["wrists"], muscleGroups: ["chest", "shoulders", "triceps"] },
      { name: "Dumbbell Shoulder Press", equipment: ["dumbbells"], avoidIfInjury: ["shoulders"], muscleGroups: ["shoulders", "triceps"] },
      { name: "Machine Chest Press", equipment: ["machine"], avoidIfInjury: [], muscleGroups: ["chest", "shoulders", "triceps"] },
    ],
    isolation: [
      { name: "Dumbbell Lateral Raise", equipment: ["dumbbells"], avoidIfInjury: ["shoulders"], muscleGroups: ["shoulders"] },
      { name: "Cable Lateral Raise", equipment: ["cable"], avoidIfInjury: ["shoulders"], muscleGroups: ["shoulders"] },
      { name: "Tricep Pushdown", equipment: ["cable"], avoidIfInjury: ["elbows"], muscleGroups: ["triceps"] },
      { name: "Overhead Tricep Extension", equipment: ["cable", "dumbbells"], avoidIfInjury: ["elbows"], muscleGroups: ["triceps"] },
      { name: "Pec Deck / Chest Fly", equipment: ["machine", "cable"], avoidIfInjury: ["shoulders"], muscleGroups: ["chest"] },
      { name: "Dumbbell Front Raise", equipment: ["dumbbells"], avoidIfInjury: ["shoulders"], muscleGroups: ["shoulders"] },
    ],
  },

  // PULL - Back, Biceps, Rear Delts
  pull: {
    compound: [
      { name: "Barbell Row", equipment: ["barbell"], avoidIfInjury: ["lower_back", "wrists"], muscleGroups: ["back", "biceps", "rear delts"] },
      { name: "Pull-Up", equipment: ["bodyweight", "pull-up bar"], avoidIfInjury: ["shoulders", "elbows"], muscleGroups: ["back", "biceps"] },
      { name: "Lat Pulldown", equipment: ["cable"], avoidIfInjury: ["shoulders"], muscleGroups: ["back", "biceps"] },
      { name: "Seated Cable Row", equipment: ["cable"], avoidIfInjury: ["lower_back"], muscleGroups: ["back", "biceps"] },
      { name: "Dumbbell Row", equipment: ["dumbbells"], avoidIfInjury: ["lower_back", "wrists"], muscleGroups: ["back", "biceps"] },
      { name: "T-Bar Row", equipment: ["barbell"], avoidIfInjury: ["lower_back"], muscleGroups: ["back", "biceps"] },
    ],
    isolation: [
      { name: "Bicep Curl", equipment: ["barbell", "dumbbells", "cable"], avoidIfInjury: ["elbows", "wrists"], muscleGroups: ["biceps"] },
      { name: "Hammer Curl", equipment: ["dumbbells", "cable"], avoidIfInjury: ["elbows"], muscleGroups: ["biceps", "brachialis"] },
      { name: "Face Pull", equipment: ["cable"], avoidIfInjury: ["shoulders"], muscleGroups: ["rear delts", "upper back"] },
      { name: "Cable Row (Close Grip)", equipment: ["cable"], avoidIfInjury: ["lower_back"], muscleGroups: ["back"] },
      { name: "Rear Delt Fly", equipment: ["dumbbells", "cable"], avoidIfInjury: [], muscleGroups: ["rear delts"] },
    ],
  },

  // LEGS - Quads, Hamstrings, Glutes, Calves
  legs: {
    compound: [
      { name: "Barbell Squat", equipment: ["barbell"], avoidIfInjury: ["knees", "lower_back"], muscleGroups: ["quads", "glutes", "hamstrings"] },
      { name: "Romanian Deadlift", equipment: ["barbell"], avoidIfInjury: ["lower_back", "hamstrings"], muscleGroups: ["hamstrings", "glutes", "lower_back"] },
      { name: "Leg Press", equipment: ["machine"], avoidIfInjury: ["knees", "lower_back"], muscleGroups: ["quads", "glutes"] },
      { name: "Bulgarian Split Squat", equipment: ["dumbbells", "bodyweight"], avoidIfInjury: ["knees"], muscleGroups: ["quads", "glutes", "hamstrings"] },
      { name: "Hack Squat", equipment: ["machine"], avoidIfInjury: ["knees"], muscleGroups: ["quads", "glutes"] },
      { name: "Barbell Hip Thrust", equipment: ["barbell"], avoidIfInjury: [], muscleGroups: ["glutes", "hamstrings"] },
      { name: "Goblet Squat", equipment: ["dumbbells", "kettlebell"], avoidIfInjury: ["knees", "lower_back"], muscleGroups: ["quads", "glutes"] },
    ],
    isolation: [
      { name: "Leg Extension", equipment: ["machine"], avoidIfInjury: ["knees"], muscleGroups: ["quads"] },
      { name: "Leg Curl", equipment: ["machine"], avoidIfInjury: ["knees", "lower_back"], muscleGroups: ["hamstrings"] },
      { name: "Standing Calf Raise", equipment: ["machine", "bodyweight"], avoidIfInjury: [], muscleGroups: ["calves"] },
      { name: "Seated Calf Raise", equipment: ["machine"], avoidIfInjury: [], muscleGroups: ["calves"] },
      { name: "Hip Abduction", equipment: ["machine", "cable"], avoidIfInjury: [], muscleGroups: ["glutes", "hip abductors"] },
    ],
  },

  // UPPER BODY (for Upper/Lower splits)
  upper: {
    push: [
      { name: "Barbell Bench Press", equipment: ["barbell"], avoidIfInjury: ["shoulders", "wrists"], muscleGroups: ["chest", "shoulders", "triceps"] },
      { name: "Incline Dumbbell Press", equipment: ["dumbbells"], avoidIfInjury: ["shoulders"], muscleGroups: ["upper chest", "shoulders", "triceps"] },
      { name: "Dumbbell Shoulder Press", equipment: ["dumbbells"], avoidIfInjury: ["shoulders"], muscleGroups: ["shoulders", "triceps"] },
      { name: "Tricep Pushdown", equipment: ["cable"], avoidIfInjury: ["elbows"], muscleGroups: ["triceps"] },
      { name: "Dumbbell Lateral Raise", equipment: ["dumbbells"], avoidIfInjury: ["shoulders"], muscleGroups: ["shoulders"] },
    ],
    pull: [
      { name: "Pull-Up", equipment: ["bodyweight", "pull-up bar"], avoidIfInjury: ["shoulders", "elbows"], muscleGroups: ["back", "biceps"] },
      { name: "Barbell Row", equipment: ["barbell"], avoidIfInjury: ["lower_back", "wrists"], muscleGroups: ["back", "biceps"] },
      { name: "Lat Pulldown", equipment: ["cable"], avoidIfInjury: ["shoulders"], muscleGroups: ["back", "biceps"] },
      { name: "Face Pull", equipment: ["cable"], avoidIfInjury: [], muscleGroups: ["rear delts"] },
      { name: "Bicep Curl", equipment: ["dumbbells"], avoidIfInjury: ["elbows"], muscleGroups: ["biceps"] },
    ],
  },

  // LOWER BODY (for Upper/Lower splits)
  lower: {
    quad: [
      { name: "Barbell Squat", equipment: ["barbell"], avoidIfInjury: ["knees", "lower_back"], muscleGroups: ["quads", "glutes"] },
      { name: "Leg Press", equipment: ["machine"], avoidIfInjury: ["knees"], muscleGroups: ["quads", "glutes"] },
      { name: "Bulgarian Split Squat", equipment: ["dumbbells"], avoidIfInjury: ["knees"], muscleGroups: ["quads", "glutes"] },
    ],
    hinge: [
      { name: "Romanian Deadlift", equipment: ["barbell"], avoidIfInjury: ["lower_back"], muscleGroups: ["hamstrings", "glutes"] },
      { name: "Leg Curl", equipment: ["machine"], avoidIfInjury: ["knees"], muscleGroups: ["hamstrings"] },
      { name: "Barbell Hip Thrust", equipment: ["barbell"], avoidIfInjury: [], muscleGroups: ["glutes"] },
    ],
    isolation: [
      { name: "Leg Extension", equipment: ["machine"], avoidIfInjury: ["knees"], muscleGroups: ["quads"] },
      { name: "Standing Calf Raise", equipment: ["machine", "bodyweight"], avoidIfInjury: [], muscleGroups: ["calves"] },
    ],
  },

  // FULL BODY
  fullBody: {
    movements: [
      { name: "Barbell Squat", equipment: ["barbell"], avoidIfInjury: ["knees", "lower_back"], muscleGroups: ["quads", "glutes"] },
      { name: "Barbell Bench Press", equipment: ["barbell"], avoidIfInjury: ["shoulders"], muscleGroups: ["chest", "triceps"] },
      { name: "Barbell Row", equipment: ["barbell"], avoidIfInjury: ["lower_back"], muscleGroups: ["back", "biceps"] },
      { name: "Romanian Deadlift", equipment: ["barbell"], avoidIfInjury: ["lower_back"], muscleGroups: ["hamstrings", "glutes"] },
      { name: "Overhead Press", equipment: ["barbell", "dumbbells"], avoidIfInjury: ["shoulders"], muscleGroups: ["shoulders"] },
      { name: "Pull-Up", equipment: ["bodyweight"], avoidIfInjury: ["shoulders"], muscleGroups: ["back", "biceps"] },
      { name: "Goblet Squat", equipment: ["dumbbells", "kettlebell"], avoidIfInjury: ["knees"], muscleGroups: ["quads", "glutes"] },
      { name: "Dumbbell Bench Press", equipment: ["dumbbells"], avoidIfInjury: ["shoulders"], muscleGroups: ["chest", "triceps"] },
      { name: "Dumbbell Row", equipment: ["dumbbells"], avoidIfInjury: ["lower_back"], muscleGroups: ["back", "biceps"] },
    ],
  },
};

// ─── Equipment Filter ─────────────────────────────────────────────────────────

function getAvailableEquipment(equipment: string): string[] {
  switch (equipment) {
    case "full_gym":
      return ["barbell", "dumbbells", "cable", "machine", "bodyweight", "pull-up bar", "kettlebell"];
    case "home_gym":
      return ["dumbbells", "barbell", "bodyweight", "pull-up bar", "kettlebell"];
    case "minimal":
      return ["dumbbells", "bodyweight"];
    case "bodyweight":
      return ["bodyweight", "pull-up bar"];
    default:
      return ["barbell", "dumbbells", "cable", "machine", "bodyweight", "pull-up bar"];
  }
}

function exerciseFits(
  exercise: { equipment: string[]; avoidIfInjury?: string[] },
  availableEquipment: string[],
  injuries: string[]
): boolean {
  const hasEquipment = exercise.equipment.some(e => availableEquipment.includes(e));
  const hasContraindication = (exercise.avoidIfInjury || []).some(inj => injuries.includes(inj));
  return hasEquipment && !hasContraindication;
}

// ─── Split Determination ──────────────────────────────────────────────────────

function determineSplit(days: number, experience: string): string {
  if (days <= 3) return "full_body";
  if (days === 4) return "upper_lower";
  if (days >= 5) {
    if (experience === "beginner") return "upper_lower";
    return "ppl";
  }
  return "full_body";
}

// ─── Volume Multipliers ───────────────────────────────────────────────────────

function getVolumeConfig(experience: string, goal: string) {
  const base = { sets: 3, repsMin: 8, repsMax: 12, rpe: 7.5, rest: 90 };

  // Experience adjustments
  if (experience === "beginner") {
    base.sets = 3;
    base.repsMin = 8;
    base.repsMax = 12;
    base.rest = 90;
  } else if (experience === "intermediate") {
    base.sets = 4;
    base.repsMin = 6;
    base.repsMax = 12;
    base.rest = 120;
  } else if (experience === "advanced") {
    base.sets = 4;
    base.repsMin = 5;
    base.repsMax = 10;
    base.rest = 150;
  }

  // Goal adjustments
  if (goal === "strength") {
    base.repsMin = 3;
    base.repsMax = 6;
    base.rpe = 8.5;
    base.rest = 180;
  } else if (goal === "endurance") {
    base.repsMin = 15;
    base.repsMax = 20;
    base.rpe = 6.5;
    base.rest = 60;
  } else if (goal === "muscle_gain") {
    base.repsMin = 8;
    base.repsMax = 15;
    base.rpe = 8.0;
    base.rest = 90;
  } else if (goal === "fat_loss") {
    base.repsMin = 10;
    base.repsMax = 15;
    base.rpe = 7.5;
    base.rest = 60;
  }

  return base;
}

// ─── Workout Builders ─────────────────────────────────────────────────────────

function pickExercise(
  pool: typeof EXERCISES.push.compound,
  available: string[],
  injuries: string[],
  exclude: Set<string>
) {
  const filtered = pool.filter(
    e => exerciseFits(e, available, injuries) && !exclude.has(e.name)
  );
  return filtered[0] || null;
}

function buildExerciseSpec(
  ex: { name: string; muscleGroups: string[] },
  config: ReturnType<typeof getVolumeConfig>,
  overrides?: Partial<ExerciseSpec>
): ExerciseSpec {
  return {
    name: ex.name,
    sets: config.sets,
    repsMin: config.repsMin,
    repsMax: config.repsMax,
    rpe: config.rpe,
    restSeconds: config.rest,
    muscleGroups: ex.muscleGroups,
    equipment: [],
    ...overrides,
  };
}

// ─── PPL Builder ──────────────────────────────────────────────────────────────

function buildPPL(input: PlanInput): WorkoutSpec[] {
  const avail = getAvailableEquipment(input.equipment);
  const cfg = getVolumeConfig(input.experienceLevel, input.goal);
  const used = new Set<string>();

  function pick(pool: typeof EXERCISES.push.compound) {
    return pickExercise(pool, avail, input.injuries, used);
  }

  const push = EXERCISES.push;
  const pull = EXERCISES.pull;
  const legs = EXERCISES.legs;

  // Push Day A
  const pushExercises: ExerciseSpec[] = [];
  const pushMain = pick(push.compound);
  if (pushMain) { used.add(pushMain.name); pushExercises.push(buildExerciseSpec(pushMain, cfg, { sets: cfg.sets })); }
  const pushIncline = pick(push.compound);
  if (pushIncline) { used.add(pushIncline.name); pushExercises.push(buildExerciseSpec(pushIncline, cfg)); }
  const shoulderPress = pick(push.compound.filter(e => e.muscleGroups.includes("shoulders")));
  if (shoulderPress) { used.add(shoulderPress.name); pushExercises.push(buildExerciseSpec(shoulderPress, cfg, { sets: 3 })); }
  const lateral = pick(push.isolation.filter(e => e.name.includes("Lateral")));
  if (lateral) { used.add(lateral.name); pushExercises.push(buildExerciseSpec(lateral, { ...cfg, sets: 3, repsMin: 12, repsMax: 20 }, { restSeconds: 60 })); }
  const tricep = pick(push.isolation.filter(e => e.muscleGroups.includes("triceps")));
  if (tricep) { used.add(tricep.name); pushExercises.push(buildExerciseSpec(tricep, { ...cfg, sets: 3, repsMin: 10, repsMax: 15 }, { restSeconds: 60 })); }
  const chest = pick(push.isolation.filter(e => e.muscleGroups.includes("chest")));
  if (chest) { used.add(chest.name); pushExercises.push(buildExerciseSpec(chest, { ...cfg, sets: 3, repsMin: 12, repsMax: 15 }, { restSeconds: 60 })); }

  // Pull Day A
  const pullExercises: ExerciseSpec[] = [];
  const pullMain = pick(pull.compound);
  if (pullMain) { used.add(pullMain.name); pullExercises.push(buildExerciseSpec(pullMain, cfg)); }
  const pullSec = pick(pull.compound);
  if (pullSec) { used.add(pullSec.name); pullExercises.push(buildExerciseSpec(pullSec, cfg)); }
  const facePull = pick(pull.isolation.filter(e => e.name.includes("Face")));
  if (facePull) { used.add(facePull.name); pullExercises.push(buildExerciseSpec(facePull, { ...cfg, sets: 3, repsMin: 15, repsMax: 20 }, { restSeconds: 60 })); }
  const curl = pick(pull.isolation.filter(e => e.muscleGroups.includes("biceps")));
  if (curl) { used.add(curl.name); pullExercises.push(buildExerciseSpec(curl, { ...cfg, sets: 3, repsMin: 10, repsMax: 15 }, { restSeconds: 60 })); }
  const hammerCurl = pick(pull.isolation.filter(e => e.name.includes("Hammer")));
  if (hammerCurl) { used.add(hammerCurl.name); pullExercises.push(buildExerciseSpec(hammerCurl, { ...cfg, sets: 3, repsMin: 10, repsMax: 15 }, { restSeconds: 60 })); }

  // Legs Day A
  const legExercises: ExerciseSpec[] = [];
  const legMain = pick(legs.compound.filter(e => e.muscleGroups.includes("quads")));
  if (legMain) { used.add(legMain.name); legExercises.push(buildExerciseSpec(legMain, { ...cfg, repsMin: Math.max(5, cfg.repsMin) })); }
  const rdl = pick(legs.compound.filter(e => e.muscleGroups.includes("hamstrings")));
  if (rdl) { used.add(rdl.name); legExercises.push(buildExerciseSpec(rdl, cfg)); }
  const legAcc = pick(legs.compound.filter(e => !e.muscleGroups.includes("hamstrings")));
  if (legAcc) { used.add(legAcc.name); legExercises.push(buildExerciseSpec(legAcc, cfg, { sets: 3 })); }
  const legExt = pick(legs.isolation.filter(e => e.muscleGroups.includes("quads")));
  if (legExt) { used.add(legExt.name); legExercises.push(buildExerciseSpec(legExt, { ...cfg, sets: 3, repsMin: 12, repsMax: 15 }, { restSeconds: 60 })); }
  const legCurl = pick(legs.isolation.filter(e => e.muscleGroups.includes("hamstrings")));
  if (legCurl) { used.add(legCurl.name); legExercises.push(buildExerciseSpec(legCurl, { ...cfg, sets: 3, repsMin: 10, repsMax: 15 }, { restSeconds: 60 })); }
  const calf = pick(legs.isolation.filter(e => e.muscleGroups.includes("calves")));
  if (calf) { used.add(calf.name); legExercises.push(buildExerciseSpec(calf, { ...cfg, sets: 4, repsMin: 12, repsMax: 20 }, { restSeconds: 45 })); }

  const workouts: WorkoutSpec[] = [
    { name: "Push A", order: 1, exercises: pushExercises },
    { name: "Pull A", order: 2, exercises: pullExercises },
    { name: "Legs A", order: 3, exercises: legExercises },
  ];

  if (input.trainingDays >= 6) {
    // Second rotation - clear used for slightly different exercises
    workouts.push(
      { name: "Push B", order: 4, exercises: pushExercises.slice(0, 4) },
      { name: "Pull B", order: 5, exercises: pullExercises.slice(0, 4) },
      { name: "Legs B", order: 6, exercises: legExercises.slice(0, 4) },
    );
  } else if (input.trainingDays === 5) {
    workouts.push(
      { name: "Push B", order: 4, exercises: pushExercises.slice(0, 4) },
      { name: "Pull B", order: 5, exercises: pullExercises.slice(0, 4) },
    );
  }

  return workouts;
}

// ─── Upper/Lower Builder ──────────────────────────────────────────────────────

function buildUpperLower(input: PlanInput): WorkoutSpec[] {
  const avail = getAvailableEquipment(input.equipment);
  const cfg = getVolumeConfig(input.experienceLevel, input.goal);
  const used = new Set<string>();

  function pick(pool: typeof EXERCISES.push.compound) {
    return pickExercise(pool, avail, input.injuries, used);
  }

  const upper = EXERCISES.upper;
  const lower = EXERCISES.lower;

  // Upper A
  const upperA: ExerciseSpec[] = [];
  const pressA = pick(upper.push);
  if (pressA) { used.add(pressA.name); upperA.push(buildExerciseSpec(pressA, cfg)); }
  const rowA = pick(upper.pull);
  if (rowA) { used.add(rowA.name); upperA.push(buildExerciseSpec(rowA, cfg)); }
  const shoulderA = pick(upper.push.filter(e => e.muscleGroups.includes("shoulders")));
  if (shoulderA) { used.add(shoulderA.name); upperA.push(buildExerciseSpec(shoulderA, cfg, { sets: 3 })); }
  const latA = pick(upper.pull.filter(e => e.muscleGroups.includes("back")));
  if (latA) { used.add(latA.name); upperA.push(buildExerciseSpec(latA, cfg, { sets: 3 })); }
  const triA = pick(upper.push.filter(e => e.muscleGroups.includes("triceps")));
  if (triA) { used.add(triA.name); upperA.push(buildExerciseSpec(triA, { ...cfg, sets: 3, repsMin: 10, repsMax: 15 })); }
  const biA = pick(upper.pull.filter(e => e.muscleGroups.includes("biceps")));
  if (biA) { used.add(biA.name); upperA.push(buildExerciseSpec(biA, { ...cfg, sets: 3, repsMin: 10, repsMax: 15 })); }

  // Lower A
  const lowerA: ExerciseSpec[] = [];
  const quadA = pick(lower.quad);
  if (quadA) { used.add(quadA.name); lowerA.push(buildExerciseSpec(quadA, cfg)); }
  const hingeA = pick(lower.hinge);
  if (hingeA) { used.add(hingeA.name); lowerA.push(buildExerciseSpec(hingeA, cfg)); }
  const quadIsoA = pick(lower.isolation.filter(e => e.muscleGroups.includes("quads")));
  if (quadIsoA) { used.add(quadIsoA.name); lowerA.push(buildExerciseSpec(quadIsoA, { ...cfg, sets: 3, repsMin: 12, repsMax: 15 })); }
  const calfA = pick(lower.isolation.filter(e => e.muscleGroups.includes("calves")));
  if (calfA) { used.add(calfA.name); lowerA.push(buildExerciseSpec(calfA, { ...cfg, sets: 3, repsMin: 15, repsMax: 20 })); }

  const workouts: WorkoutSpec[] = [
    { name: "Upper A", order: 1, exercises: upperA },
    { name: "Lower A", order: 2, exercises: lowerA },
    { name: "Upper B", order: 3, exercises: upperA.slice(0, 5) },
    { name: "Lower B", order: 4, exercises: lowerA.slice(0, 3) },
  ];

  if (input.trainingDays === 5) {
    workouts.push({ name: "Upper C", order: 5, exercises: upperA.slice(0, 4) });
  }

  return workouts;
}

// ─── Full Body Builder ────────────────────────────────────────────────────────

function buildFullBody(input: PlanInput): WorkoutSpec[] {
  const avail = getAvailableEquipment(input.equipment);
  const cfg = getVolumeConfig(input.experienceLevel, input.goal);
  const used = new Set<string>();

  const movements = EXERCISES.fullBody.movements.filter(
    e => exerciseFits(e, avail, input.injuries) && !used.has(e.name)
  );

  // Full Body A
  const fbA: ExerciseSpec[] = [];
  for (const ex of movements.slice(0, 5)) {
    used.add(ex.name);
    fbA.push(buildExerciseSpec(ex, { ...cfg, sets: 3 }));
  }

  // Full Body B - same movements, different order or slight variation
  const fbB: ExerciseSpec[] = [];
  const bMovements = [...movements].reverse().filter(e => !new Set(fbA.map(x => x.name)).has(e.name));
  for (const ex of bMovements.slice(0, 4)) {
    fbB.push(buildExerciseSpec(ex, { ...cfg, sets: 3 }));
  }
  // Add some from A as well
  for (const ex of fbA.slice(0, 2)) {
    if (!fbB.find(e => e.name === ex.name)) fbB.push({ ...ex });
  }

  const workouts: WorkoutSpec[] = [
    { name: "Full Body A", order: 1, exercises: fbA },
    { name: "Full Body B", order: 2, exercises: fbB },
  ];

  if (input.trainingDays >= 3) {
    workouts.push({ name: "Full Body C", order: 3, exercises: fbA.slice(0, 4) });
  }

  return workouts;
}

// ─── Main Generator ───────────────────────────────────────────────────────────

export function generatePlan(input: PlanInput): GeneratedPlan {
  const split = determineSplit(input.trainingDays, input.experienceLevel);

  let workouts: WorkoutSpec[];
  let planName: string;
  let planType: string;

  if (split === "ppl") {
    workouts = buildPPL(input);
    planName = input.goal === "strength" ? "Strength PPL" : "Hypertrophy PPL";
    planType = input.goal === "strength" ? "strength" : "hypertrophy";
  } else if (split === "upper_lower") {
    workouts = buildUpperLower(input);
    planName = "Upper/Lower Split";
    planType = "hypertrophy";
  } else {
    workouts = buildFullBody(input);
    planName = "Full Body Program";
    planType = "general";
  }

  const splitDisplay: Record<string, string> = {
    ppl: "Push/Pull/Legs",
    upper_lower: "Upper/Lower",
    full_body: "Full Body",
  };

  return {
    name: planName,
    type: planType,
    split,
    daysPerWeek: input.trainingDays,
    workouts,
    notes: `${splitDisplay[split]} split, ${input.trainingDays}x/week, optimized for ${input.goal.replace(/_/g, " ")}`,
  };
}
