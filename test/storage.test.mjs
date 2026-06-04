import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeState } from '../src/lib/storage.js'

test('normalizeState rejects non-object blobs (import refused, no wipe)', () => {
  for (const bad of [[1, 2, 3], 42, null, 'hi', undefined, true]) {
    assert.equal(normalizeState(bad), null)
  }
})

test('normalizeState drops malformed sub-fields so they fall back to defaults', () => {
  const n = normalizeState({ inputs: null, plan: 'nope', dailyLog: [], workoutLog: {}, onboarded: true })
  assert.deepEqual(n, { onboarded: true })
})

test('normalizeState preserves a well-formed state', () => {
  const good = { inputs: { startWeightKg: 80 }, plan: [], dailyLog: {}, workoutLog: [], tracking: null, onboarded: true }
  assert.deepEqual(normalizeState(good), good)
})

test('normalizeState allows tracking to be null or an object, not other', () => {
  assert.ok(!('tracking' in normalizeState({ tracking: 5 })))
  assert.equal(normalizeState({ tracking: null }).tracking, null)
  assert.deepEqual(normalizeState({ tracking: { calories: true } }).tracking, { calories: true })
})
