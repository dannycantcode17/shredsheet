// Engine smoke test — run ONLY when src/lib/engine.js or src/lib/defaults.js
// changed (they're normally out of scope). Imports the engine directly (no
// React, no build) and asserts the core compute functions return finite, sane
// numbers on the default profile. Run from the repo root:
//   node .claude/skills/run-shredsheet/smoke-engine.mjs
import { computePlan, computeStrength, computeDaily } from '../../../src/lib/engine.js'
import { DEFAULT_INPUTS, DEFAULT_PLAN } from '../../../src/lib/defaults.js'

const fin = (x) => Number.isFinite(x)
const plan = computePlan(DEFAULT_INPUTS, DEFAULT_PLAN)
const strength = computeStrength(DEFAULT_PLAN, [])
const daily = computeDaily(DEFAULT_INPUTS, DEFAULT_PLAN, {}, [], plan)

const checks = [
  ['computePlan.calorieTarget > 0', fin(plan.calorieTarget) && plan.calorieTarget > 0],
  ['computePlan.tdee > 0', fin(plan.tdee) && plan.tdee > 0],
  ['computePlan.proteinTarget > 0', fin(plan.proteinTarget) && plan.proteinTarget > 0],
  ['computePlan.weightChange finite', fin(plan.weightChange)],
  ['computePlan.plannedSets > 0', fin(plan.plannedSets) && plan.plannedSets > 0],
  ['computeStrength.exercises is array', Array.isArray(strength.exercises)],
  ['computeDaily.rows length === plan.days', Array.isArray(daily.rows) && daily.rows.length === plan.days],
]

let ok = true
for (const [name, pass] of checks) { console.log(pass ? 'OK  ' : 'FAIL', name); if (!pass) ok = false }
console.log(`\nplan: target ${Math.round(plan.calorieTarget)}kcal · TDEE ${Math.round(plan.tdee)} · protein ${Math.round(plan.proteinTarget)}g · ${plan.plannedSets} sets · weightΔ ${plan.weightChange}kg`)
process.exit(ok ? 0 : 1)
