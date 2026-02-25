import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── ExerciseDB API helpers ─────────────────────────────────────────────────

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || ''
const BASE_URL = 'https://exercisedb.p.rapidapi.com'
const headers = {
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
}

interface ExerciseDBItem {
  id: string
  name: string
  bodyPart: string
  equipment: string
  gifUrl: string
  target: string
  secondaryMuscles: string[]
  instructions: string[]
}

// ─── Mapping helpers ────────────────────────────────────────────────────────

function bodyPartToCategory(bodyPart: string): string {
  const map: Record<string, string> = {
    chest: 'Push',
    back: 'Pull',
    shoulders: 'Push',
    'upper arms': 'Arms',
    'lower arms': 'Arms',
    'upper legs': 'Legs',
    'lower legs': 'Legs',
    waist: 'Core',
    cardio: 'Cardio',
    neck: 'Other',
  }
  return map[bodyPart.toLowerCase()] || 'Other'
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─── API seeding ────────────────────────────────────────────────────────────

async function seedFromApi() {
  console.log('Fetching exercises from ExerciseDB API...')

  let offset = 0
  const batchSize = 100
  let totalSeeded = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.log(`  Fetching batch at offset ${offset}...`)

    const res = await fetch(
      `${BASE_URL}/exercises?limit=${batchSize}&offset=${offset}`,
      { headers }
    )

    if (!res.ok) {
      console.error(`  API error: ${res.status} ${res.statusText}`)
      break
    }

    const exercises: ExerciseDBItem[] = await res.json()
    if (!exercises.length) break

    for (const ex of exercises) {
      const slug = toSlug(ex.name)
      const category = bodyPartToCategory(ex.bodyPart)
      const instructionsStr = ex.instructions.join('. ')

      try {
        await prisma.exercise.upsert({
          where: { slug },
          update: {
            name: ex.name,
            gifUrl: ex.gifUrl,
            category,
            muscleGroups: JSON.stringify([ex.target]),
            secondaryMuscles: JSON.stringify(ex.secondaryMuscles),
            equipment: JSON.stringify([ex.equipment]),
            instructions: instructionsStr,
            externalId: ex.id,
            source: 'exercisedb',
            formTips: JSON.stringify([]),
            commonMistakes: JSON.stringify([]),
            coachingCues: JSON.stringify([]),
            alternatives: JSON.stringify([]),
            avoidIfInjury: JSON.stringify([]),
          },
          create: {
            name: ex.name,
            slug,
            gifUrl: ex.gifUrl,
            category,
            muscleGroups: JSON.stringify([ex.target]),
            secondaryMuscles: JSON.stringify(ex.secondaryMuscles),
            equipment: JSON.stringify([ex.equipment]),
            instructions: instructionsStr,
            skillLevel: 'beginner',
            externalId: ex.id,
            source: 'exercisedb',
            formTips: JSON.stringify([]),
            commonMistakes: JSON.stringify([]),
            coachingCues: JSON.stringify([]),
            alternatives: JSON.stringify([]),
            avoidIfInjury: JSON.stringify([]),
          },
        })
        totalSeeded++
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        // Skip duplicates from name uniqueness constraint
        if (message.includes('Unique constraint')) {
          console.log(`  Skipping duplicate: ${ex.name}`)
        } else {
          console.error(`  Error upserting "${ex.name}":`, message)
        }
      }
    }

    console.log(`  Batch done. Total seeded so far: ${totalSeeded}`)

    if (exercises.length < batchSize) break
    offset += batchSize

    // Brief pause to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500))
  }

  return totalSeeded
}

// ─── Built-in exercises (no API key fallback) ───────────────────────────────

interface BuiltInExercise {
  name: string
  slug: string
  category: string
  muscleGroups: string[]
  secondaryMuscles: string[]
  equipment: string[]
  movementPattern: string
  skillLevel: string
  instructions: string
  formTips: string[]
  commonMistakes: string[]
  coachingCues: string[]
  alternatives: string[]
  avoidIfInjury: string[]
}

const BUILT_IN_EXERCISES: BuiltInExercise[] = [
  {
    name: 'Barbell Bench Press',
    slug: 'barbell-bench-press',
    category: 'Push',
    muscleGroups: ['chest'],
    secondaryMuscles: ['triceps', 'anterior deltoid'],
    equipment: ['barbell', 'bench'],
    movementPattern: 'push',
    skillLevel: 'intermediate',
    instructions:
      'Lie flat on the bench with feet on the floor. Grip the barbell slightly wider than shoulder-width. Unrack the bar and lower it to mid-chest with control. Press the bar back up to lockout.',
    formTips: [
      'Retract your shoulder blades and arch your upper back slightly',
      'Keep your feet flat on the floor for stability',
      'Lower the bar to nipple line or just below',
      'Drive through your legs to help press the weight',
    ],
    commonMistakes: [
      'Flaring elbows out to 90 degrees',
      'Bouncing the bar off the chest',
      'Lifting hips off the bench',
      'Uneven grip width',
    ],
    coachingCues: [
      'Squeeze shoulder blades together',
      'Break the bar apart as you press',
      'Control the descent for a 2-count',
    ],
    alternatives: ['Dumbbell Bench Press', 'Push-Up', 'Machine Chest Press'],
    avoidIfInjury: ['shoulder impingement', 'rotator cuff tear', 'pec strain'],
  },
  {
    name: 'Back Squat',
    slug: 'back-squat',
    category: 'Legs',
    muscleGroups: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'erector spinae', 'core'],
    equipment: ['barbell', 'squat rack'],
    movementPattern: 'squat',
    skillLevel: 'intermediate',
    instructions:
      'Position the barbell on your upper traps. Unrack and step back. Brace your core and squat down until thighs are at least parallel to the floor. Drive through your whole foot to stand back up.',
    formTips: [
      'Keep your chest up and eyes forward',
      'Push knees out over your toes',
      'Maintain a neutral spine throughout',
      'Brace your core before descending',
    ],
    commonMistakes: [
      'Knees caving inward',
      'Rounding the lower back',
      'Rising on the toes',
      'Not hitting parallel depth',
    ],
    coachingCues: [
      'Spread the floor with your feet',
      'Sit back and down as if into a chair',
      'Big breath and brace before each rep',
    ],
    alternatives: ['Front Squat', 'Goblet Squat', 'Leg Press'],
    avoidIfInjury: ['knee ligament tear', 'lower back herniation', 'hip impingement'],
  },
  {
    name: 'Conventional Deadlift',
    slug: 'conventional-deadlift',
    category: 'Pull',
    muscleGroups: ['hamstrings', 'glutes', 'erector spinae'],
    secondaryMuscles: ['quadriceps', 'forearms', 'traps', 'core'],
    equipment: ['barbell'],
    movementPattern: 'hinge',
    skillLevel: 'intermediate',
    instructions:
      'Stand with feet hip-width apart, bar over mid-foot. Hinge at the hips and grip the bar just outside your legs. Brace core, drive through feet, and lift the bar by extending hips and knees simultaneously. Lock out at the top.',
    formTips: [
      'Keep the bar close to your body throughout the lift',
      'Engage your lats by pulling your shoulders back and down',
      'Push the floor away rather than pulling the bar up',
      'Lock out by squeezing your glutes at the top',
    ],
    commonMistakes: [
      'Rounding the lower back',
      'Starting with hips too high',
      'Letting the bar drift forward',
      'Jerking the bar off the floor',
    ],
    coachingCues: [
      'Take the slack out of the bar before pulling',
      'Push the ground away from you',
      'Chest up, hips back',
    ],
    alternatives: ['Sumo Deadlift', 'Trap Bar Deadlift', 'Romanian Deadlift'],
    avoidIfInjury: ['lower back herniation', 'hamstring tear', 'hip impingement'],
  },
  {
    name: 'Pull-Up',
    slug: 'pull-up',
    category: 'Pull',
    muscleGroups: ['latissimus dorsi'],
    secondaryMuscles: ['biceps', 'rear deltoid', 'forearms', 'rhomboids'],
    equipment: ['pull-up bar'],
    movementPattern: 'pull',
    skillLevel: 'intermediate',
    instructions:
      'Hang from the bar with an overhand grip slightly wider than shoulder-width. Pull yourself up until your chin is over the bar. Lower yourself with control back to a dead hang.',
    formTips: [
      'Initiate the pull by depressing and retracting your scapulae',
      'Pull your elbows down and back',
      'Avoid swinging or kipping',
      'Full range of motion: dead hang to chin over bar',
    ],
    commonMistakes: [
      'Using momentum to swing up',
      'Partial range of motion',
      'Shrugging shoulders during the pull',
      'Not fully extending at the bottom',
    ],
    coachingCues: [
      'Drive your elbows to your hips',
      'Squeeze your shoulder blades together at the top',
      'Control the descent on every rep',
    ],
    alternatives: ['Lat Pulldown', 'Assisted Pull-Up', 'Inverted Row'],
    avoidIfInjury: ['shoulder impingement', 'elbow tendinitis', 'rotator cuff tear'],
  },
  {
    name: 'Overhead Press',
    slug: 'overhead-press',
    category: 'Push',
    muscleGroups: ['anterior deltoid', 'lateral deltoid'],
    secondaryMuscles: ['triceps', 'upper chest', 'traps', 'core'],
    equipment: ['barbell'],
    movementPattern: 'push',
    skillLevel: 'intermediate',
    instructions:
      'Unrack the barbell at shoulder height with a grip just outside shoulder-width. Brace your core and press the bar overhead until arms are fully locked out. Lower with control back to shoulders.',
    formTips: [
      'Keep your ribs down and core tight',
      'Move your head back slightly as the bar passes your face',
      'Lock out directly over your midfoot',
      'Squeeze your glutes for stability',
    ],
    commonMistakes: [
      'Excessive lower back arching',
      'Pressing the bar forward instead of straight up',
      'Flaring the elbows too wide',
      'Using leg drive unintentionally',
    ],
    coachingCues: [
      'Stack the bar over your wrists and elbows',
      'Push your head through at the top',
      'Brace like someone is going to punch you',
    ],
    alternatives: ['Dumbbell Shoulder Press', 'Arnold Press', 'Landmine Press'],
    avoidIfInjury: ['shoulder impingement', 'rotator cuff tear', 'neck strain'],
  },
  {
    name: 'Romanian Deadlift',
    slug: 'romanian-deadlift',
    category: 'Pull',
    muscleGroups: ['hamstrings', 'glutes'],
    secondaryMuscles: ['erector spinae', 'forearms', 'core'],
    equipment: ['barbell'],
    movementPattern: 'hinge',
    skillLevel: 'intermediate',
    instructions:
      'Hold a barbell at hip height with an overhand grip. With a slight bend in your knees, hinge at the hips and lower the bar along your legs until you feel a stretch in your hamstrings. Drive your hips forward to return to standing.',
    formTips: [
      'Keep the bar close to your legs throughout the movement',
      'Maintain a neutral spine; do not round your back',
      'Feel the stretch in your hamstrings before reversing',
      'Squeeze your glutes at lockout',
    ],
    commonMistakes: [
      'Rounding the lower back',
      'Bending the knees too much (turning it into a squat)',
      'Letting the bar drift away from the body',
      'Not hinging enough at the hips',
    ],
    coachingCues: [
      'Push your hips straight back',
      'Imagine closing a car door with your hips',
      'Soft knees, tight back',
    ],
    alternatives: ['Stiff-Leg Deadlift', 'Single-Leg RDL', 'Good Morning'],
    avoidIfInjury: ['lower back herniation', 'hamstring tear'],
  },
  {
    name: 'Barbell Row',
    slug: 'barbell-row',
    category: 'Pull',
    muscleGroups: ['latissimus dorsi', 'rhomboids'],
    secondaryMuscles: ['biceps', 'rear deltoid', 'traps', 'erector spinae'],
    equipment: ['barbell'],
    movementPattern: 'pull',
    skillLevel: 'intermediate',
    instructions:
      'Hinge at the hips with knees slightly bent, torso at roughly 45 degrees. Grip the barbell just outside your knees. Pull the bar to your lower chest or upper abdomen. Lower with control.',
    formTips: [
      'Keep your back flat and core braced',
      'Pull your elbows past your torso',
      'Squeeze your shoulder blades at the top',
      'Avoid using momentum or jerking the weight',
    ],
    commonMistakes: [
      'Rounding the upper back',
      'Standing too upright',
      'Using excessive body English',
      'Pulling to the wrong part of the torso',
    ],
    coachingCues: [
      'Row the bar to your belly button',
      'Lead with your elbows',
      'Think about squeezing a pencil between your shoulder blades',
    ],
    alternatives: ['Dumbbell Row', 'Cable Row', 'T-Bar Row'],
    avoidIfInjury: ['lower back herniation', 'bicep tendinitis'],
  },
  {
    name: 'Dumbbell Bench Press',
    slug: 'dumbbell-bench-press',
    category: 'Push',
    muscleGroups: ['chest'],
    secondaryMuscles: ['triceps', 'anterior deltoid'],
    equipment: ['dumbbells', 'bench'],
    movementPattern: 'push',
    skillLevel: 'beginner',
    instructions:
      'Sit on a bench with dumbbells on your thighs. Kick them up as you lie back. Press the dumbbells up until arms are extended, palms facing forward. Lower with control to chest level.',
    formTips: [
      'Retract your shoulder blades',
      'Keep your wrists stacked over your elbows',
      'Lower the dumbbells to the sides of your chest',
      'Press in a slight arc, bringing the dumbbells together at the top',
    ],
    commonMistakes: [
      'Flaring elbows at 90 degrees',
      'Not controlling the descent',
      'Uneven pressing',
      'Arching the back excessively',
    ],
    coachingCues: [
      'Squeeze your chest at the top',
      'Control the weight on the way down',
      'Keep feet flat on the floor',
    ],
    alternatives: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Cable Fly'],
    avoidIfInjury: ['shoulder impingement', 'rotator cuff tear'],
  },
  {
    name: 'Dip',
    slug: 'dip',
    category: 'Push',
    muscleGroups: ['chest', 'triceps'],
    secondaryMuscles: ['anterior deltoid'],
    equipment: ['dip bars'],
    movementPattern: 'push',
    skillLevel: 'intermediate',
    instructions:
      'Grip the dip bars and support your body with arms extended. Lean slightly forward. Lower yourself until your upper arms are parallel to the floor. Press back up to full lockout.',
    formTips: [
      'Lean forward slightly to target chest more',
      'Stay upright to target triceps more',
      'Do not drop below 90 degrees if you have shoulder issues',
      'Keep your core tight to avoid swinging',
    ],
    commonMistakes: [
      'Going too deep without mobility',
      'Flaring elbows outward excessively',
      'Using momentum to bounce out of the bottom',
      'Shrugging shoulders',
    ],
    coachingCues: [
      'Control the descent',
      'Elbows back, not out',
      'Drive through your palms to lockout',
    ],
    alternatives: ['Close-Grip Bench Press', 'Tricep Pushdown', 'Push-Up'],
    avoidIfInjury: ['shoulder impingement', 'sternoclavicular joint issues'],
  },
  {
    name: 'Face Pull',
    slug: 'face-pull',
    category: 'Pull',
    muscleGroups: ['rear deltoid', 'rhomboids'],
    secondaryMuscles: ['traps', 'rotator cuff', 'biceps'],
    equipment: ['cable machine', 'rope attachment'],
    movementPattern: 'pull',
    skillLevel: 'beginner',
    instructions:
      'Set a cable at upper chest to face height with a rope attachment. Grip each end of the rope with palms facing inward. Pull the rope toward your face, separating the ends as you pull. Squeeze your rear delts and return with control.',
    formTips: [
      'Pull to the sides of your face, not to your chest',
      'Externally rotate your hands at the peak contraction',
      'Keep your elbows high throughout the movement',
      'Use a moderate weight and focus on the squeeze',
    ],
    commonMistakes: [
      'Using too much weight and swinging',
      'Pulling too low (toward the chest)',
      'Not separating the rope ends enough',
      'Leaning back excessively',
    ],
    coachingCues: [
      'Pull the rope apart as you pull toward your face',
      'Finish with a double bicep pose',
      'Squeeze your shoulder blades together',
    ],
    alternatives: ['Band Pull-Apart', 'Reverse Fly', 'Rear Delt Fly Machine'],
    avoidIfInjury: ['shoulder impingement', 'neck strain'],
  },
]

async function seedBuiltInExercises() {
  console.log('No RAPIDAPI_KEY found. Seeding built-in exercises...')
  let count = 0

  for (const ex of BUILT_IN_EXERCISES) {
    try {
      await prisma.exercise.upsert({
        where: { slug: ex.slug },
        update: {
          name: ex.name,
          category: ex.category,
          muscleGroups: JSON.stringify(ex.muscleGroups),
          secondaryMuscles: JSON.stringify(ex.secondaryMuscles),
          equipment: JSON.stringify(ex.equipment),
          movementPattern: ex.movementPattern,
          skillLevel: ex.skillLevel,
          instructions: ex.instructions,
          formTips: JSON.stringify(ex.formTips),
          commonMistakes: JSON.stringify(ex.commonMistakes),
          coachingCues: JSON.stringify(ex.coachingCues),
          alternatives: JSON.stringify(ex.alternatives),
          avoidIfInjury: JSON.stringify(ex.avoidIfInjury),
          source: 'custom',
        },
        create: {
          name: ex.name,
          slug: ex.slug,
          category: ex.category,
          muscleGroups: JSON.stringify(ex.muscleGroups),
          secondaryMuscles: JSON.stringify(ex.secondaryMuscles),
          equipment: JSON.stringify(ex.equipment),
          movementPattern: ex.movementPattern,
          skillLevel: ex.skillLevel,
          instructions: ex.instructions,
          formTips: JSON.stringify(ex.formTips),
          commonMistakes: JSON.stringify(ex.commonMistakes),
          coachingCues: JSON.stringify(ex.coachingCues),
          alternatives: JSON.stringify(ex.alternatives),
          avoidIfInjury: JSON.stringify(ex.avoidIfInjury),
          source: 'custom',
        },
      })
      count++
      console.log(`  Seeded: ${ex.name}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  Error seeding "${ex.name}":`, message)
    }
  }

  return count
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Exercise Seed Script ===')
  console.log()

  let total: number

  if (RAPIDAPI_KEY) {
    total = await seedFromApi()
  } else {
    total = await seedBuiltInExercises()
  }

  console.log()
  console.log(`Done! Seeded ${total} exercises.`)
}

main()
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
