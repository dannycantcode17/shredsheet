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

  // Sex modifier on muscle-gain rate (WORKER!C87). The original FORMULA used
  // 0.75 for female; the author's own methodology notes said 0.85. Aligned to
  // 0.85 (documented intent) and surfaced here so it's tweakable, not buried in
  // the formula. A crude proxy for lower absolute lean-mass gain — not a claim
  // about training response. The user's muscle modifier is the real override.
  // See CHANGES_FROM_EXCEL.md.
  SEX_MUSCLE_MULT: { MALE: 1, FEMALE: 0.85 },

  // Projection uncertainty (value 4: show uncertainty, never fake precision).
  // Between-person variation in how a body responds to the same plan is large,
  // so a projection is a central estimate, not a promise. We express it as a
  // relative band that starts wide and narrows as logged days calibrate it.
  // Heuristic, not a statistical CI — and labelled as such in the UI.
  UNCERTAINTY: { REL_BASE: 0.4, REL_FLOOR: 0.12, REL_TAU: 30 },
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
