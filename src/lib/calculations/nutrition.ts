// Mifflin-St Jeor equation
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string
): number {
  if (gender === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
}

export function calculateTDEE(bmr: number, trainingDaysPerWeek: number): number {
  // Map training days to activity multiplier
  const multiplier =
    trainingDaysPerWeek <= 2 ? 1.375
    : trainingDaysPerWeek <= 4 ? 1.55
    : trainingDaysPerWeek <= 5 ? 1.725
    : 1.9;
  return Math.round(bmr * multiplier);
}

export interface MacroTargets {
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
}

export function calculateMacros(
  tdee: number,
  goal: string,
  weightKg: number
): MacroTargets {
  let calories: number;

  switch (goal) {
    case "fat_loss":
      calories = tdee - 400;
      break;
    case "muscle_gain":
      calories = tdee + 300;
      break;
    case "strength":
      calories = tdee + 100;
      break;
    default:
      calories = tdee;
  }

  // Minimum 1500 calories
  calories = Math.max(calories, 1500);

  // Protein: ~1g per lb of bodyweight (2.2g per kg)
  const weightLbs = weightKg * 2.2046;
  const protein = Math.round(weightLbs * 1.0);

  // Fat: 25% of calories
  const fat = Math.round((calories * 0.25) / 9);

  // Carbs: remainder
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

  return {
    calories: Math.round(calories),
    protein,
    carbs: Math.max(0, carbs),
    fat,
  };
}
