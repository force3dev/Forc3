// Standard plate weights in lbs
const PLATES_LBS = [45, 35, 25, 10, 5, 2.5];
const PLATES_KG = [20, 15, 10, 5, 2.5, 1.25];
const BAR_WEIGHT_LBS = 45;
const BAR_WEIGHT_KG = 20;

export interface PlateBreakdown {
  bar: number;
  platesPerSide: { weight: number; count: number }[];
  totalWeight: number;
  unit: "lbs" | "kg";
}

export function calculatePlates(
  targetWeight: number,
  unit: "lbs" | "kg" = "lbs"
): PlateBreakdown {
  const barWeight = unit === "lbs" ? BAR_WEIGHT_LBS : BAR_WEIGHT_KG;
  const plates = unit === "lbs" ? PLATES_LBS : PLATES_KG;

  const weightPerSide = (targetWeight - barWeight) / 2;
  const platesPerSide: { weight: number; count: number }[] = [];

  let remaining = Math.max(0, weightPerSide);

  for (const plate of plates) {
    if (remaining >= plate) {
      const count = Math.floor(remaining / plate);
      platesPerSide.push({ weight: plate, count });
      remaining -= plate * count;
      remaining = Math.round(remaining * 100) / 100; // avoid float errors
    }
  }

  const totalWeight =
    barWeight + platesPerSide.reduce((sum, p) => sum + p.weight * p.count * 2, 0);

  return {
    bar: barWeight,
    platesPerSide,
    totalWeight,
    unit,
  };
}
