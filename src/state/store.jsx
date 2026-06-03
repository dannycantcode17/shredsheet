import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_INPUTS, DEFAULT_PLAN } from '../lib/defaults.js'
import { loadState, saveState } from '../lib/storage.js'
import { computePlan, computeStrength, computeDaily } from '../lib/engine.js'

const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

const seed = () => ({
  inputs: { ...DEFAULT_INPUTS },
  plan: DEFAULT_PLAN,
  dailyLog: {},          // { [dayNum]: {cardioMins, steps, calories, protein, weight} }
  workoutLog: [],        // [{date, day, exercise, weight, reps, rir, tempo, comments}]
  apiKey: '',
  onboarded: false,
  system: null,          // id of the configurator-assigned system (see lib/systems.js)
  tracking: null,        // { workouts, weight, calories, protein, steps, cardio, muscleEstimation }
})

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => ({ ...seed(), ...(loadState() || {}) }))
  const [view, setView] = useState('dashboard')

  useEffect(() => { saveState(state) }, [state])

  const api = useMemo(() => ({
    setInputs: (patch) => setState(s => ({ ...s, inputs: { ...s.inputs, ...patch } })),
    setPlan: (plan) => setState(s => ({ ...s, plan })),
    setDailyLog: (dayNum, patch) => setState(s => ({ ...s, dailyLog: { ...s.dailyLog, [dayNum]: { ...(s.dailyLog[dayNum] || {}), ...patch } } })),
    setWorkoutLog: (workoutLog) => setState(s => ({ ...s, workoutLog })),
    setApiKey: (apiKey) => setState(s => ({ ...s, apiKey })),
    setOnboarded: (v) => setState(s => ({ ...s, onboarded: v })),
    setTracking: (patch) => setState(s => ({ ...s, tracking: { ...(s.tracking || {}), ...patch } })),
    // The configurator's payload lands here: seed the inputs, record the
    // assigned system + tracking map, and mark onboarding done in one update.
    completeOnboarding: ({ systemId, inputsPatch, tracking }) => setState(s => ({
      ...s, inputs: { ...s.inputs, ...inputsPatch }, system: systemId, tracking, onboarded: true,
    })),
    // Re-run the wizard without wiping logged data.
    reconfigure: () => setState(s => ({ ...s, onboarded: false })),
    replaceState: (next) => setState({ ...seed(), ...next }),
    reset: () => setState(seed()),
  }), [])

  // recompute the whole engine whenever inputs/plan/logs change
  const planRes = useMemo(() => computePlan(state.inputs, state.plan), [state.inputs, state.plan])
  const strength = useMemo(() => computeStrength(state.plan, state.workoutLog), [state.plan, state.workoutLog])
  const daily = useMemo(() => computeDaily(state.inputs, state.plan, state.dailyLog, state.workoutLog, planRes),
    [state.inputs, state.plan, state.dailyLog, state.workoutLog, planRes])

  const value = { state, ...api, view, setView, planRes, strength, daily }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}
