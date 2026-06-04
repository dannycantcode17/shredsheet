// ============================================================
// MUSCLE MAPPING + VOLUME AGGREGATION
// Exercises in the Shredsheet aren't tagged with muscles, so we infer
// muscle groups from the exercise name via keyword rules (the same
// pragmatic approach engine.js already uses in compoundFactor). Logged
// sets are then aggregated per muscle group to drive the body heatmap.
// ============================================================

// Canonical groups, split by the body view they render on.
export const MUSCLE_GROUPS = [
  'chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs',
  'back', 'traps', 'glutes', 'quads', 'hamstrings', 'calves',
]

export const MUSCLE_LABELS = {
  chest: 'Chest', shoulders: 'Shoulders', biceps: 'Biceps', triceps: 'Triceps',
  forearms: 'Forearms', abs: 'Abs', back: 'Back', traps: 'Traps',
  glutes: 'Glutes', quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves',
}

// Keyword → group share rules. Primary movers ~1.0, assistors ~0.5.
// All matching rules contribute; we keep the max share per group.
const RULES = [
  { kw: ['deadlift'], groups: { back: 1, hamstrings: 0.7, glutes: 0.7, traps: 0.5, forearms: 0.4 } },
  { kw: ['rdl', 'romanian', 'good morning', 'leg curl', 'ham', 'nordic'], groups: { hamstrings: 1, glutes: 0.5 } },
  { kw: ['squat', 'leg press', 'lunge', 'split squat', 'step up', 'hack', 'leg extension'], groups: { quads: 1, glutes: 0.6 } },
  { kw: ['hip thrust', 'glute', 'bridge'], groups: { glutes: 1, hamstrings: 0.4 } },
  { kw: ['calf', 'calves'], groups: { calves: 1 } },
  { kw: ['bench', 'chest', 'fly', 'flye', 'pec', 'dip', 'push-up', 'pushup', 'press up'], groups: { chest: 1, triceps: 0.5, shoulders: 0.4 } },
  { kw: ['incline', 'decline'], groups: { chest: 0.9, shoulders: 0.5 } },
  { kw: ['overhead press', 'shoulder press', 'ohp', 'military', 'lateral raise', 'side raise', 'delt', 'arnold'], groups: { shoulders: 1, triceps: 0.4 } },
  { kw: ['face pull', 'rear delt', 'reverse fly'], groups: { shoulders: 0.7, back: 0.6, traps: 0.4 } },
  { kw: ['triceps', 'tricep', 'pushdown', 'skullcrusher', 'skull crusher', 'kickback', 'close grip', 'overhead extension'], not: ['glute'], groups: { triceps: 1 } },
  { kw: ['curl', 'biceps', 'bicep', 'chin'], not: ['leg curl'], groups: { biceps: 1, forearms: 0.4 } },
  { kw: ['hammer'], groups: { biceps: 0.9, forearms: 0.7 } },
  { kw: ['row', 'pulldown', 'pull-up', 'pullup', 'pull up', 'lat', 'pullover', 'chin', 'chin-up', 'chin up'], groups: { back: 1, biceps: 0.5 } },
  { kw: ['shrug', 'trap'], groups: { traps: 1 } },
  { kw: ['forearm', 'wrist', 'grip'], groups: { forearms: 1 } },
  { kw: ['ab', 'abs', 'crunch', 'plank', 'core', 'leg raise', 'sit up', 'sit-up', 'hanging'], groups: { abs: 1 } },
]

// Whole-word match so e.g. "ab" doesn't fire on "cable", "lat" on "lateral",
// or "ham" on "hammer". Multi-word keywords still match across spaces/hyphens.
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const hasWord = (text, kw) => new RegExp(`\\b${esc(kw)}(?:s|es)?\\b`).test(text)

// Return a { group: share } map for an exercise name.
export function muscleGroupsFor(name) {
  const s = String(name || '').toLowerCase()
  if (!s.trim()) return {}
  const out = {}
  for (const rule of RULES) {
    if (rule.not && rule.not.some(k => hasWord(s, k))) continue
    if (rule.kw.some(k => hasWord(s, k))) {
      for (const [g, w] of Object.entries(rule.groups)) out[g] = Math.max(out[g] || 0, w)
    }
  }
  return out
}

// Aggregate logged sets into per-group volume (set-equivalents).
// Each logged set contributes its group share; returns totals + the max.
export function computeMuscleVolume(workoutLog) {
  const byGroup = Object.fromEntries(MUSCLE_GROUPS.map(g => [g, 0]))
  for (const set of workoutLog || []) {
    if (!set.exercise) continue
    const shares = muscleGroupsFor(set.exercise)
    for (const [g, w] of Object.entries(shares)) byGroup[g] += w
  }
  const max = Math.max(0, ...Object.values(byGroup))
  const total = Object.values(byGroup).reduce((a, b) => a + b, 0)
  return { byGroup, max, total }
}
