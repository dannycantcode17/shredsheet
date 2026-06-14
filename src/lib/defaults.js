// ============================================================
// CONSTANTS & LOOKUP TABLES
// Ported verbatim from the WORKER tab of the original Shredsheet.
// Cell references kept in comments so the maths is auditable.
// ============================================================

export const CONST = {
  BASE_MUSCLE_GAIN_PER_WEEK: 0.15, // WORKER!C91 (kg/week) -> 0.0214 kg/day
  KCAL_PER_KG_FAT: 7700,           // 1 kg fat
  KCAL_PER_KG_MUSCLE: 2800,        // surplus needed per kg lean mass
  VOLUME_BASE_SETS_WK: 60,         // WORKER!C96  baseline weekly sets
  AVG_REPS_PER_SET: 10,            // WORKER!C81
  NEWBIE_DECAY_FLAT_DAYS: 45,      // newbie bonus held flat for 45 days
  NEWBIE_DECAY_TAU: 50,            // then exp decay toward 1.0

  // Risk-penalty thresholds (WORKER C112-C120)
  NEWBIE_THRESHOLD: 1,
  BULKCUT_THRESHOLD: 0.85,
  PROTEIN_THRESHOLD: 0.75,
  VOLUME_THRESHOLD: 0.85,
  MOD_BASE: 1,
  PENALTY_MULTIPLIER: 1.5,
  ADJ_BASE: 1,
  MULT_ADJUST: 2,

  // Penalty floor by training experience (WORKER C122-C124, chosen by C16)
  PENALTY_CAP_NEWBIE: -0.1,
  PENALTY_CAP_INTERMEDIATE: -0.8,
  PENALTY_CAP_EXPERIENCED: -2.4,
}

// Newbie-gain factor by avg gym sessions/week over the last 6 months (WORKER B98:C105)
export const NEWBIE_BY_SESSIONS = { 0: 1.6, 1: 1.3, 2: 1.1, 3: 1.05, 4: 0.99, 5: 0.8, 6: 0.8, 7: 0.8 }

// Bulk/cut modifier by goal (WORKER B107:C110)
export const BULKCUT_BY_GOAL = { 'Bulk': 1.15, 'Lean Bulk': 1.05, 'Cut': 0.8, 'Aggressive Cut': 0.6 }

// Cardio MET by intensity (WORKER B54:C56)
export const CARDIO_MET = { Relaxed: 4.5, Moderate: 6, Intense: 8 }
// Weight-training calories (WORKER B61:C63 and B65:C67)
export const CAL_PER_REP = { Relaxed: 0.7, Moderate: 0.8, Intense: 0.9 }
export const CAL_PER_SET = { Relaxed: 3, Moderate: 4, Intense: 5 }

// Session cardio-modifier on weight training, by session volume score incl reps (WORKER B70:C78)
export const SESSION_VOLUME_MODIFIER = [
  { under: 50, mult: 1 }, { under: 100, mult: 1.05 }, { under: 150, mult: 1.1 },
  { under: 200, mult: 1.15 }, { under: 250, mult: 1.2 }, { under: 300, mult: 1.25 },
  { under: 350, mult: 1.3 }, { under: 400, mult: 1.35 }, { under: Infinity, mult: 1.4 },
]

export const GOALS = ['Bulk', 'Lean Bulk', 'Cut', 'Aggressive Cut']
export const INTENSITIES = ['Relaxed', 'Moderate', 'Intense']
export const EXPERIENCE = ['Beginner', 'Intermediate', 'Advanced']

// Default inputs (mirrors the sample profile in the original sheet)
export const DEFAULT_INPUTS = {
  startDate: new Date().toISOString().slice(0, 10),
  periodDays: 100,
  age: 28,
  sex: 'Male',
  heightCm: 183,
  startWeightKg: 90,
  experience: 'Advanced',
  sessionsLast6m: 1,
  goalWeightKg: 87,
  goal: 'Cut',
  cardioMinsPerWeek: 0,
  stepGoal: 10000,
  gymSessionsPerWeek: 4,
  weightIntensity: 'Moderate',
  cardioIntensity: 'Moderate',
  metabolismModifier: 1, // 1 = 100%
  muscleModifier: 1,
}

// A blank training day
export const blankDay = (name = '') => ({
  name,
  exercises: Array.from({ length: 10 }, () => ({ name: '', compound: false, sets: '', goalWeight: '', goalReps: '' })),
})

export const DEFAULT_PLAN = [
  {
    name: 'PUSH',
    exercises: [
      { name: 'Push-ups', compound: false, sets: 3, goalWeight: '', goalReps: '' },
      { name: 'Incline Dumbbell Press', compound: true, sets: 4, goalWeight: 40, goalReps: 8 },
      { name: 'Flat Dumbbell Press', compound: true, sets: 4, goalWeight: 42.5, goalReps: 8 },
      { name: 'Overhead Dumbbell Press', compound: true, sets: 4, goalWeight: 30, goalReps: 8 },
      { name: 'Side Lateral Raise', compound: false, sets: 3, goalWeight: '', goalReps: '' },
      { name: 'Cable Triceps Pushdown', compound: false, sets: 3, goalWeight: '', goalReps: '' },
      ...Array.from({ length: 4 }, () => ({ name: '', compound: false, sets: '', goalWeight: '', goalReps: '' })),
    ],
  },
  {
    name: 'PULL',
    exercises: [
      { name: 'Pull-ups', compound: true, sets: 3, goalWeight: '', goalReps: '' },
      { name: 'Chest Supported Row', compound: true, sets: 4, goalWeight: 60, goalReps: 8 },
      { name: 'One Arm Dumbbell Row', compound: true, sets: 3, goalWeight: 36, goalReps: 8 },
      { name: 'Face Pulls', compound: false, sets: 3, goalWeight: '', goalReps: '' },
      { name: 'Barbell Curl', compound: false, sets: 3, goalWeight: 40, goalReps: 8 },
      { name: 'Hammer Curl', compound: false, sets: 3, goalWeight: '', goalReps: '' },
      ...Array.from({ length: 4 }, () => ({ name: '', compound: false, sets: '', goalWeight: '', goalReps: '' })),
    ],
  },
  {
    name: 'LEGS',
    exercises: [
      { name: 'Bulgarian Split Squat', compound: true, sets: 4, goalWeight: 24, goalReps: 8 },
      { name: 'Walking Lunges', compound: true, sets: 3, goalWeight: '', goalReps: '' },
      { name: 'Leg Press', compound: true, sets: 4, goalWeight: 180, goalReps: 8 },
      { name: 'Leg Curl', compound: false, sets: 3, goalWeight: '', goalReps: '' },
      { name: 'Calf Raises', compound: false, sets: 4, goalWeight: '', goalReps: '' },
      { name: 'Glute Bridge', compound: true, sets: 3, goalWeight: '', goalReps: '' },
      ...Array.from({ length: 4 }, () => ({ name: '', compound: false, sets: '', goalWeight: '', goalReps: '' })),
    ],
  },
  blankDay(), blankDay(), blankDay(), blankDay(),
]

// ============================================================
// PLAN GENERATOR — builds a starter plan from onboarding inputs.
// Respects equipment choices, veto list, experience, and session
// count. Used at the end of the Configurator; users can refine.
// ============================================================

// [name, category, isCompound, equipmentTags[]]
const EX_DB = [
  // PUSH — compound
  ['Bench Press',             'push', true,  ['Barbell', 'Full gym']],
  ['Incline Bench Press',     'push', true,  ['Barbell', 'Full gym']],
  ['Overhead Press',          'push', true,  ['Barbell', 'Full gym']],
  ['Dumbbell Bench Press',    'push', true,  ['Dumbbells', 'Full gym']],
  ['Incline Dumbbell Press',  'push', true,  ['Dumbbells', 'Full gym']],
  ['Overhead Dumbbell Press', 'push', true,  ['Dumbbells', 'Full gym']],
  ['Chest Press Machine',     'push', true,  ['Machines & cables', 'Full gym']],
  ['Shoulder Press Machine',  'push', true,  ['Machines & cables', 'Full gym']],
  ['Push-up',                 'push', true,  ['Bodyweight only', 'Full gym']],
  ['Dip',                     'push', true,  ['Bodyweight only', 'Full gym']],
  ['Kettlebell Press',        'push', true,  ['Kettlebells']],
  ['Resistance Band Press',   'push', true,  ['Bands']],
  // PUSH — isolation
  ['Lateral Raise',           'push', false, ['Dumbbells', 'Machines & cables', 'Full gym']],
  ['Tricep Pushdown',         'push', false, ['Machines & cables', 'Full gym']],
  ['Cable Fly',               'push', false, ['Machines & cables', 'Full gym']],
  ['Overhead Tricep Ext.',    'push', false, ['Dumbbells', 'Full gym']],
  ['Skullcrusher',            'push', false, ['Barbell', 'Full gym']],
  ['Tricep Dip',              'push', false, ['Bodyweight only', 'Full gym']],
  ['Diamond Push-up',         'push', false, ['Bodyweight only']],
  ['Band Lateral Raise',      'push', false, ['Bands']],
  // PULL — compound
  ['Deadlift',                'pull', true,  ['Barbell', 'Full gym']],
  ['Barbell Row',             'pull', true,  ['Barbell', 'Full gym']],
  ['Romanian Deadlift',       'pull', true,  ['Barbell', 'Full gym']],
  ['Dumbbell Row',            'pull', true,  ['Dumbbells', 'Full gym']],
  ['Lat Pulldown',            'pull', true,  ['Machines & cables', 'Full gym']],
  ['Seated Cable Row',        'pull', true,  ['Machines & cables', 'Full gym']],
  ['Pull-up',                 'pull', true,  ['Bodyweight only', 'Full gym']],
  ['Chin-up',                 'pull', true,  ['Bodyweight only', 'Full gym']],
  ['Kettlebell Row',          'pull', true,  ['Kettlebells']],
  ['Band Row',                'pull', true,  ['Bands']],
  // PULL — isolation
  ['Barbell Curl',            'pull', false, ['Barbell', 'Full gym']],
  ['Dumbbell Curl',           'pull', false, ['Dumbbells', 'Full gym']],
  ['Hammer Curl',             'pull', false, ['Dumbbells', 'Full gym']],
  ['Face Pulls',              'pull', false, ['Machines & cables', 'Full gym']],
  ['Cable Curl',              'pull', false, ['Machines & cables', 'Full gym']],
  ['Rear Delt Fly',           'pull', false, ['Dumbbells', 'Full gym']],
  ['Band Curl',               'pull', false, ['Bands']],
  // LEGS — compound
  ['Back Squat',              'legs', true,  ['Barbell', 'Full gym']],
  ['Front Squat',             'legs', true,  ['Barbell', 'Full gym']],
  ['Dumbbell RDL',            'legs', true,  ['Dumbbells', 'Full gym']],
  ['Bulgarian Split Squat',   'legs', true,  ['Dumbbells', 'Bodyweight only', 'Full gym']],
  ['Walking Lunge',           'legs', true,  ['Dumbbells', 'Bodyweight only', 'Full gym']],
  ['Goblet Squat',            'legs', true,  ['Dumbbells', 'Kettlebells', 'Full gym']],
  ['Leg Press',               'legs', true,  ['Machines & cables', 'Full gym']],
  ['Nordic Curl',             'legs', true,  ['Bodyweight only', 'Full gym']],
  ['Step Up',                 'legs', true,  ['Bodyweight only']],
  ['Kettlebell Swing',        'legs', true,  ['Kettlebells']],
  // LEGS — isolation
  ['Leg Extension',           'legs', false, ['Machines & cables', 'Full gym']],
  ['Leg Curl',                'legs', false, ['Machines & cables', 'Full gym']],
  ['Calf Raise',              'legs', false, ['Dumbbells', 'Bodyweight only', 'Full gym']],
  ['Glute Bridge',            'legs', false, ['Bodyweight only', 'Dumbbells', 'Full gym']],
  ['Hip Thrust',              'legs', false, ['Barbell', 'Full gym']],
  ['Kettlebell Deadlift',     'legs', false, ['Kettlebells']],
]

export function generatePlan(inputs) {
  const equipment = inputs.equipment?.length ? inputs.equipment : ['Full gym']
  const veto = inputs.veto || []
  const sessions = Math.max(1, Math.min(6, parseInt(inputs.gymSessionsPerWeek) || 3))
  const exp = inputs.experience || 'Intermediate'
  const cSets = exp === 'Beginner' ? 3 : exp === 'Advanced' ? 5 : 4
  const iSets = exp === 'Beginner' ? 2 : 3
  const blank = () => ({ name: '', compound: false, sets: '', goalWeight: '', goalReps: '' })
  const pad = exs => [...exs, ...Array.from({ length: Math.max(0, 10 - exs.length) }, blank)].slice(0, 10)

  const pick = (category, isCompound, n) => {
    const result = []
    const seen = new Set()
    for (const [name, cat, comp, tags] of EX_DB) {
      if (cat !== category || comp !== isCompound) continue
      if (!tags.some(t => equipment.includes(t))) continue
      if (veto.includes(name) || seen.has(name)) continue
      seen.add(name)
      result.push({ name, compound: isCompound, sets: isCompound ? cSets : iSets, goalWeight: '', goalReps: '' })
      if (result.length >= n) break
    }
    return result
  }

  const push  = () => ({ name: 'PUSH',      exercises: pad([...pick('push', true, 3), ...pick('push', false, 2)]) })
  const pull  = () => ({ name: 'PULL',      exercises: pad([...pick('pull', true, 3), ...pick('pull', false, 2)]) })
  const legs  = () => ({ name: 'LEGS',      exercises: pad([...pick('legs', true, 3), ...pick('legs', false, 2)]) })
  const upper = () => ({ name: 'UPPER',     exercises: pad([...pick('push', true, 2), ...pick('pull', true, 2), ...pick('push', false, 1), ...pick('pull', false, 1)]) })
  const lower = () => ({ name: 'LOWER',     exercises: pad([...pick('legs', true, 3), ...pick('legs', false, 2)]) })
  const fb    = (lbl) => ({ name: lbl,      exercises: pad([...pick('push', true, 1), ...pick('pull', true, 1), ...pick('legs', true, 1), ...pick('push', false, 1), ...pick('pull', false, 1)]) })

  let named
  if      (sessions === 1) named = [fb('FULL BODY')]
  else if (sessions === 2) named = [fb('FULL BODY A'), fb('FULL BODY B')]
  else if (sessions === 3) named = [push(), pull(), legs()]
  else if (sessions === 4) named = [push(), pull(), legs(), upper()]
  else if (sessions === 5) named = [push(), pull(), legs(), upper(), lower()]
  else                     named = [push(), pull(), legs(), push(), pull(), legs()]

  while (named.length < 7) named.push(blankDay())
  return named
}
