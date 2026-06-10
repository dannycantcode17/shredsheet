import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_INPUTS, DEFAULT_PLAN } from '../lib/defaults.js'
import { loadState, saveState } from '../lib/storage.js'
import { computePlan, computeStrength, computeDaily } from '../lib/engine.js'
import { fetchSteps } from '../lib/health.js'

const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

const seed = () => ({
  inputs: { ...DEFAULT_INPUTS },
  plan: DEFAULT_PLAN,
  dailyLog: {},          // { [dayNum]: {cardioMins, steps, calories, protein, weight} }
  workoutLog: [],        // [{date, day, exercise, weight, reps, rir, tempo, comments}]
  apiKey: '',
  onboarded: false,
  stepsToken: '',        // links the app to the Apple Health steps Shortcut
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

  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state })
  useEffect(() => { saveState(state) }, [state])

  const api = useMemo(() => ({
    setInputs: (patch) => setState(s => ({ ...s, inputs: { ...s.inputs, ...patch } })),
    setPlan: (plan) => setState(s => ({ ...s, plan })),
    setDailyLog: (dayNum, patch) => setState(s => ({ ...s, dailyLog: { ...s.dailyLog, [dayNum]: { ...(s.dailyLog[dayNum] || {}), ...patch } } })),
    setWorkoutLog: (workoutLog) => setState(s => ({ ...s, workoutLog })),
    setApiKey: (apiKey) => setState(s => ({ ...s, apiKey })),
    setOnboarded: (v) => setState(s => ({ ...s, onboarded: v })),
    setStepsToken: (stepsToken) => setState(s => ({ ...s, stepsToken })),
    // pull steps from the Health bridge and merge into the day log; returns days merged
    syncSteps: async (token) => {
      const byDate = await fetchSteps(token || stateRef.current.stepsToken)
      const start = Date.parse(stateRef.current.inputs.startDate)
      const days = Math.max(1, parseInt(stateRef.current.inputs.periodDays) || 1)
      if (!Number.isFinite(start)) return 0
      const patch = {}
      for (const [date, n] of Object.entries(byDate || {})) {
        const dayNum = Math.floor((Date.parse(date) - start) / 86400000) + 1
        if (dayNum >= 1 && dayNum <= days && Number.isFinite(+n)) patch[dayNum] = Math.round(+n)
      }
      const count = Object.keys(patch).length
      if (count) setState(s => {
        const dailyLog = { ...s.dailyLog }
        for (const [dayNum, steps] of Object.entries(patch)) dailyLog[dayNum] = { ...(dailyLog[dayNum] || {}), steps }
        return { ...s, dailyLog }
      })
      return count
    },
    replaceState: (next) => setState({ ...seed(), ...next }),
    reset: () => setState(seed()),
  }), [])

  // recompute the whole engine whenever inputs/plan/logs change
  const planRes = useMemo(() => computePlan(state.inputs, state.plan), [state.inputs, state.plan])
  const strength = useMemo(() => computeStrength(state.plan, state.workoutLog), [state.plan, state.workoutLog])
  const daily = useMemo(() => computeDaily(state.inputs, state.plan, state.dailyLog, state.workoutLog, planRes),
    [state.inputs, state.plan, state.dailyLog, state.workoutLog, planRes])

  // On load, if a Health sync token is set, pull steps in the background.
  useEffect(() => { if (state.stepsToken) api.syncSteps(state.stepsToken) }, [state.stepsToken]) // eslint-disable-line react-hooks/exhaustive-deps

  const value = { state, ...api, view, setView, planRes, strength, daily }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}
