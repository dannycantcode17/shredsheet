import { test } from 'node:test'
import assert from 'node:assert/strict'
import { epley1RM, cleanliness, computePlan, computeStrength, computeDaily, projectionRel, projectionBand, buildCoachContext } from '../src/lib/engine.js'
import { DEFAULT_INPUTS, DEFAULT_PLAN, CONST } from '../src/lib/defaults.js'

test('epley1RM matches the Epley formula (1RM = w·(1 + (reps−rir)/30))', () => {
  assert.equal(epley1RM(100, 0, 0), 100)        // 0 effective reps → the weight itself
  assert.equal(epley1RM(100, 3, 3), 100)        // reps cancel rir → effective 0
  assert.ok(Math.abs(epley1RM(100, 10, 0) - 100 * (1 + 10 / 30)) < 1e-9)
})

test('cleanliness: key cells of the ported sign table', () => {
  // weight down, fat down, muscle up = ideal recomp = 1
  assert.equal(cleanliness(-2, -2.5, 0.5), 1)
  // weight up but muscle down = bad = 0
  assert.equal(cleanliness(1, 1, -1), 0)
  // all flat = neutral 0.5
  assert.equal(cleanliness(0, 0, 0), 0.5)
  // output is always within [0,1]
  for (const w of [-3, 0, 3]) for (const f of [-3, 0, 3]) for (const m of [-1, 0, 1]) {
    const c = cleanliness(w, f, m)
    assert.ok(c >= 0 && c <= 1, `cleanliness(${w},${f},${m})=${c}`)
  }
})

test('computePlan: sex multiplier is 1 (M) vs 0.85 (F) and only that differs', () => {
  const m = computePlan({ ...DEFAULT_INPUTS, sex: 'Male', goal: 'Lean Bulk', sessionsLast6m: 3 }, DEFAULT_PLAN)
  const f = computePlan({ ...DEFAULT_INPUTS, sex: 'Female', goal: 'Lean Bulk', sessionsLast6m: 3 }, DEFAULT_PLAN)
  assert.equal(m.multipliers.sexMult, CONST.SEX_MUSCLE_MULT.MALE)
  assert.equal(f.multipliers.sexMult, CONST.SEX_MUSCLE_MULT.FEMALE)
  assert.ok(Math.abs(f.multipliers.sexMult / m.multipliers.sexMult - 0.85) < 1e-9)
})

test('computePlan: fatChange = weightChange − muscleChange, and targets are finite', () => {
  const r = computePlan(DEFAULT_INPUTS, DEFAULT_PLAN)
  assert.ok(Math.abs(r.fatChange - (r.weightChange - r.muscleChange)) < 1e-9)
  for (const k of ['calorieTarget', 'proteinTarget', 'tdee', 'bmr', 'dailyDelta']) {
    assert.ok(Number.isFinite(r[k]), `${k} should be finite, got ${r[k]}`)
  }
})

test('computePlan: never returns NaN/Infinity even with empty/zero inputs', () => {
  const r = computePlan({ ...DEFAULT_INPUTS, startWeightKg: 0, goalWeightKg: 0, periodDays: 1 }, [])
  for (const [k, v] of Object.entries(r)) {
    if (typeof v === 'number') assert.ok(Number.isFinite(v), `${k} not finite: ${v}`)
  }
})

test('projection uncertainty narrows monotonically toward the floor', () => {
  const rels = [0, 7, 30, 60, 120, 365].map(projectionRel)
  for (let i = 1; i < rels.length; i++) assert.ok(rels[i] <= rels[i - 1], 'rel must be non-increasing')
  assert.ok(Math.abs(rels[0] - CONST.UNCERTAINTY.REL_BASE) < 1e-9, 'starts at REL_BASE')
  assert.ok(rels.at(-1) >= CONST.UNCERTAINTY.REL_FLOOR - 1e-9, 'never below the floor')
})

test('projectionBand: lo < hi, centred on the value, honours minAbs', () => {
  const b = projectionBand(2.4, 0)
  assert.ok(b.lo < 2.4 && b.hi > 2.4)
  assert.ok(Math.abs((b.lo + b.hi) / 2 - 2.4) < 1e-9)
  const z = projectionBand(0, 999, 0.2) // value 0 but minAbs keeps it visible
  assert.ok(z.half >= 0.2)
})

test('computeDaily: no logs → zero cumulatives, no NaN', () => {
  const d = computeDaily(DEFAULT_INPUTS, DEFAULT_PLAN, {}, [], computePlan(DEFAULT_INPUTS, DEFAULT_PLAN))
  assert.equal(d.cumMuscle, 0)
  assert.equal(d.cumWeight, 0)
  assert.equal(d.whole.daysLogged, 0)
  assert.ok(d.rows.every(r => Number.isFinite(r.volRolling7)))
})

test('computeDaily: a logged day produces finite rollups', () => {
  const planRes = computePlan(DEFAULT_INPUTS, DEFAULT_PLAN)
  const dailyLog = { 1: { calories: 2200, protein: 150, weight: 89.5, steps: 8000, cardioMins: 20 } }
  const d = computeDaily(DEFAULT_INPUTS, DEFAULT_PLAN, dailyLog, [], planRes)
  assert.equal(d.whole.daysLogged, 1)
  assert.ok(Number.isFinite(d.cumFat))
  assert.ok(Number.isFinite(d.whole.avgCalories))
})

test('buildCoachContext includes the analyst read only when insights are passed', () => {
  const planRes = computePlan(DEFAULT_INPUTS, DEFAULT_PLAN)
  const daily = computeDaily(DEFAULT_INPUTS, DEFAULT_PLAN, {}, [], planRes)
  const strength = computeStrength(DEFAULT_PLAN, [])
  const bare = buildCoachContext(DEFAULT_INPUTS, DEFAULT_PLAN, planRes, daily, strength)
  assert.ok(!bare.includes("ANALYST'S READ"))
  const withRead = buildCoachContext(DEFAULT_INPUTS, DEFAULT_PLAN, planRes, daily, strength, null, [{ tone: 'note', title: 'X', text: 'y' }])
  assert.ok(withRead.includes("ANALYST'S READ"))
})
