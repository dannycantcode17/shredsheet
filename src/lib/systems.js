// ============================================================
// THE SHREDSHEET — SYSTEMS
// The configurator assigns every athlete one of 8 fixed "systems"
// (4 archetypes × 2 sexes). A system seeds the engine inputs, decides
// which tracking is mandatory vs optional, and is handed to the AI
// coach so it always knows "what system" the athlete is on.
//
// Granularity is deliberately coarse: the wizard also captures the raw
// numbers (age, height, weight, goal weight, experience signals) that
// fine-tune each system, so 8 archetypes is plenty.
// ============================================================

// Trackable modules. Required vs optional is decided per-system; the
// wizard's "how much will you track" answer can switch optional ones off.
export const TRACK = {
  WORKOUTS: 'workouts',
  WEIGHT: 'weight',
  CALORIES: 'calories',
  PROTEIN: 'protein',
  STEPS: 'steps',
  CARDIO: 'cardio',
}

export const TRACK_LABELS = {
  workouts: 'Workouts',
  weight: 'Bodyweight',
  calories: 'Calories',
  protein: 'Protein',
  steps: 'Steps',
  cardio: 'Cardio',
}

// The four archetypes. Each is rendered per-sex into a concrete system.
// `defaults` is an inputs patch describing the *style* of the system
// (intensity, activity targets) — the wizard supplies the *numbers*.
const ARCHETYPES = {
  builder: {
    archetype: 'builder',
    label: 'The Builder',
    goal: 'Bulk',
    tagline: 'Maximum size. Eat big, lift heavy, grow.',
    required: [TRACK.WORKOUTS, TRACK.WEIGHT, TRACK.CALORIES, TRACK.PROTEIN],
    optional: [TRACK.STEPS, TRACK.CARDIO],
    estimatesMuscle: true,
    defaults: { weightIntensity: 'Intense', cardioIntensity: 'Moderate', stepGoal: 8000, cardioMinsPerWeek: 45, gymSessionsPerWeek: 4 },
  },
  recomp: {
    archetype: 'recomp',
    label: 'The Recomp',
    goal: 'Lean Bulk',
    tagline: 'Build muscle, hold the fat. The clean, patient path.',
    required: [TRACK.WORKOUTS, TRACK.WEIGHT, TRACK.CALORIES, TRACK.PROTEIN],
    optional: [TRACK.STEPS, TRACK.CARDIO],
    estimatesMuscle: true,
    defaults: { weightIntensity: 'Intense', cardioIntensity: 'Moderate', stepGoal: 10000, cardioMinsPerWeek: 90, gymSessionsPerWeek: 4 },
  },
  shred: {
    archetype: 'shred',
    label: 'The Shred',
    goal: 'Cut',
    tagline: 'Strip fat, keep the muscle you built. Discipline pays.',
    required: [TRACK.WORKOUTS, TRACK.WEIGHT, TRACK.CALORIES],
    optional: [TRACK.PROTEIN, TRACK.STEPS, TRACK.CARDIO],
    estimatesMuscle: true,
    defaults: { weightIntensity: 'Moderate', cardioIntensity: 'Moderate', stepGoal: 12000, cardioMinsPerWeek: 150, gymSessionsPerWeek: 4 },
  },
  foundation: {
    archetype: 'foundation',
    label: 'The Foundation',
    goal: 'Lean Bulk',
    tagline: 'Build the habit first. Show up, get strong, feel better.',
    required: [TRACK.WORKOUTS, TRACK.WEIGHT],
    optional: [TRACK.CALORIES, TRACK.PROTEIN, TRACK.STEPS, TRACK.CARDIO],
    estimatesMuscle: false,
    defaults: { weightIntensity: 'Relaxed', cardioIntensity: 'Relaxed', stepGoal: 8000, cardioMinsPerWeek: 90, gymSessionsPerWeek: 3 },
  },
}

// Short, sex-aware coaching note appended for the AI so it knows the system.
const SEX_NOTE = {
  builder: { Male: 'leaning into a calorie surplus and heavy progressive overload', Female: 'leaning into a controlled surplus with priority on lower-body and back strength' },
  recomp: { Male: 'recomposition at maintenance-to-slight-surplus', Female: 'recomposition at maintenance, prioritising glutes, legs and posture' },
  shred: { Male: 'a sustainable deficit protecting hard-won muscle', Female: 'a sustainable deficit protecting muscle, especially lower body' },
  foundation: { Male: 'habit-building: consistency before optimisation', Female: 'habit-building: consistency before optimisation' },
}

export const SEXES = ['Male', 'Female']

// Build the 8 concrete systems: <archetype>-<m|f>
export const SYSTEMS = Object.values(ARCHETYPES).flatMap(a =>
  SEXES.map(sex => ({
    id: `${a.archetype}-${sex[0].toLowerCase()}`,
    archetype: a.archetype,
    sex,
    label: a.label,
    goal: a.goal,
    tagline: a.tagline,
    required: a.required,
    optional: a.optional,
    estimatesMuscle: a.estimatesMuscle,
    defaults: a.defaults,
    coachDescriptor: `${a.label} (${sex.toLowerCase()}) — ${SEX_NOTE[a.archetype][sex]}.`,
  }))
)

export const getSystem = (id) => SYSTEMS.find(s => s.id === id) || null
export const getArchetype = (key) => ARCHETYPES[key] || null
