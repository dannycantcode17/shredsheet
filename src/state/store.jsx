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
})

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => ({ ...seed(), ...(loadState() || {}) }))
  // First run lands on Inputs; anyone with existing data (or who finished
  // onboarding) opens straight on the dashboard.
  const [view, setView] = useState(() => {
    const s = loadState()
    const seen = s && (s.onboarded || Object.keys(s.dailyLog || {}).length > 0 || (s.workoutLog || []).length > 0)
    return seen ? 'dashboard' : 'inputs'
  })

  useEffect(() => { saveState(state) }, [state])

  const api = useMemo(() => ({
    setInputs: (patch) => setState(s => ({ ...s, inputs: { ...s.inputs, ...patch } })),
    setPlan: (plan) => setState(s => ({ ...s, plan })),
    setDailyLog: (dayNum, patch) => setState(s => ({ ...s, dailyLog: { ...s.dailyLog, [dayNum]: { ...(s.dailyLog[dayNum] || {}), ...patch } } })),
    setWorkoutLog: (workoutLog) => setState(s => ({ ...s, workoutLog })),
    setApiKey: (apiKey) => setState(s => ({ ...s, apiKey })),
    setOnboarded: (v) => setState(s => ({ ...s, onboarded: v })),
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
