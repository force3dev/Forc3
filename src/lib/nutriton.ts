export type GoalMode = 'aggressive_cut' | 'moderate_cut' | 'maintenance' | 'lean_bulk' | 'bulk';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

interface UserStats {
  weightKg: number;
  heightCm: number;
  age: number;
  isMale?: boolean;
}

interface NutritionTargets {
  bmr: number;
  tdee: number;
  restDayCalories: number;
  restDayProtein: number;
  restDayCarbs: number;
  restDayFat: number;
  trainingDayCalories: number;
  trainingDayProtein: number;
  trainingDayCarbs: number;
  trainingDayFat: number;
}

export function calculateBMR(stats: UserStats): number {
  const { weightKg, heightCm, age, isMale = true } = stats;
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  return Math.round(isMale ? base + 5 : base - 161);
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return Math.round(bmr * multipliers[activityLevel]);
}

export function getActivityLevel(daysPerWeek: number): ActivityLevel {
  if (daysPerWeek <= 1) return 'sedentary';
  if (daysPerWeek <= 2) return 'light';
  if (daysPerWeek <= 4) return 'moderate';
  if (daysPerWeek <= 5) return 'active';
  return 'very_active';
}

export function getCalorieAdjustment(goal: GoalMode): number {
  const adjustments: Record<GoalMode, number> = {
    aggressive_cut: -750,
    moderate_cut: -500,
    maintenance: 0,
    lean_bulk: 250,
    bulk: 500,
  };
  return adjustments[goal];
}

export function getMacroSplit(goal: GoalMode): [number, number, number] {
  const splits: Record<GoalMode, [number, number, number]> = {
    aggressive_cut: [0.40, 0.30, 0.30],
    moderate_cut: [0.35, 0.35, 0.30],
    maintenance: [0.30, 0.40, 0.30],
    lean_bulk: [0.30, 0.45, 0.25],
    bulk: [0.25, 0.50, 0.25],
  };
  return splits[goal];
}

export function calculateNutritionTargets(
  stats: UserStats,
  daysPerWeek: number,
  goal: GoalMode
): NutritionTargets {
  const bmr = calculateBMR(stats);
  const activityLevel = getActivityLevel(daysPerWeek);
  const tdee = calculateTDEE(bmr, activityLevel);
  
  const calorieAdjustment = getCalorieAdjustment(goal);
  const [proteinPct, carbsPct, fatPct] = getMacroSplit(goal);
  
  const restDayCalories = Math.max(1200, tdee + calorieAdjustment);
  const trainingDayCalories = restDayCalories + 250;
  
  const restDayProtein = Math.round((restDayCalories * proteinPct) / 4);
  const restDayCarbs = Math.round((restDayCalories * carbsPct) / 4);
  const restDayFat = Math.round((restDayCalories * fatPct) / 9);
  
  const trainingDayProtein = Math.round((trainingDayCalories * proteinPct) / 4);
  const trainingDayCarbs = Math.round((trainingDayCalories * carbsPct) / 4);
  const trainingDayFat = Math.round((trainingDayCalories * fatPct) / 9);
  
  const minProtein = Math.round(stats.weightKg * 2.2);
  
  return {
    bmr,
    tdee,
    restDayCalories,
    restDayProtein: Math.max(restDayProtein, minProtein),
    restDayCarbs,
    restDayFat,
    trainingDayCalories,
    trainingDayProtein: Math.max(trainingDayProtein, minProtein),
    trainingDayCarbs,
    trainingDayFat,
  };
}