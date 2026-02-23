// ─── Cardio Activity Templates ────────────────────────────────────────────────
// Structured cardio workout library for hybrid athlete programming

export interface CardioInterval {
  label: string;
  work: string;  // e.g. "400m" or "1 min"
  rest: string;  // e.g. "90 sec" or "2 min"
  reps: number;
}

export interface CardioTemplate {
  id: string;
  type: "run" | "swim" | "bike" | "row" | "sprint" | "hiit";
  title: string;
  description: string;
  duration: number;      // minutes
  intensity: "easy" | "moderate" | "hard" | "max";
  intervals?: CardioInterval[];
  tags?: string[];
}

// ─── Running ──────────────────────────────────────────────────────────────────

const RUNNING: CardioTemplate[] = [
  {
    id: "run-easy",
    type: "run",
    title: "Easy Run",
    description:
      "Run at a fully conversational pace — you should be able to speak in complete sentences without gasping. This builds your aerobic base, improves fat oxidation, and promotes recovery. Keep your heart rate in Zone 2 (roughly 60–70% of max HR). Focus on relaxed form: shoulders back, arms at 90°, light footstrike.",
    duration: 30,
    intensity: "easy",
    tags: ["aerobic", "recovery", "base-building"],
  },
  {
    id: "run-tempo",
    type: "run",
    title: "Tempo Run",
    description:
      "Run at a 'comfortably hard' pace — you can speak a few words but not full sentences. This targets your lactate threshold, the pace above which lactic acid accumulates faster than it clears. Warm up 5 min easy, run at tempo effort for the prescribed time, cool down 5 min easy. Perceived effort: 7–8/10.",
    duration: 35,
    intensity: "hard",
    tags: ["threshold", "lactate", "race-prep"],
  },
  {
    id: "run-400-intervals",
    type: "sprint",
    title: "400m Sprint Intervals",
    description:
      "Classic track workout that builds speed and VO2max. Warm up 10 min easy jog. Then run 8 × 400m (one lap on a standard track) at 5K race effort — fast but controlled, not a full sprint. Walk or jog 90 seconds between each interval. Cool down 10 min easy. Focus on maintaining consistent splits across all 8 reps.",
    duration: 45,
    intensity: "hard",
    intervals: [
      { label: "Warm-up", work: "10 min", rest: "0", reps: 1 },
      { label: "400m rep", work: "400m fast", rest: "90 sec walk/jog", reps: 8 },
      { label: "Cool-down", work: "10 min", rest: "0", reps: 1 },
    ],
    tags: ["speed", "vo2max", "track"],
  },
  {
    id: "run-800-repeats",
    type: "run",
    title: "800m Repeats",
    description:
      "Longer intervals for building race-specific endurance and top-end speed. Warm up 10 min easy. Run 5 × 800m at 10K race pace — hard effort but not all-out. Take 2 minutes easy jogging recovery between each. Cool down 10 min easy. Aim to hit the same pace on reps 4 and 5 as on rep 1.",
    duration: 55,
    intensity: "hard",
    intervals: [
      { label: "Warm-up", work: "10 min", rest: "0", reps: 1 },
      { label: "800m rep", work: "800m at 10K pace", rest: "2 min easy jog", reps: 5 },
      { label: "Cool-down", work: "10 min", rest: "0", reps: 1 },
    ],
    tags: ["endurance", "vo2max", "track"],
  },
  {
    id: "run-long",
    type: "run",
    title: "Long Run",
    description:
      "The cornerstone of endurance training. Run at an easy, conversational pace for the full duration. This builds aerobic engine capacity, trains fat burning, and prepares your legs for higher mileage. Never run your long run faster than 60–90 seconds per mile slower than your goal race pace. Fueling: start fueling with gels or chews after 60 minutes.",
    duration: 75,
    intensity: "easy",
    tags: ["endurance", "aerobic", "base-building", "long-run"],
  },
  {
    id: "run-fartlek",
    type: "run",
    title: "Fartlek Run",
    description:
      "Swedish for 'speed play' — unstructured intervals mixed into an easy run. Run easy for the first 5 min, then introduce surges whenever you feel like it: pick up a landmark (lamppost, tree) and sprint to it, then recover until you feel ready again. Mix short 15–30 second surges with longer 1–2 minute pickups. Total run includes 20–25 min of random intensity changes.",
    duration: 40,
    intensity: "moderate",
    tags: ["speed", "fun", "unstructured"],
  },
];

// ─── Swimming ─────────────────────────────────────────────────────────────────

const SWIMMING: CardioTemplate[] = [
  {
    id: "swim-drills",
    type: "swim",
    title: "Freestyle Technique Drills",
    description:
      "Warm up 200m easy freestyle. Then work through three drill sets: (1) Catch-up drill — keep one hand extended forward while the other completes the full stroke cycle, pause at extension. 4 × 50m. (2) Fingertip drag — during recovery, drag your fingertips lightly along the water surface to reinforce high-elbow recovery. 4 × 50m. (3) Bilateral breathing — breathe every 3 strokes instead of every 2, building lung capacity and symmetry. 4 × 50m. Cool down 200m easy.",
    duration: 40,
    intensity: "easy",
    intervals: [
      { label: "Warm-up", work: "200m easy", rest: "30 sec", reps: 1 },
      { label: "Catch-up drill", work: "50m", rest: "15 sec", reps: 4 },
      { label: "Fingertip drag", work: "50m", rest: "15 sec", reps: 4 },
      { label: "Bilateral breathing", work: "50m", rest: "15 sec", reps: 4 },
      { label: "Cool-down", work: "200m easy", rest: "0", reps: 1 },
    ],
    tags: ["technique", "drills", "swim"],
  },
  {
    id: "swim-pull",
    type: "swim",
    title: "Pull Set",
    description:
      "Use a pull buoy between your thighs to eliminate leg kick and isolate upper-body pulling mechanics. This builds stroke strength and teaches proper catch and pull-through technique. Warm up 200m. Main set: 8 × 100m pull with pull buoy, 20 seconds rest. Focus on high elbow catch, full extension through hips, and strong pull-through past thigh. Cool down 200m easy.",
    duration: 45,
    intensity: "moderate",
    intervals: [
      { label: "Warm-up", work: "200m easy", rest: "30 sec", reps: 1 },
      { label: "Pull set", work: "100m with pull buoy", rest: "20 sec", reps: 8 },
      { label: "Cool-down", work: "200m easy", rest: "0", reps: 1 },
    ],
    tags: ["strength", "upper-body", "pull-buoy"],
  },
  {
    id: "swim-kick",
    type: "swim",
    title: "Kick Set",
    description:
      "Use a kickboard held at arm's length to isolate the leg kick and build leg strength and ankle flexibility. Kick from the hip, not the knee — keep your legs relatively straight. Warm up 200m. Main set: 8 × 50m kick with kickboard, 15 seconds rest. Focus on minimal knee bend, loose ankles, and a steady flutter kick. Cool down 200m.",
    duration: 35,
    intensity: "moderate",
    intervals: [
      { label: "Warm-up", work: "200m easy", rest: "30 sec", reps: 1 },
      { label: "Kick set", work: "50m with kickboard", rest: "15 sec", reps: 8 },
      { label: "Cool-down", work: "200m easy", rest: "0", reps: 1 },
    ],
    tags: ["legs", "kick", "kickboard"],
  },
  {
    id: "swim-sprints",
    type: "sprint",
    title: "Sprint Set",
    description:
      "Max-effort short sprints to build top-end swim speed and power. Warm up 300m easy with drills. Main set: 4 × 50m at absolute max effort — push off the wall and go all out for 50m. Full recovery between reps: rest at least 2 minutes. Your 50m splits should be consistent across all 4 reps. Cool down 200m easy backstroke or freestyle.",
    duration: 30,
    intensity: "max",
    intervals: [
      { label: "Warm-up", work: "300m easy + drills", rest: "1 min", reps: 1 },
      { label: "50m sprint", work: "50m max effort", rest: "2 min", reps: 4 },
      { label: "Cool-down", work: "200m easy", rest: "0", reps: 1 },
    ],
    tags: ["speed", "power", "max-effort"],
  },
  {
    id: "swim-endurance",
    type: "swim",
    title: "Endurance Swim",
    description:
      "Continuous distance swim at a steady, sustainable pace. No stopping except to turn at the wall. This builds aerobic swim fitness and race-simulation endurance. Warm up 200m easy. Main set: 600m continuous at moderate effort, breathing every 3–4 strokes. Cool down 200m easy. If this feels too easy, add 200m to the main set next time.",
    duration: 40,
    intensity: "moderate",
    tags: ["aerobic", "continuous", "endurance"],
  },
  {
    id: "swim-open-water-sim",
    type: "swim",
    title: "Open Water Simulation",
    description:
      "Simulate open water race conditions in the pool. Practice sighting: lift your eyes forward every 6–8 strokes (just enough to see over the water) then rotate to breathe. Practice drafting: swim directly behind a lane partner 1 body length away — you'll feel a draft effect. Practice surging: every 5th length, sprint hard for 15 strokes to simulate a race surge. Warm up 200m, main set 600m with these skills embedded, cool down 200m.",
    duration: 45,
    intensity: "moderate",
    tags: ["race-prep", "open-water", "triathlon"],
  },
];

// ─── Cycling / Bike ───────────────────────────────────────────────────────────

const CYCLING: CardioTemplate[] = [
  {
    id: "bike-endurance",
    type: "bike",
    title: "Zone 2 Endurance Ride",
    description:
      "Steady endurance ride at Zone 2 intensity — you can hold a conversation but feel like you're working. This is the foundation of aerobic fitness and fat adaptation. If using a power meter, target 56–75% of FTP. If using RPE, aim for 5–6/10. Avoid the temptation to go harder — the goal is volume at low intensity, not intensity itself.",
    duration: 60,
    intensity: "easy",
    tags: ["aerobic", "zone2", "base-building"],
  },
  {
    id: "bike-threshold",
    type: "bike",
    title: "Threshold Intervals",
    description:
      "Warm up 10 min easy spin. Main set: 4 × 8 minutes at threshold power/effort — this should feel 'hard but controlled' at about 8/10 RPE. If using power, target 90–100% of FTP. Take 4 minutes easy pedaling between each interval. Cool down 10 minutes easy. Threshold work directly raises your sustainable race pace.",
    duration: 60,
    intensity: "hard",
    intervals: [
      { label: "Warm-up", work: "10 min easy", rest: "0", reps: 1 },
      { label: "Threshold interval", work: "8 min at threshold", rest: "4 min easy", reps: 4 },
      { label: "Cool-down", work: "10 min easy", rest: "0", reps: 1 },
    ],
    tags: ["threshold", "ftp", "intervals"],
  },
  {
    id: "bike-recovery",
    type: "bike",
    title: "Recovery Spin",
    description:
      "Very easy pedaling at low resistance to promote active recovery. Spin at 85–95 RPM to flush metabolic waste from your legs without adding training stress. This should feel effortless — if you're breathing hard, you're going too hard. Use this on days after heavy lifting or long runs. Keep your heart rate below 120 bpm.",
    duration: 30,
    intensity: "easy",
    tags: ["recovery", "active-recovery", "easy"],
  },
];

// ─── Rowing ───────────────────────────────────────────────────────────────────

const ROWING: CardioTemplate[] = [
  {
    id: "row-500-repeats",
    type: "row",
    title: "500m Repeats",
    description:
      "Warm up 1000m easy rowing at 20 strokes/min. Main set: 5 × 500m at hard effort (about 85–90% of max effort), taking 2 minutes of easy rowing between each. Aim for consistent split times — your last rep should be within 5 seconds of your first. Maintain proper form throughout: drive with legs first, then hips, then arms. Cool down 1000m easy.",
    duration: 35,
    intensity: "hard",
    intervals: [
      { label: "Warm-up", work: "1000m easy", rest: "1 min", reps: 1 },
      { label: "500m rep", work: "500m hard", rest: "2 min easy row", reps: 5 },
      { label: "Cool-down", work: "1000m easy", rest: "0", reps: 1 },
    ],
    tags: ["intervals", "speed", "rowing"],
  },
  {
    id: "row-steady-state",
    type: "row",
    title: "20-Minute Steady State",
    description:
      "Continuous rowing at a steady moderate pace. Target 22–24 strokes per minute. This should feel like a 6/10 effort — you can speak a short sentence but are clearly working. Focus on the drive sequence: legs → back → arms, and the recovery sequence: arms → back → legs. Track your 500m split and aim to keep it consistent throughout the 20 minutes.",
    duration: 25,
    intensity: "moderate",
    tags: ["aerobic", "steady-state", "technique"],
  },
  {
    id: "row-power-intervals",
    type: "row",
    title: "Power Intervals",
    description:
      "Short, explosive rowing intervals to build raw power output. Warm up 5 min easy. Main set: 10 × 1 minute all-out effort at max power (rate: 28–32 strokes/min), 1 minute complete rest between each. Explode off the catch on every stroke — these should feel like sprints. Record your best 500m split from each interval and try to beat it each session.",
    duration: 30,
    intensity: "max",
    intervals: [
      { label: "Warm-up", work: "5 min easy", rest: "0", reps: 1 },
      { label: "Power interval", work: "1 min max effort", rest: "1 min rest", reps: 10 },
      { label: "Cool-down", work: "5 min easy", rest: "0", reps: 1 },
    ],
    tags: ["power", "sprint", "anaerobic"],
  },
];

// ─── HIIT / General ───────────────────────────────────────────────────────────

const HIIT: CardioTemplate[] = [
  {
    id: "hiit-assault-bike",
    type: "hiit",
    title: "Assault Bike Intervals",
    description:
      "Warm up 3 min easy. Main set: 10 rounds of 20 seconds all-out effort on the assault bike, 40 seconds easy pedaling. Sprint as hard as physically possible during each 20-second effort — arms and legs driving simultaneously. The assault bike uniquely taxes both upper and lower body, making it excellent for metabolic conditioning. Cool down 3 min easy. Total: ~17 min.",
    duration: 20,
    intensity: "max",
    intervals: [
      { label: "Warm-up", work: "3 min easy", rest: "0", reps: 1 },
      { label: "Sprint interval", work: "20 sec max effort", rest: "40 sec easy", reps: 10 },
      { label: "Cool-down", work: "3 min easy", rest: "0", reps: 1 },
    ],
    tags: ["hiit", "assault-bike", "metabolic"],
  },
  {
    id: "hiit-jump-rope-tabata",
    type: "hiit",
    title: "Jump Rope Tabata",
    description:
      "Classic Tabata protocol with a jump rope. Warm up 3 min of easy skipping. Then: 8 rounds of 20 seconds maximum-effort jump rope (as many jumps as possible), 10 seconds rest. That's 4 minutes of pure Tabata. Rest 1 minute, then repeat the 4-minute Tabata 2 more times for 3 total Tabata blocks. Cool down 3 min easy skipping. Focus on wrist rotation — not arm swinging.",
    duration: 20,
    intensity: "max",
    intervals: [
      { label: "Warm-up", work: "3 min easy skip", rest: "0", reps: 1 },
      { label: "Tabata block (8 × 20/10)", work: "20 sec max jumps", rest: "10 sec", reps: 8 },
      { label: "Rest between blocks", work: "1 min rest", rest: "0", reps: 2 },
      { label: "Repeat Tabata block", work: "20 sec max jumps", rest: "10 sec", reps: 8 },
      { label: "Cool-down", work: "3 min easy skip", rest: "0", reps: 1 },
    ],
    tags: ["tabata", "jump-rope", "hiit"],
  },
  {
    id: "hiit-sled",
    type: "hiit",
    title: "Sled Push/Pull",
    description:
      "If a sled is available, this is one of the most effective total-body conditioning tools. Load the sled with a moderate weight. Push: drive the sled 20m down the turf with powerful leg drive, leaning into the handles. Rest 90 seconds. Pull: attach a rope or handle and backpedal to pull the sled toward you for 20m. Rest 90 seconds. Perform 6 rounds of push/pull alternating. The sled has no eccentric load — great on heavy leg days.",
    duration: 25,
    intensity: "hard",
    intervals: [
      { label: "Sled push 20m", work: "20m push", rest: "90 sec", reps: 6 },
      { label: "Sled pull 20m", work: "20m pull/backpedal", rest: "90 sec", reps: 6 },
    ],
    tags: ["sled", "conditioning", "functional"],
  },
];

// ─── Combined Library ─────────────────────────────────────────────────────────

export const CARDIO_TEMPLATES: CardioTemplate[] = [
  ...RUNNING,
  ...SWIMMING,
  ...CYCLING,
  ...ROWING,
  ...HIIT,
];

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

export function getTemplateById(id: string): CardioTemplate | undefined {
  return CARDIO_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByType(type: CardioTemplate["type"]): CardioTemplate[] {
  return CARDIO_TEMPLATES.filter(t => t.type === type);
}

export function getTemplatesByIntensity(intensity: CardioTemplate["intensity"]): CardioTemplate[] {
  return CARDIO_TEMPLATES.filter(t => t.intensity === intensity);
}

// ─── Type Icons ───────────────────────────────────────────────────────────────

export const CARDIO_TYPE_ICONS: Record<string, string> = {
  run: "🏃",
  swim: "🏊",
  bike: "🚴",
  row: "🚣",
  sprint: "⚡",
  hiit: "🔥",
};

export const INTENSITY_COLORS: Record<string, string> = {
  easy: "text-[#00C853] border-[#00C853]/30 bg-[#00C853]/10",
  moderate: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  hard: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  max: "text-red-400 border-red-400/30 bg-red-400/10",
};
