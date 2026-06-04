import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveInsights } from '../src/lib/insights.js'

const PLAN = { priority: 'Fat Loss', proteinTarget: 160, dailyDelta: -400, plannedSets: 60, days: 84 }
const FLAGS = { calories: true, protein: true, muscle: true }
const mk = (whole, cum = {}) => deriveInsights({
  planRes: PLAN,
  daily: { whole, cumWeight: cum.w ?? -2, cumFat: cum.f ?? -2.5, cumMuscle: cum.m ?? 0.5 },
  flags: FLAGS,
})

test('no data → a single gentle start nudge', () => {
  const out = deriveInsights({ planRes: PLAN, daily: { whole: { daysLogged: 0 } }, flags: FLAGS })
  assert.equal(out.length, 1)
  assert.match(out[0].title, /Start anywhere/)
})

test('always returns between 1 and 3 insights', () => {
  const out = mk({ daysLogged: 20, avgProtein: 110, avgDeficit: 120, setsPerWeek: 20, avgCalories: 2000 })
  assert.ok(out.length >= 1 && out.length <= 3)
})

test('low protein surfaces the cheapest-win insight', () => {
  const out = mk({ daysLogged: 10, avgProtein: 100, avgDeficit: -350, setsPerWeek: 58, avgCalories: 2000 })
  assert.ok(out.some(i => /Protein/.test(i.title)))
})

test('clean recomp is celebrated, never shamed', () => {
  const out = mk({ daysLogged: 14, avgProtein: 165, avgDeficit: -380, setsPerWeek: 58, avgCalories: 2000 }, { w: -1.5, f: -2, m: 0.6 })
  assert.ok(out.some(i => i.tone === 'good'))
})

test('recalibration nudges UP when weight moves faster than intake predicts', () => {
  // predicted ≈ (-400*20)/7700 + 0.5 ≈ -0.54kg; actual scale -3kg → faster
  const out = mk({ daysLogged: 20, avgProtein: 165, avgDeficit: -400, setsPerWeek: 58, avgCalories: 2000 }, { w: -3, f: -3.5, m: 0.5 })
  const rec = out.find(i => /scale and the model disagree/i.test(i.title))
  assert.ok(rec, 'expected a recalibration insight')
  assert.match(rec.text, /up/)
})

test('recalibration stays silent when on pace', () => {
  const out = mk({ daysLogged: 20, avgProtein: 165, avgDeficit: -200, setsPerWeek: 58, avgCalories: 2200 }, { w: -0.6, f: -1.1, m: 0.5 })
  assert.ok(!out.some(i => /scale and the model disagree/i.test(i.title)))
})

test('no insight ever shames (tone is only good/note/watch)', () => {
  const out = mk({ daysLogged: 30, avgProtein: 90, avgDeficit: 300, setsPerWeek: 10, avgCalories: 2600 }, { w: 1, f: 1.5, m: -0.2 })
  assert.ok(out.every(i => ['good', 'note', 'watch'].includes(i.tone)))
})
