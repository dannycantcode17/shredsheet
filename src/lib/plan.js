// ============================================================
// GYM PLAN GENERATION (app-side — NOT the engine).
// Builds a training split from the user's configurator inputs. Tries the AI
// coach (via askCoach / the /api/coach proxy); falls back to deterministic
// templates when AI is unavailable or returns nothing usable.
// Output matches the plan shape the rest of the app expects:
//   [{ name, exercises: [{ name, compound, sets, goalWeight:'', goalReps }] }]
// ============================================================
import { askCoach } from './ai.js'

// equipment label (from the configurator) -> internal tags
const EQUIP_TAGS = {
  'Full gym': ['barbell', 'dumbbell', 'machine', 'kettlebell', 'band', 'bodyweight'],
  'Barbell': ['barbell'],
  'Dumbbells': ['dumbbell'],
  'Machines & cables': ['machine'],
  'Kettlebells': ['kettlebell'],
  'Bands': ['band'],
  'Bodyweight only': ['bodyweight'],
}
const availableTags = (equipment) => {
  const set = new Set(['bodyweight']) // bodyweight is always on the table
  ;(equipment || []).forEach(e => (EQUIP_TAGS[e] || []).forEach(t => set.add(t)))
  if (!equipment || !equipment.length) ['barbell', 'dumbbell', 'machine'].forEach(t => set.add(t)) // sensible default
  return set
}

// movement pattern -> ordered exercise variants (first available wins)
const POOL = {
  hpush: [['Barbell Bench Press', ['barbell'], true], ['Dumbbell Bench Press', ['dumbbell'], true], ['Machine Chest Press', ['machine'], true], ['Push-up', ['bodyweight'], true]],
  ipush: [['Incline Barbell Press', ['barbell'], true], ['Incline Dumbbell Press', ['dumbbell'], true], ['Incline Machine Press', ['machine'], true], ['Decline Push-up', ['bodyweight'], true]],
  vpush: [['Overhead Press', ['barbell'], true], ['Dumbbell Shoulder Press', ['dumbbell'], true], ['Machine Shoulder Press', ['machine'], true], ['Pike Push-up', ['bodyweight'], true]],
  lateral: [['Dumbbell Lateral Raise', ['dumbbell'], false], ['Cable Lateral Raise', ['machine'], false], ['Band Lateral Raise', ['band'], false]],
  hpull: [['Barbell Row', ['barbell'], true], ['Dumbbell Row', ['dumbbell'], true], ['Seated Cable Row', ['machine'], true], ['Inverted Row', ['bodyweight'], true]],
  vpull: [['Pull-up', ['bodyweight'], true], ['Lat Pulldown', ['machine'], true], ['Band Pulldown', ['band'], true]],
  squat: [['Back Squat', ['barbell'], true], ['Goblet Squat', ['dumbbell', 'kettlebell'], true], ['Leg Press', ['machine'], true], ['Bodyweight Squat', ['bodyweight'], true]],
  hinge: [['Romanian Deadlift', ['barbell'], true], ['Dumbbell RDL', ['dumbbell'], true], ['Kettlebell Swing', ['kettlebell'], true], ['Leg Curl', ['machine'], false], ['Nordic Curl', ['bodyweight'], true]],
  lunge: [['Bulgarian Split Squat', ['dumbbell', 'bodyweight'], true], ['Walking Lunge', ['dumbbell', 'bodyweight'], true], ['Leg Extension', ['machine'], false]],
  biceps: [['Barbell Curl', ['barbell'], false], ['Dumbbell Curl', ['dumbbell'], false], ['Cable Curl', ['machine'], false], ['Band Curl', ['band'], false], ['Chin-up', ['bodyweight'], true]],
  triceps: [['Close-grip Bench Press', ['barbell'], true], ['Dumbbell Skullcrusher', ['dumbbell'], false], ['Tricep Pushdown', ['machine'], false], ['Dip', ['bodyweight'], true]],
  calves: [['Calf Raise', ['dumbbell', 'machine', 'bodyweight'], false]],
  core: [['Hanging Leg Raise', ['bodyweight'], false], ['Cable Crunch', ['machine'], false], ['Plank', ['bodyweight'], false]],
}

const DAY_TEMPLATES = {
  'Full Body': ['squat', 'hpush', 'hpull', 'hinge', 'lateral', 'core'],
  'Push': ['hpush', 'ipush', 'vpush', 'lateral', 'triceps'],
  'Pull': ['vpull', 'hpull', 'hinge', 'biceps', 'core'],
  'Legs': ['squat', 'hinge', 'lunge', 'calves', 'core'],
  'Upper': ['hpush', 'hpull', 'vpush', 'vpull', 'biceps', 'triceps'],
  'Lower': ['squat', 'hinge', 'lunge', 'calves', 'core'],
}

const splitForDays = (days) => {
  const d = Math.max(1, Math.min(6, Math.round(days) || 3))
  return {
    1: ['Full Body'], 2: ['Full Body', 'Full Body'],
    3: ['Push', 'Pull', 'Legs'], 4: ['Upper', 'Lower', 'Upper', 'Lower'],
    5: ['Push', 'Pull', 'Legs', 'Upper', 'Lower'], 6: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'],
  }[d]
}

const templateForName = (name) => {
  const s = String(name || '').toLowerCase()
  if (s.includes('push')) return 'Push'
  if (s.includes('pull')) return 'Pull'
  if (s.includes('leg')) return 'Legs'
  if (s.includes('upper')) return 'Upper'
  if (s.includes('lower')) return 'Lower'
  return 'Full Body'
}

// build one day's exercises from its template, honouring equipment + vetoes
function buildExercises(patterns, avail, veto, experience) {
  const vetoed = new Set((veto || []).map(v => String(v).toLowerCase()))
  const out = []
  for (const pat of patterns) {
    const variant = (POOL[pat] || []).find(([name, tags]) =>
      tags.some(t => avail.has(t)) && !vetoed.has(name.toLowerCase()))
    if (!variant) continue
    const [name, , compound] = variant
    const sets = compound ? (experience === 'Advanced' ? 4 : 3) : 3
    const goalReps = compound ? 8 : 12
    out.push({ name, compound, sets, goalWeight: '', goalReps })
  }
  return out
}

function buildFallback(inputs) {
  const avail = availableTags(inputs.equipment)
  const names = splitForDays(parseFloat(inputs.gymSessionsPerWeek) || parseFloat(inputs.sessionsLast6m) || 3)
  // de-dupe repeated day names (Push -> Push A / Push B) for clarity
  const counts = {}
  return names.map(n => {
    counts[n] = (counts[n] || 0) + 1
    const label = names.filter(x => x === n).length > 1 ? `${n} ${String.fromCharCode(64 + counts[n])}` : n
    return { name: label, exercises: buildExercises(DAY_TEMPLATES[n], avail, inputs.veto, inputs.experience) }
  })
}

// pull the first JSON object out of a model reply and coerce to the plan shape
function parseAIPlan(text) {
  try {
    const m = String(text).match(/\{[\s\S]*\}/)
    if (!m) return null
    const data = JSON.parse(m[0])
    const days = Array.isArray(data) ? data : data.days
    if (!Array.isArray(days) || !days.length) return null
    const plan = days.slice(0, 6).map(d => ({
      name: String(d.name || 'Day').slice(0, 24),
      exercises: (Array.isArray(d.exercises) ? d.exercises : []).slice(0, 10).map(e => ({
        name: String(e.name || '').slice(0, 40),
        compound: !!e.compound,
        sets: Number.isFinite(+e.sets) ? +e.sets : 3,
        goalWeight: '',
        goalReps: Number.isFinite(+e.goalReps) ? +e.goalReps : 8,
      })).filter(e => e.name),
    })).filter(d => d.exercises.length)
    return plan.length ? plan : null
  } catch { return null }
}

const SYS = 'You are a strength & conditioning coach. Reply with ONLY valid JSON, no prose, no code fences.'

async function aiPlan(prompt, apiKey) {
  try {
    const text = await askCoach({ messages: [{ role: 'user', content: prompt }], context: SYS, apiKey })
    return parseAIPlan(text)
  } catch { return null }
}

// Generate a full split. `prefer` is optional free-text/day-count steering.
export async function generatePlan({ inputs, prefer, apiKey }) {
  const days = Math.max(1, Math.min(6, Math.round(parseFloat(inputs.gymSessionsPerWeek) || parseFloat(inputs.sessionsLast6m) || 3)))
  const prompt =
    `Build a weekly training split as JSON.\n` +
    `Goal: ${inputs.goal}. Experience: ${inputs.experience || 'Intermediate'}. Days per week: ${days}.\n` +
    `Equipment available: ${(inputs.equipment && inputs.equipment.length ? inputs.equipment.join(', ') : 'standard gym')}.\n` +
    `Avoid these exercises entirely: ${(inputs.veto && inputs.veto.length ? inputs.veto.join(', ') : 'none')}.\n` +
    (prefer ? `User preference: ${prefer}.\n` : '') +
    `Return JSON shaped exactly: {"days":[{"name":"Push","exercises":[{"name":"Bench Press","compound":true,"sets":4,"goalReps":8}]}]}.\n` +
    `Exactly ${days} days, 4-6 exercises each, only equipment they have, never a vetoed exercise.`
  return (await aiPlan(prompt, apiKey)) || buildFallback(inputs)
}

// Regenerate the exercises while keeping the existing day names/structure.
export async function regenerateExercises({ inputs, plan, apiKey }) {
  const dayNames = plan.filter(d => d.name).map(d => d.name)
  if (!dayNames.length) return generatePlan({ inputs, apiKey })
  const prompt =
    `Regenerate the exercises for this training split, keeping these day names and order: ${dayNames.join(', ')}.\n` +
    `Goal: ${inputs.goal}. Experience: ${inputs.experience || 'Intermediate'}.\n` +
    `Equipment available: ${(inputs.equipment && inputs.equipment.length ? inputs.equipment.join(', ') : 'standard gym')}.\n` +
    `Avoid these exercises entirely: ${(inputs.veto && inputs.veto.length ? inputs.veto.join(', ') : 'none')}.\n` +
    `Give different exercises from a typical default where sensible. Return JSON: {"days":[{"name":"...","exercises":[{"name":"...","compound":true,"sets":4,"goalReps":8}]}]} with the same day names, 4-6 exercises each.`
  const ai = await aiPlan(prompt, apiKey)
  if (ai && ai.length) return ai
  // fallback: rebuild each named day from its inferred template
  const avail = availableTags(inputs.equipment)
  return dayNames.map(name => ({ name, exercises: buildExercises(DAY_TEMPLATES[templateForName(name)], avail, inputs.veto, inputs.experience) }))
}
