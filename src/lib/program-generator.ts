// ─── Hybrid Athlete Program Generator ────────────────────────────────────────
// Generates structured weekly plans combining strength and cardio for hybrid athletes.

import { CARDIO_TEMPLATES, CardioTemplate } from "@/lib/cardio-templates";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RaceGoal {
  type: string;
  date?: string;
  priority?: "a" | "b";
}

export interface HybridProgramInput {
  goal: string;               // fat_loss, muscle_gain, strength, endurance, general
  experienceLevel: string;    // beginner, intermediate, advanced
  trainingDays: number;       // 2–6 lifting days
  sport?: string;             // running, swimming, mma, etc.
  raceGoals?: RaceGoal[];     // upcoming events
  trainingVolume?: string;    // beginner, intermediate, advanced (cardio volume)
}

export type DayName = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface CardioAssignment {
  templateId: string;
  title: string;
  type: string;
  duration: number;
  intensity: "easy" | "moderate" | "hard" | "max";
}

export interface DayPlan {
  day: DayName;
  dayIndex: number;          // 0=Mon … 6=Sun
  hasStrength: boolean;
  strengthLabel?: string;    // e.g. "Upper", "Push", "Full Body"
  cardio?: CardioAssignment;
  isRest: boolean;
  note?: string;
}

export interface WeeklyHybridPlan {
  days: DayPlan[];
  weeklyCardioMinutes: number;
  weeklyLiftDays: number;
  programType: string;      // "triathlete", "runner", "swimmer", "hybrid", "general"
  description: string;
}

// ─── Race / Sport Detection ───────────────────────────────────────────────────

interface SportProfile {
  isTriathlete: boolean;
  isRunner: boolean;
  isSwimmer: boolean;
  isCyclist: boolean;
  isOCR: boolean;
  isPowerlifter: boolean;
  primarySport: string;
  weeksToRace: number | null;
  inTaper: boolean;          // ≤ 3 weeks out
  raceApproaching: boolean;  // ≤ 6 weeks out
}

function buildSportProfile(input: HybridProgramInput): SportProfile {
  const { sport, raceGoals } = input;
  const goals = raceGoals || [];

  const isTriathlete =
    sport === "triathlon" ||
    goals.some(r =>
      ["sprint_tri", "olympic_tri", "half_ironman", "full_ironman"].includes(r.type)
    );

  const isRunner =
    sport === "running" ||
    goals.some(r =>
      ["5k_10k", "half_marathon", "full_marathon"].includes(r.type)
    );

  const isSwimmer =
    sport === "swimming" ||
    goals.some(r => r.type === "swim_race");

  const isCyclist =
    sport === "cycling" ||
    goals.some(r => r.type === "cycling_race");

  const isOCR = goals.some(r => r.type === "ocr");
  const isPowerlifter = goals.some(r => r.type === "powerlifting");

  // Determine weeks to nearest race
  const today = Date.now();
  const datedGoals = goals
    .filter(r => r.date)
    .map(r => Math.max(0, Math.round((new Date(r.date!).getTime() - today) / (86400000 * 7))));

  const weeksToRace = datedGoals.length > 0 ? Math.min(...datedGoals) : null;
  const inTaper = weeksToRace !== null && weeksToRace <= 3;
  const raceApproaching = weeksToRace !== null && weeksToRace <= 6;

  let primarySport = "general";
  if (isTriathlete) primarySport = "triathlete";
  else if (isRunner) primarySport = "runner";
  else if (isSwimmer) primarySport = "swimmer";
  else if (isCyclist) primarySport = "cyclist";
  else if (isOCR) primarySport = "ocr";
  else if (sport) primarySport = sport;

  return {
    isTriathlete,
    isRunner,
    isSwimmer,
    isCyclist,
    isOCR,
    isPowerlifter,
    primarySport,
    weeksToRace,
    inTaper,
    raceApproaching,
  };
}

// ─── Cardio Volume Targets ────────────────────────────────────────────────────

function getCardioFrequency(input: HybridProgramInput, sp: SportProfile): number {
  const vol = input.trainingVolume || "intermediate";

  if (sp.isTriathlete) {
    return vol === "advanced" ? 5 : vol === "intermediate" ? 4 : 3;
  }
  if (sp.isRunner) {
    return vol === "advanced" ? 5 : vol === "intermediate" ? 4 : 3;
  }
  if (sp.isSwimmer || sp.isCyclist) {
    return vol === "advanced" ? 4 : 3;
  }
  if (input.goal === "endurance") {
    return 4;
  }
  if (input.goal === "fat_loss") {
    return 3;
  }
  // Strength / muscle_gain / general
  return 2;
}

// ─── Template Lookup ──────────────────────────────────────────────────────────

function t(id: string): CardioTemplate {
  const found = CARDIO_TEMPLATES.find(c => c.id === id);
  if (!found) throw new Error(`Cardio template not found: ${id}`);
  return found;
}

function toAssignment(template: CardioTemplate): CardioAssignment {
  return {
    templateId: template.id,
    title: template.title,
    type: template.type,
    duration: template.duration,
    intensity: template.intensity,
  };
}

// ─── Rule Checks ─────────────────────────────────────────────────────────────

function countConsecutiveHard(
  days: DayPlan[],
  currentIdx: number
): number {
  let count = 0;
  for (let i = currentIdx - 1; i >= 0; i--) {
    const c = days[i].cardio;
    if (c && (c.intensity === "hard" || c.intensity === "max")) count++;
    else break;
  }
  return count;
}

function prevDayHasHeavyLift(days: DayPlan[], currentIdx: number): boolean {
  if (currentIdx === 0) return false;
  const prev = days[currentIdx - 1];
  // Legs / Lower = heavy; Upper / Push / Pull = moderate
  return (
    prev.hasStrength &&
    !!prev.strengthLabel &&
    /legs|lower|full/i.test(prev.strengthLabel)
  );
}

// ─── Strength Day Layout ──────────────────────────────────────────────────────

function assignStrengthDays(
  totalDays: number,
  liftDays: number,
  sp: SportProfile
): (string | null)[] {
  // Returns a 7-element array (Mon–Sun) with strength labels or null
  const schedule: (string | null)[] = Array(7).fill(null);

  if (liftDays >= 6) {
    // PPL × 2
    const labels = ["Push A", "Pull A", "Legs A", "Push B", "Pull B", "Legs B"];
    for (let i = 0; i < 6; i++) schedule[i] = labels[i];
  } else if (liftDays === 5) {
    schedule[0] = "Push";
    schedule[1] = "Pull";
    schedule[2] = "Legs";
    schedule[3] = "Upper";
    schedule[4] = "Full Body";
  } else if (liftDays === 4) {
    schedule[0] = "Upper A";
    schedule[2] = "Lower A";
    schedule[3] = "Upper B";
    schedule[5] = "Lower B"; // Friday or Saturday
    // Adjust: prefer Mon/Tue/Thu/Fri
    const preferred = [0, 1, 3, 4];
    const labels = ["Upper A", "Lower A", "Upper B", "Lower B"];
    schedule.fill(null);
    preferred.forEach((d, i) => { schedule[d] = labels[i]; });
  } else if (liftDays === 3) {
    schedule[0] = "Full Body A";
    schedule[2] = "Full Body B";
    schedule[4] = "Full Body C";
  } else if (liftDays === 2) {
    schedule[0] = "Upper";
    schedule[3] = "Lower";
  }

  // For powerlifters keep Saturday free for long sessions
  if (sp.isPowerlifter && schedule[5] === null) {
    // No adjustment needed
  }

  return schedule;
}

// ─── Weekly Plan Builders ─────────────────────────────────────────────────────

const DAY_NAMES: DayName[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildTriathletePlan(
  input: HybridProgramInput,
  sp: SportProfile,
  liftDays: number,
  cardioDays: number
): DayPlan[] {
  // Reference: Mon Lift+EasyRun, Tue Swim, Wed Lift+Tempo, Thu Bike, Fri Lift+EasySwim, Sat Long, Sun Rest
  const strengthSchedule = assignStrengthDays(7, liftDays, sp);

  // Taper: swap hard sessions for easy
  const taperMod = sp.inTaper;

  const cardioMap: Record<number, CardioAssignment | null> = {
    0: toAssignment(t("run-easy")),                                 // Mon: easy run
    1: toAssignment(t("swim-drills")),                             // Tue: swim technique
    2: toAssignment(taperMod ? t("run-easy") : t("run-tempo")),    // Wed: tempo (or easy in taper)
    3: toAssignment(taperMod ? t("bike-recovery") : t("bike-endurance")), // Thu: bike
    4: toAssignment(t("swim-pull")),                               // Fri: swim strength
    5: toAssignment(taperMod ? t("run-easy") : t("run-long")),    // Sat: long run (easy in taper)
    6: null,                                                        // Sun: rest
  };

  return DAY_NAMES.map((day, i) => ({
    day,
    dayIndex: i,
    hasStrength: !!strengthSchedule[i],
    strengthLabel: strengthSchedule[i] || undefined,
    cardio: cardioMap[i] || undefined,
    isRest: i === 6,
    note: i === 6
      ? "Rest & recovery"
      : taperMod && [3, 5].includes(i)
      ? "Taper week — keep intensity low"
      : undefined,
  }));
}

function buildRunnerPlan(
  input: HybridProgramInput,
  sp: SportProfile,
  liftDays: number,
  cardioDays: number
): DayPlan[] {
  const strengthSchedule = assignStrengthDays(7, liftDays, sp);
  const taperMod = sp.inTaper;

  // Avoid hard intervals the day after a heavy lift day
  const cardioMap: Record<number, CardioAssignment | null> = {
    0: toAssignment(t("run-easy")),                                           // Mon
    1: toAssignment(taperMod ? t("run-easy") : t("run-400-intervals")),       // Tue: intervals
    2: toAssignment(t("run-easy")),                                           // Wed
    3: toAssignment(taperMod ? t("run-easy") : t("run-tempo")),               // Thu: tempo
    4: toAssignment(t("run-easy")),                                           // Fri: recovery run
    5: toAssignment(taperMod ? t("run-easy") : t("run-long")),               // Sat: long run
    6: null,                                                                   // Sun: rest
  };

  if (cardioDays < 5) delete cardioMap[4]; // Remove Friday easy run
  if (cardioDays < 4) delete cardioMap[2]; // Remove Wednesday easy run

  return DAY_NAMES.map((day, i) => ({
    day,
    dayIndex: i,
    hasStrength: !!strengthSchedule[i],
    strengthLabel: strengthSchedule[i] || undefined,
    cardio: cardioMap[i] || undefined,
    isRest: i === 6 && !cardioMap[6],
    note: sp.raceApproaching && i === 5 ? "Key long run — race simulation pace" : undefined,
  }));
}

function buildSwimmerPlan(
  input: HybridProgramInput,
  sp: SportProfile,
  liftDays: number,
  cardioDays: number
): DayPlan[] {
  const strengthSchedule = assignStrengthDays(7, liftDays, sp);
  const taperMod = sp.inTaper;

  const cardioMap: Record<number, CardioAssignment | null> = {
    0: toAssignment(t("swim-drills")),
    1: null,
    2: toAssignment(taperMod ? t("swim-endurance") : t("swim-pull")),
    3: toAssignment(taperMod ? t("swim-drills") : t("swim-sprints")),
    4: toAssignment(t("swim-kick")),
    5: toAssignment(t("swim-endurance")),
    6: null,
  };

  if (cardioDays < 4) delete cardioMap[4];

  return DAY_NAMES.map((day, i) => ({
    day,
    dayIndex: i,
    hasStrength: !!strengthSchedule[i],
    strengthLabel: strengthSchedule[i] || undefined,
    cardio: cardioMap[i] || undefined,
    isRest: !cardioMap[i] && !strengthSchedule[i],
  }));
}

function buildCyclistPlan(
  input: HybridProgramInput,
  sp: SportProfile,
  liftDays: number,
  cardioDays: number
): DayPlan[] {
  const strengthSchedule = assignStrengthDays(7, liftDays, sp);
  const taperMod = sp.inTaper;

  const cardioMap: Record<number, CardioAssignment | null> = {
    0: toAssignment(t("bike-recovery")),
    1: null,
    2: toAssignment(taperMod ? t("bike-recovery") : t("bike-threshold")),
    3: toAssignment(t("bike-endurance")),
    4: null,
    5: toAssignment(taperMod ? t("bike-endurance") : t("bike-endurance")), // Long ride
    6: null,
  };

  return DAY_NAMES.map((day, i) => ({
    day,
    dayIndex: i,
    hasStrength: !!strengthSchedule[i],
    strengthLabel: strengthSchedule[i] || undefined,
    cardio: cardioMap[i] || undefined,
    isRest: !cardioMap[i] && !strengthSchedule[i],
    note: i === 5 ? "Long ride — aim for 60–90 min" : undefined,
  }));
}

function buildEndurancePlan(
  input: HybridProgramInput,
  liftDays: number
): DayPlan[] {
  const strengthSchedule = assignStrengthDays(7, liftDays, { isTriathlete: false } as SportProfile);

  const cardioMap: Record<number, CardioAssignment | null> = {
    0: toAssignment(t("run-easy")),
    1: null,
    2: toAssignment(t("run-800-repeats")),
    3: toAssignment(t("bike-endurance")),
    4: null,
    5: toAssignment(t("run-long")),
    6: toAssignment(t("bike-recovery")),
  };

  return DAY_NAMES.map((day, i) => ({
    day,
    dayIndex: i,
    hasStrength: !!strengthSchedule[i],
    strengthLabel: strengthSchedule[i] || undefined,
    cardio: cardioMap[i] || undefined,
    isRest: !cardioMap[i] && !strengthSchedule[i],
  }));
}

function buildGeneralPlan(
  input: HybridProgramInput,
  liftDays: number,
  cardioDays: number
): DayPlan[] {
  const strengthSchedule = assignStrengthDays(7, liftDays, {} as SportProfile);

  // General cardio: mix of formats, nothing too sport-specific
  const generalCardio: CardioAssignment[] = [
    toAssignment(t("run-fartlek")),
    toAssignment(t("hiit-jump-rope-tabata")),
    toAssignment(t("row-steady-state")),
    toAssignment(t("bike-recovery")),
    toAssignment(t("run-easy")),
  ];

  const days: DayPlan[] = DAY_NAMES.map((day, i) => ({
    day,
    dayIndex: i,
    hasStrength: !!strengthSchedule[i],
    strengthLabel: strengthSchedule[i] || undefined,
    cardio: undefined,
    isRest: false,
  }));

  // Assign cardio to non-lifting days first, then fill remaining slots
  let cardioAssigned = 0;
  const cardioPool = [...generalCardio];

  // Apply rule: easy cardio on day after heavy lift
  for (let i = 0; i < 7 && cardioAssigned < cardioDays; i++) {
    if (days[i].hasStrength) continue; // No standalone cardio on pure lift days for general users
    if (i === 6) continue; // Keep Sunday as rest for general users

    const useEasy = prevDayHasHeavyLift(days, i);
    if (useEasy) {
      days[i].cardio = toAssignment(t("bike-recovery"));
    } else {
      days[i].cardio = cardioPool[cardioAssigned % cardioPool.length];
    }
    cardioAssigned++;
  }

  // Mark pure rest days
  days.forEach(d => {
    d.isRest = !d.hasStrength && !d.cardio;
  });

  return days;
}

// ─── Constraint Enforcement ───────────────────────────────────────────────────

function enforceConstraints(days: DayPlan[]): DayPlan[] {
  // Rule: no more than 2 hard cardio days back-to-back
  for (let i = 0; i < days.length; i++) {
    const c = days[i].cardio;
    if (!c) continue;
    if (countConsecutiveHard(days, i) >= 2 && (c.intensity === "hard" || c.intensity === "max")) {
      // Downgrade to easy equivalent
      const easyTemplate = CARDIO_TEMPLATES.find(t =>
        t.type === c.type && t.intensity === "easy"
      ) || CARDIO_TEMPLATES.find(t => t.intensity === "easy");
      if (easyTemplate) {
        days[i].cardio = toAssignment(easyTemplate);
        days[i].note = (days[i].note ? days[i].note + " · " : "") + "Intensity reduced — recovery day";
      }
    }

    // Rule: easy cardio on day after heavy lifting session
    if (prevDayHasHeavyLift(days, i) && c.intensity === "hard") {
      const easyTemplate = CARDIO_TEMPLATES.find(t =>
        t.type === c.type && t.intensity === "easy"
      ) || t("bike-recovery");
      days[i].cardio = toAssignment(easyTemplate);
      days[i].note = (days[i].note ? days[i].note + " · " : "") + "Easy cardio — recovery after heavy lift";
    }
  }

  return days;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function generateHybridWeek(input: HybridProgramInput): WeeklyHybridPlan {
  const sp = buildSportProfile(input);
  const liftDays = Math.min(input.trainingDays, 5);
  const cardioDays = getCardioFrequency(input, sp);

  let days: DayPlan[];
  let programType: string;
  let description: string;

  if (sp.isTriathlete) {
    days = buildTriathletePlan(input, sp, liftDays, cardioDays);
    programType = "triathlete";
    description = sp.inTaper
      ? "Taper week — reducing volume ahead of race"
      : "Triathlon hybrid: swim, bike, run + strength";
  } else if (sp.isRunner) {
    days = buildRunnerPlan(input, sp, liftDays, cardioDays);
    programType = "runner";
    description = sp.raceApproaching
      ? "Race-specific run build + strength support"
      : "Running hybrid: aerobic base + speed work + strength";
  } else if (sp.isSwimmer) {
    days = buildSwimmerPlan(input, sp, liftDays, cardioDays);
    programType = "swimmer";
    description = "Swimming hybrid: technique + strength + endurance";
  } else if (sp.isCyclist) {
    days = buildCyclistPlan(input, sp, liftDays, cardioDays);
    programType = "cyclist";
    description = "Cycling hybrid: threshold + endurance + strength";
  } else if (input.goal === "endurance") {
    days = buildEndurancePlan(input, liftDays);
    programType = "endurance";
    description = "Endurance-focused hybrid: aerobic volume + strength maintenance";
  } else {
    days = buildGeneralPlan(input, liftDays, cardioDays);
    programType = "general";
    description = "General hybrid: strength-primary with cardio for conditioning";
  }

  // Apply programming constraints
  days = enforceConstraints(days);

  // Compute weekly stats
  const weeklyCardioMinutes = days.reduce((sum, d) => sum + (d.cardio?.duration || 0), 0);
  const weeklyLiftDays = days.filter(d => d.hasStrength).length;

  return {
    days,
    weeklyCardioMinutes,
    weeklyLiftDays,
    programType,
    description,
  };
}

// ─── Helper: Get Today's Cardio from Weekly Plan ──────────────────────────────
// Maps JS getDay() (0=Sun) to our Mon-based index

export function getTodayCardioFromPlan(plan: WeeklyHybridPlan): CardioAssignment | null {
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon … 6=Sat
  const monBasedIdx = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon … 6=Sun
  const dayPlan = plan.days.find(d => d.dayIndex === monBasedIdx);
  return dayPlan?.cardio || null;
}

// ─── Helper: Format Week Summary for Coach Prompt ─────────────────────────────

export function formatHybridWeekForCoach(plan: WeeklyHybridPlan): string {
  const lines = plan.days.map(d => {
    const parts: string[] = [];
    if (d.hasStrength) parts.push(`Lift (${d.strengthLabel})`);
    if (d.cardio) parts.push(`${d.cardio.title} [${d.cardio.intensity}]`);
    if (d.isRest && parts.length === 0) parts.push("Rest");
    return `${d.day}: ${parts.join(" + ")}`;
  });

  return [
    `Program: ${plan.description}`,
    `Weekly cardio: ${plan.weeklyCardioMinutes} min | Lift days: ${plan.weeklyLiftDays}`,
    "",
    ...lines,
  ].join("\n");
}
