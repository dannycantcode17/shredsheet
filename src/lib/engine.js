// ============================================================
// THE SHREDSHEET ENGINE
// Faithful port of the WORKER / DAILY WORKER / GYM WORKER tabs,
// with bugs fixed. Every deviation from the original is tagged
// with  // CHANGE:  and listed in CHANGES_FROM_EXCEL.md
// ============================================================
import { CONST, NEWBIE_BY_SESSIONS, BULKCUT_BY_GOAL, CARDIO_MET, CAL_PER_REP, CAL_PER_SET, SESSION_VOLUME_MODIFIER } from './defaults.js'

const n = (v, d = 0) => { const x = parseFloat(v); return Number.isFinite(x) ? x : d }
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x))

// ---- per-set helpers (WORKOUT LOG worker columns) ----
export const epley1RM = (weight, reps, rir = 0) => n(weight) * (1 + (n(reps) - n(rir)) / 30) // WORKOUT LOG!Z13
const rirMod = (rir) => { if (rir === '' || rir == null) return 1; const r = n(rir); return r <= 0 ? 1.2 : r === 1 ? 1.1 : r === 2 ? 1 : r === 3 ? 0.9 : 0.8 } // R col
const tempoMod = (t) => { if (t === '' || t == null) return 1; const q = n(t, 1); return q <= 1 ? 1.2 : q === 2 ? 1 : 0.8 } // S col
const compoundFactor = (name, compound) => {
  const s = String(name || '').toLowerCase()
  if (s.includes('deadlift') || s.includes('squat')) return 1.2
  return compound ? 1.1 : 0.9
} // O col
const sessionVolMult = (volInclReps) => (SESSION_VOLUME_MODIFIER.find(t => volInclReps < t.under) || { mult: 1.4 }).mult

const bmr = (inputs) => {
  const base = 10 * n(inputs.startWeightKg) + 6.25 * n(inputs.heightCm) - 5 * n(inputs.age)
  const raw = String(inputs.sex).toUpperCase() === 'MALE' ? base + 5 : base - 161
  return raw * n(inputs.metabolismModifier, 1)
} // WORKER!C27
const kcalPerStep = (w) => (3.4 * n(w) * (1 / 60)) / 100      // WORKER!C50
const kcalPerCardioMin = (w, intensity) => (CARDIO_MET[intensity] ?? 6) * n(w) * 3.5 / 200 // WORKER!C49

// Newbie decay (DAILY WORKER!C46). base from last-6m sessions; flat 45d then exp decay -> 1.0
const newbieFactor = (sessionsLast6m, dayIndex) => {
  const base = NEWBIE_BY_SESSIONS[clamp(Math.round(n(sessionsLast6m)), 0, 7)] ?? 1
  if (base <= 1) return base
  if (dayIndex <= CONST.NEWBIE_DECAY_FLAT_DAYS) return base
  return 1 + (base - 1) * Math.exp(-(dayIndex - CONST.NEWBIE_DECAY_FLAT_DAYS) / CONST.NEWBIE_DECAY_TAU)
}
const penaltyCap = (sessionsLast6m) => {
  const s = n(sessionsLast6m)
  return s <= 1 ? CONST.PENALTY_CAP_NEWBIE : s <= 3 ? CONST.PENALTY_CAP_INTERMEDIATE : CONST.PENALTY_CAP_EXPERIENCED
} // WORKER!C116

// Shred-cleanliness lookup (INPUTS!C34 / WORKER!C34) — exact port of the 27-branch IFS.
export const cleanliness = (weight, fat, muscle) => {
  const sgn = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0)
  const W = sgn(weight), F = sgn(fat), M = sgn(muscle)
  const cMM = clamp(muscle / (weight || 1), 0, 1)
  const cFF = clamp(Math.abs(fat) / Math.abs(weight || 1), 0, 1)
  const key = `${W}|${F}|${M}`
  const map = {
    '1|1|1': cMM, '1|1|-1': 0, '1|1|0': 0,
    '1|-1|1': cMM, '1|-1|-1': cMM, '1|-1|0': 0.5,
    '1|0|1': cMM, '1|0|-1': 0, '1|0|0': 0.5,
    '-1|1|1': 0, '-1|1|-1': 0, '-1|1|0': 0,
    '-1|-1|1': 1, '-1|-1|-1': cFF, '-1|-1|0': cFF,
    '-1|0|1': 1, '-1|0|-1': 0, '-1|0|0': 0.5,
    '0|1|1': 0.5, '0|1|-1': 0, '0|1|0': 0,
    '0|-1|1': 1, '0|-1|-1': 0.5, '0|-1|0': 0.5,
    '0|0|1': 0.5, '0|0|-1': 0.5, '0|0|0': 0.5,
  }
  return map[key] ?? 0.5
}

// Shared muscle-risk-penalty maths (WORKER!C90 planned, DAILY WORKER!C52 actual)
function riskPenalty({ vol, newbie, bulkcut, protein, cap }) {
  const tests = [vol < CONST.VOLUME_THRESHOLD, newbie < CONST.NEWBIE_THRESHOLD, bulkcut < CONST.BULKCUT_THRESHOLD]
  if (protein != null) tests.push(protein < CONST.PROTEIN_THRESHOLD)
  if (tests.filter(Boolean).length < 2) return 0
  const term = (metric, active) => active ? (Math.min(metric, CONST.MOD_BASE) - CONST.MOD_BASE) * CONST.PENALTY_MULTIPLIER : 0
  let p = 0
  p += term(vol, vol < CONST.VOLUME_THRESHOLD)
  p += term(newbie, newbie < CONST.NEWBIE_THRESHOLD) * clamp((CONST.ADJ_BASE - newbie) * CONST.MULT_ADJUST, 0, 1)
  p += term(bulkcut, bulkcut < CONST.BULKCUT_THRESHOLD)
  if (protein != null) p += term(protein, protein < CONST.PROTEIN_THRESHOLD)
  return Math.max(cap, p)
}

// ============================================================
// 1) PLAN PROJECTION  (INPUTS calculated targets via WORKER)
// ============================================================
export function computePlan(inputs, plan) {
  const startW = n(inputs.startWeightKg)
  const goalW = n(inputs.goalWeightKg)
  const days = Math.max(1, n(inputs.periodDays, 1)) // CHANGE: removed the hardcoded 186-day cap
  const weightChange = goalW - startW // INPUTS!C31  (negative = loss)

  const plannedSets = plan.reduce((a, d) => a + d.exercises.reduce((b, e) => b + n(e.sets), 0), 0) // WORKER!C80
  const isCut = inputs.goal === 'Cut' || inputs.goal === 'Aggressive Cut'
  const priority = isCut ? 'Fat Loss' : 'Muscle Gain' // WORKER!C19

  // Muscle multipliers (planned)
  const volMult = plannedSets / CONST.VOLUME_BASE_SETS_WK            // C83
  const newbie = NEWBIE_BY_SESSIONS[clamp(Math.round(n(inputs.sessionsLast6m)), 0, 7)] ?? 1 // C84 (base, pre-decay)
  const bulkcut = BULKCUT_BY_GOAL[inputs.goal] ?? 1                  // C85
  const proteinMult = 1                                             // C86 (planned assumes hit)
  const sexMult = String(inputs.sex).toUpperCase() === 'MALE' ? 1 : 0.75 // C87
  const muscleMod = n(inputs.muscleModifier, 1)                     // C88
  const finalMuscleMod = volMult * newbie * bulkcut * proteinMult * sexMult * muscleMod // C89
  const penalty = riskPenalty({ vol: volMult, newbie, bulkcut, protein: null, cap: penaltyCap(inputs.sessionsLast6m) }) // C90

  // Expected muscle change / week (C92) with volume-based suppression of the penalty
  let musclePerWeek
  if (penalty === 0) musclePerWeek = finalMuscleMod * CONST.BASE_MUSCLE_GAIN_PER_WEEK
  else {
    const raw = penalty * CONST.BASE_MUSCLE_GAIN_PER_WEEK * (1 / (muscleMod || 1))
    musclePerWeek = volMult > 1.3 ? raw / 3 : volMult > 1 ? raw / 2 : raw
  }
  const muscleChange = (musclePerWeek / 7) * days     // C93 -> C94
  const fatChange = weightChange - muscleChange       // INPUTS!C32
  const clean = cleanliness(weightChange, fatChange, muscleChange)

  // Calorie target (WORKER C20/C21/C23/C27/C28/C29)
  const bulkAgg = priority === 'Fat Loss' ? 0 : (fatChange <= 0 ? clamp(finalMuscleMod, 0.75, 1) : clamp(finalMuscleMod, 0.75, 2))
  const aggregateDelta = priority === 'Fat Loss'
    ? fatChange * CONST.KCAL_PER_KG_FAT
    : (muscleChange * CONST.KCAL_PER_KG_MUSCLE * bulkAgg) + (fatChange >= 0 ? fatChange * CONST.KCAL_PER_KG_FAT : 0)
  const dailyDelta = aggregateDelta / days

  const stepsCal = n(inputs.stepGoal) * kcalPerStep(startW)
  const cardioCal = (n(inputs.cardioMinsPerWeek) * kcalPerCardioMin(startW, inputs.cardioIntensity)) / 7
  const weeklyWeightsCal = plannedSets * CONST.AVG_REPS_PER_SET * (CAL_PER_REP[inputs.weightIntensity] ?? 0.8)
    + plannedSets * (CAL_PER_SET[inputs.weightIntensity] ?? 4)
  const weightsCal = weeklyWeightsCal / 7
  const BMR = bmr(inputs)
  const tdee = BMR + stepsCal + cardioCal + weightsCal // C28
  const calorieTarget = tdee + dailyDelta              // C29
  const proteinTarget = startW * (isCut ? 2.2 : 2)     // INPUTS!C37

  return {
    weightChange, muscleChange, fatChange, cleanliness: clean,
    calorieTarget, proteinTarget, dailyDelta, tdee: BMR + stepsCal + cardioCal + weightsCal,
    bmr: BMR, plannedSets, priority, bulkAgg,
    multipliers: { volMult, newbie, bulkcut, proteinMult, sexMult, muscleMod, finalMuscleMod, penalty },
    days,
  }
}

// ============================================================
// 2) STRENGTH  (GYM WORKER) — 1RM progression per exercise
// ============================================================
export function computeStrength(plan, workoutLog) {
  // gather logged sets per exercise, in order
  const byExercise = {}
  for (const s of workoutLog) {
    if (!s.exercise || s.weight === '' || s.reps === '') continue
    ;(byExercise[s.exercise] ||= []).push(epley1RM(s.weight, s.reps, s.rir))
  }
  // target 1RM per exercise from the plan's goal weight + reps (Epley)
  const targets = {}
  for (const day of plan) for (const e of day.exercises) {
    if (e.name && e.goalWeight !== '' && e.goalReps !== '') targets[e.name] = epley1RM(e.goalWeight, e.goalReps, 0)
  }
  const exercises = Object.keys(byExercise).map((name) => {
    const series = byExercise[name]
    const first = series[0]
    const max = Math.max(...series)
    const target = targets[name] ?? null
    return {
      name, series, first: round(first, 1), max: round(max, 1),
      target: target != null ? round(target, 1) : null,
      hitTarget: target != null ? max >= target : null,
      pctGain: first ? (max - first) / first : 0,
    }
  })
  // top 6 "key" lifts = those with a target set in the plan, else most-logged
  const keyed = exercises.filter(e => e.target != null)
  const key6 = (keyed.length ? keyed : exercises.sort((a, b) => b.series.length - a.series.length)).slice(0, 6)
  const ranked = [...exercises].sort((a, b) => b.pctGain - a.pctGain)
  return {
    exercises, key6,
    topImproved: ranked.slice(0, 3),
    bottomImproved: ranked.slice(-3).reverse(),
    avgPctGain: exercises.length ? exercises.reduce((a, e) => a + e.pctGain, 0) / exercises.length : 0,
  }
}

// ============================================================
// 3) DAILY ACTUALS  (DAILY WORKER) — per-day loop + rollups
// ============================================================
export function computeDaily(inputs, plan, dailyLog, workoutLog, plannedRef) {
  const days = Math.max(1, n(inputs.periodDays, 1))
  const startDate = new Date(inputs.startDate)
  const isCut = inputs.goal === 'Cut' || inputs.goal === 'Aggressive Cut'
  const priority = isCut ? 'Fat Loss' : 'Muscle Gain'
  const BMR = bmr(inputs)
  const proteinTarget = plannedRef?.proteinTarget || n(inputs.startWeightKg) * (isCut ? 2.2 : 2)
  const sexMult = String(inputs.sex).toUpperCase() === 'MALE' ? 1 : 0.75
  const muscleMod = n(inputs.muscleModifier, 1)

  // index workout sets by ISO date
  const setsByDate = {}
  for (const s of workoutLog) {
    if (!s.date || !s.exercise) continue
    ;(setsByDate[s.date] ||= []).push(s)
  }
  const isoOf = (i) => { const d = new Date(startDate); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10) }

  const compoundMap = {}
  for (const day of plan) for (const e of day.exercises) if (e.name) compoundMap[e.name] = !!e.compound
  const rows = []
  for (let i = 0; i < days; i++) {
    const dayNum = i + 1
    const iso = isoOf(i)
    const log = dailyLog[dayNum] || {}
    const logged = ['cardioMins', 'steps', 'calories', 'protein', 'weight'].some(k => log[k] !== '' && log[k] != null)
    const sets = setsByDate[iso] || []

    // session volume scores
    let volExcl = 0, volIncl = 0, weightsCalBefore = 0
    for (const s of sets) {
      const o = compoundFactor(s.exercise, compoundMap[s.exercise] ?? s.compound), r = rirMod(s.rir), t = tempoMod(s.tempo)
      volExcl += o * r * t                       // T col (per set, excl reps)
      volIncl += n(s.reps) * o * r * t           // U col (incl reps)
      weightsCalBefore += (n(s.reps) * o * r * t) * (CAL_PER_REP[inputs.weightIntensity] ?? 0.8) + (CAL_PER_SET[inputs.weightIntensity] ?? 4)
    }
    const weightsCal = weightsCalBefore * sessionVolMult(volIncl) // DAILY WORKER!C21
    const cardioCal = n(log.cardioMins) * kcalPerCardioMin(n(inputs.startWeightKg), inputs.cardioIntensity)
    const stepsCal = n(log.steps) * kcalPerStep(n(inputs.startWeightKg))
    const tdee = BMR + weightsCal + cardioCal + stepsCal
    const consumed = n(log.calories)
    const deficit = logged && log.calories !== '' ? consumed - tdee : null // + surplus / - deficit

    // fat (kg) for the day (DAILY WORKER!C29) — deficit/7700, surplus split kept faithful but simplified
    let fatDay = null
    if (deficit != null) {
      if (priority === 'Fat Loss' || deficit < 0) fatDay = deficit / CONST.KCAL_PER_KG_FAT
      else fatDay = Math.max(0, deficit - BMR * 0.2) / CONST.KCAL_PER_KG_FAT // CHANGE: simplified surplus->fat partition
    }

    // muscle multipliers (daily)
    const daySets = sets.length
    const volMultDaily = daySets / (CONST.VOLUME_BASE_SETS_WK / 7) // C44
    const newbie = newbieFactor(inputs.sessionsLast6m, dayNum)     // C46
    const bulkcut = deficit == null ? 1 : deficit <= -1000 ? BULKCUT_BY_GOAL['Aggressive Cut']
      : deficit <= -250 ? BULKCUT_BY_GOAL['Cut'] : deficit <= 0 ? 1
      : deficit <= 250 ? BULKCUT_BY_GOAL['Lean Bulk'] : BULKCUT_BY_GOAL['Bulk'] // C47
    const proteinMult = log.protein !== '' && log.protein != null ? n(log.protein) / (proteinTarget || 1) : 0 // C48
    rows.push({ dayNum, iso, logged, daySets, volExcl, volIncl, deficit, tdee, consumed, fatDay,
      volMultDaily, newbie, bulkcut, proteinMult, weight: (log.weight === '' || log.weight == null) ? null : n(log.weight) })
  }

  // rolling 7-day volume multiplier  // CHANGE: fixes the #REF! in DAILY WORKER!C45
  for (let i = 0; i < rows.length; i++) {
    const win = rows.slice(Math.max(0, i - 6), i + 1)
    rows[i].volRolling7 = win.reduce((a, r) => a + r.volMultDaily, 0) / win.length
  }

  // muscle per day (raw + 3-day smoothing) — DAILY WORKER C51/C52/C54/C35
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const growthMod = r.volRolling7 * r.newbie * r.bulkcut * r.proteinMult * sexMult * muscleMod // C51
    const penalty = riskPenalty({ vol: r.volMultDaily, newbie: r.newbie, bulkcut: r.bulkcut, protein: r.proteinMult, cap: penaltyCap(inputs.sessionsLast6m) }) // C52
    const base = CONST.BASE_MUSCLE_GAIN_PER_WEEK / 7
    let raw
    if (penalty === 0) raw = base * growthMod
    else {
      const p = penalty * base
      raw = (r.volRolling7 > 1.3 && r.proteinMult > 1.1) ? p / 4
        : (r.volRolling7 > 1.3 && r.proteinMult > 1) ? p / 3
        : (r.volRolling7 > 1 && r.proteinMult > 1) ? p / 2
        : r.volRolling7 > 1.3 ? p / 2
        : (r.volRolling7 > 1 || r.proteinMult > 1) ? p * 2 / 3 : p
    }
    r.muscleRaw = r.logged ? raw : 0
  }
  for (let i = 0; i < rows.length; i++) {
    const t = rows[i].muscleRaw, y = rows[i - 1]?.muscleRaw || 0, b = rows[i - 2]?.muscleRaw || 0
    rows[i].muscleDay = 0.5 * t + 0.35 * y + 0.15 * b // C35 smoothing
  }

  // cumulatives
  let cumMuscle = 0, cumWeight = 0, prevW = null
  for (const r of rows) {
    if (r.logged) cumMuscle += r.muscleDay
    if (r.weight != null) { if (prevW != null) cumWeight += r.weight - prevW; prevW = r.weight }
    r.cumMuscle = cumMuscle
    r.cumWeight = cumWeight
    r.cumFat = cumWeight - cumMuscle // C38: scale change with muscle added back
  }

  const loggedRows = rows.filter(r => r.logged)
  const avg = (arr, sel) => arr.length ? arr.reduce((a, r) => a + (sel(r) || 0), 0) / arr.length : 0
  const window = (k) => loggedRows.slice(-k)
  const summarise = (arr) => ({
    daysLogged: arr.length,
    avgCalories: avg(arr.filter(r => r.consumed), r => r.consumed),
    avgDeficit: avg(arr.filter(r => r.deficit != null), r => r.deficit),
    avgProtein: avg(arr, r => r.proteinMult * proteinTarget),
    weeklyMuscle: avg(arr, r => r.muscleDay) * 7,
    weeklyFat: (avg(arr, r => r.fatDay) + avg(arr, r => r.muscleDay)) * 7,
    setsPerWeek: avg(arr, r => r.daySets) * 7,
  })

  return {
    rows,
    cumMuscle, cumFat: cumWeight - cumMuscle, cumWeight,
    whole: summarise(loggedRows), last7: summarise(window(7)), last30: summarise(window(30)),
    proteinTarget,
  }
}

function round(x, dp = 0) { const f = 10 ** dp; return Math.round(x * f) / f }

// ============================================================
// 4) AI CONTEXT  (port of WORKER master-prompt builder C206-C232)
// ============================================================
export function buildCoachContext(inputs, plan, planRes, daily, strength) {
  const f = (x, dp = 1) => (x == null || Number.isNaN(x) ? '-' : (x >= 0 ? '+' : '') + Number(x).toFixed(dp))
  const planLines = plan.filter(d => d.name).map(d =>
    `${d.name}: ` + d.exercises.filter(e => e.name).map(e => `${e.name} (${e.sets || 0} sets${e.goalWeight ? `, target ${e.goalWeight}kg x${e.goalReps}` : ''})`).join('; ')
  ).join('\n')
  const w = daily.whole
  return `You are the AI coach inside The Shredsheet (the 3-person team: the app is the analyst, you are the coach, the user is the athlete). Be encouraging, clear, didactic, never cringe. British English.

USER & GOAL
Age ${inputs.age}, ${inputs.sex}, ${inputs.heightCm}cm, start ${inputs.startWeightKg}kg -> goal ${inputs.goalWeightKg}kg over ${inputs.periodDays} days. Primary goal: ${inputs.goal}. Experience: ${inputs.experience}. Gym ${inputs.gymSessionsPerWeek}x/wk, ${inputs.stepGoal} steps/day, ${inputs.cardioMinsPerWeek} cardio mins/wk. Manual modifiers: metabolism ${Math.round(inputs.metabolismModifier*100)}%, muscle ${Math.round(inputs.muscleModifier*100)}%.

PLAN-CALCULATED TARGETS
Bodyweight change ${f(planRes.weightChange)}kg; Muscle change ${f(planRes.muscleChange)}kg; Fat change ${f(planRes.fatChange)}kg; Shred cleanliness ${Math.round(planRes.cleanliness*100)}%. Daily calories ${Math.round(planRes.calorieTarget)}kcal; protein ${Math.round(planRes.proteinTarget)}g; daily ${planRes.dailyDelta>=0?'surplus':'deficit'} ${Math.round(Math.abs(planRes.dailyDelta))}kcal. Estimated TDEE ${Math.round(planRes.tdee)}kcal.

TRAINING SPLIT
${planLines || '(no plan entered)'}

ACTUALS (whole period, ${w.daysLogged} days logged)
Avg calories ${Math.round(w.avgCalories)}kcal (target ${Math.round(planRes.calorieTarget)}); avg daily ${w.avgDeficit>=0?'surplus':'deficit'} ${Math.round(Math.abs(w.avgDeficit))}kcal; avg protein ${Math.round(w.avgProtein)}g; sets/wk ${w.setsPerWeek.toFixed(1)}; weekly muscle ${f(w.weeklyMuscle,2)}kg; weekly fat ${f(w.weeklyFat,2)}kg. Last 7d: ${daily.last7.daysLogged} days, avg ${Math.round(daily.last7.avgCalories)}kcal.
Cumulative so far: muscle ${f(daily.cumMuscle,2)}kg, fat ${f(daily.cumFat,2)}kg, scale ${f(daily.cumWeight,2)}kg.

STRENGTH (top lifts)
${strength.key6.map(e => `${e.name}: 1RM ${e.first}->${e.max}kg${e.target?` (target ${e.target}, ${e.hitTarget?'HIT':'not yet'})`:''}`).join('\n') || '(no workouts logged)'}
`
}
