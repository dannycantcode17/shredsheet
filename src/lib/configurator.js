// ============================================================
// THE SHREDSHEET — CONFIGURATOR
// A one-question-at-a-time onboarding wizard. The question bank is a
// hand-crafted, scored questionnaire: it INFERS the athlete's training
// level from behavioural answers rather than trusting a self-applied
// "I'm advanced" label. classify() turns the answers into one of the 8
// systems plus a seeded inputs patch and a tracking map.
// ============================================================
import { SYSTEMS, TRACK } from './systems.js'

// ---- the question bank (asked in order; some are skipped via showIf) ----
// kind: 'choice' (options) | 'number' (single numeric field)
// Each answer is stored under `key`. `score`/`sessions` on options feed the
// hidden experience model; they're never surfaced to the athlete.
export const QUESTIONS = [
  {
    key: 'sex', kind: 'choice', prompt: 'First — what should the engine assume for your physiology?',
    sub: 'It changes the calorie and muscle maths. You can refine the numbers later.',
    options: [
      { value: 'Male', label: 'Male' },
      { value: 'Female', label: 'Female' },
    ],
  },
  {
    key: 'goalType', kind: 'choice', prompt: 'What are you actually here to do?',
    sub: 'Be honest — this picks your system. There are no wrong answers.',
    options: [
      { value: 'build', label: 'Build muscle & size', desc: 'Get bigger and stronger. A surplus.' },
      { value: 'recomp', label: 'Build muscle, stay lean', desc: 'Add muscle while holding body fat steady.' },
      { value: 'shred', label: 'Lose fat & get lean', desc: 'Strip fat while keeping your muscle.' },
      { value: 'foundation', label: 'Get healthier & build the habit', desc: 'New-ish to this, or coming back. Consistency first.' },
    ],
  },
  {
    key: 'age', kind: 'number', prompt: 'How old are you?', unit: 'years',
    min: 13, max: 100, placeholder: '28',
  },
  {
    key: 'heightCm', kind: 'number', prompt: 'How tall are you?', unit: 'cm',
    min: 120, max: 230, placeholder: '178',
    sub: 'Metric for now — centimetres.',
  },
  {
    key: 'startWeightKg', kind: 'number', prompt: 'What do you weigh right now?', unit: 'kg',
    min: 35, max: 250, placeholder: '80',
  },
  {
    key: 'goalWeightKg', kind: 'number', prompt: 'And what bodyweight are you aiming for?', unit: 'kg',
    min: 35, max: 250, placeholder: '78',
    sub: 'A target to steer by. Roughly is fine.',
  },
  {
    key: 'timeframe', kind: 'choice', prompt: 'Over what kind of timeframe?',
    sub: 'Sets the length of this training block.',
    options: [
      { value: 56, label: '8 weeks', desc: 'Short, focused push.' },
      { value: 84, label: '12 weeks', desc: 'The classic block.' },
      { value: 112, label: '16 weeks', desc: 'Patient and sustainable.' },
      { value: 168, label: '24 weeks', desc: 'The long game.' },
    ],
  },
  // ---- experience signals (hidden scoring — we infer, we don't ask "are you advanced?") ----
  {
    key: 'trainingHistory', kind: 'choice', prompt: 'How long have you trained with weights, consistently?',
    options: [
      { value: 'none', label: "I haven't, really", score: 0, sessions: 0 },
      { value: 'lt6', label: 'Less than 6 months', score: 1, sessions: 1 },
      { value: '6to24', label: '6 months to 2 years', score: 2, sessions: 2 },
      { value: 'gt24', label: 'Over 2 years', score: 3, sessions: 3 },
    ],
  },
  {
    key: 'weeklyFreq', kind: 'choice', prompt: 'Over the last 6 months, how often did you actually train each week?',
    sub: 'Not your best week — your honest average.',
    options: [
      { value: 0, label: 'Barely / not at all', score: 0, sessions: 0 },
      { value: 2, label: '1–2 times', score: 1, sessions: 2 },
      { value: 3, label: '3 times', score: 2, sessions: 3 },
      { value: 4, label: '4 times', score: 2, sessions: 4 },
      { value: 5, label: '5+ times', score: 3, sessions: 5 },
    ],
  },
  {
    key: 'liftConfidence', kind: 'choice', prompt: 'The big barbell lifts — squat, bench, deadlift. How are they?',
    options: [
      { value: 'no', label: "Never done them / not confident", score: 0 },
      { value: 'some', label: 'I can do some with okay form', score: 1 },
      { value: 'yes', label: 'Confident and progressing on all three', score: 2 },
    ],
  },
  // ---- commitment / data willingness (drives the tracking map) ----
  {
    key: 'trackingWillingness', kind: 'choice', prompt: 'How much are you willing to track, realistically?',
    sub: "Straight up: the more you log, the more the engine can tell you. But a system you'll actually stick to beats a perfect one you won't.",
    options: [
      { value: 'all', label: 'Everything — food, weight & workouts', desc: 'Full muscle & fat estimation unlocked.' },
      { value: 'macros', label: 'Calories, protein, weight & workouts', desc: 'Full estimation, minus the activity extras.' },
      { value: 'light', label: 'Just bodyweight & workouts', desc: 'Lighter — no calorie-based muscle estimate.' },
      { value: 'workouts', label: 'Only my workouts', desc: 'Strength tracking only. Add more anytime.' },
    ],
  },
  {
    key: 'activity', kind: 'choice', prompt: 'Outside the gym, how active is your day?',
    sub: 'Tunes your step and cardio targets.',
    options: [
      { value: 'low', label: 'Mostly sitting (desk job)' },
      { value: 'mid', label: 'On my feet a fair bit' },
      { value: 'high', label: 'Very active / physical job' },
    ],
  },
]

const findOpt = (q, val) => q.options?.find(o => o.value === val)

// Map the willingness answer to a concrete tracking map.
function trackingFromWillingness(willingness) {
  switch (willingness) {
    case 'all': return { workouts: true, weight: true, calories: true, protein: true, steps: true, cardio: true }
    case 'macros': return { workouts: true, weight: true, calories: true, protein: true, steps: false, cardio: false }
    case 'light': return { workouts: true, weight: true, calories: false, protein: false, steps: false, cardio: false }
    case 'workouts': return { workouts: true, weight: false, calories: false, protein: false, steps: false, cardio: false }
    default: return { workouts: true, weight: true, calories: true, protein: true, steps: true, cardio: true }
  }
}

// Infer training level from behavioural signals (never from a self-label).
function inferExperience(answers) {
  const score = [
    findOpt(QUESTIONS.find(q => q.key === 'trainingHistory'), answers.trainingHistory)?.score ?? 0,
    findOpt(QUESTIONS.find(q => q.key === 'weeklyFreq'), answers.weeklyFreq)?.score ?? 0,
    findOpt(QUESTIONS.find(q => q.key === 'liftConfidence'), answers.liftConfidence)?.score ?? 0,
  ].reduce((a, b) => a + b, 0)
  // No real history forces Beginner regardless of bravado elsewhere.
  if (answers.trainingHistory === 'none') return { experience: 'Beginner', score }
  if (score <= 2) return { experience: 'Beginner', score }
  if (score <= 5) return { experience: 'Intermediate', score }
  return { experience: 'Advanced', score }
}

// Activity → step / cardio targets (combined with the system's defaults).
function activityTargets(activity, sysDefaults) {
  const stepBase = sysDefaults.stepGoal
  const step = activity === 'low' ? Math.max(6000, stepBase - 2000)
    : activity === 'high' ? stepBase + 2000 : stepBase
  const cardio = activity === 'low' ? Math.round(sysDefaults.cardioMinsPerWeek * 0.7)
    : activity === 'high' ? Math.round(sysDefaults.cardioMinsPerWeek * 1.2) : sysDefaults.cardioMinsPerWeek
  return { stepGoal: step, cardioMinsPerWeek: cardio }
}

// ---- the brain: answers -> system + seeded inputs + tracking map ----
export function classify(answers) {
  const sex = answers.sex === 'Female' ? 'Female' : 'Male'
  const archetype = ['build', 'recomp', 'shred', 'foundation'].includes(answers.goalType)
    ? (answers.goalType === 'build' ? 'builder' : answers.goalType)
    : 'foundation'
  const system = SYSTEMS.find(s => s.archetype === archetype && s.sex === sex)

  const { experience } = inferExperience(answers)
  const sessionsLast6m = findOpt(QUESTIONS.find(q => q.key === 'weeklyFreq'), answers.weeklyFreq)?.sessions ?? 1

  // Goal can sharpen for an aggressive cut based on the weekly loss implied.
  const startW = Number(answers.startWeightKg) || 80
  const goalW = Number(answers.goalWeightKg) || startW
  const periodDays = Number(answers.timeframe) || 84
  let goal = system.goal
  if (archetype === 'shred') {
    const weeklyLoss = ((startW - goalW) / periodDays) * 7
    goal = weeklyLoss > 0.9 ? 'Aggressive Cut' : 'Cut'
  }

  const tracking = trackingFromWillingness(answers.trackingWillingness)
  // The headline promise: no muscle estimate without calories + weight.
  const muscleEstimation = !!(system.estimatesMuscle && tracking.calories && tracking.weight)

  const { stepGoal, cardioMinsPerWeek } = activityTargets(answers.activity, system.defaults)

  const inputsPatch = {
    startDate: new Date().toISOString().slice(0, 10),
    periodDays,
    sex, age: Number(answers.age) || 28,
    heightCm: Number(answers.heightCm) || 175,
    startWeightKg: startW,
    goalWeightKg: goalW,
    experience, sessionsLast6m,
    goal,
    gymSessionsPerWeek: system.defaults.gymSessionsPerWeek,
    stepGoal, cardioMinsPerWeek,
    weightIntensity: system.defaults.weightIntensity,
    cardioIntensity: system.defaults.cardioIntensity,
    metabolismModifier: 1,
    muscleModifier: 1,
  }

  return { systemId: system.id, system, inputsPatch, tracking: { ...tracking, muscleEstimation }, experience }
}

// Default tracking map for users onboarded before this existed (everything on).
export const ALL_TRACKING = { workouts: true, weight: true, calories: true, protein: true, steps: true, cardio: true, muscleEstimation: true }
