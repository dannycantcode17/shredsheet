import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card } from '../components/ui.jsx'
import { epley1RM } from '../lib/engine.js'

const ddmm = (iso) => { if (!iso) return ''; const [, m, d] = iso.split('-'); return `${d}/${m}` }

// An in-progress workout. Started from the Gym Plan (sets pre-filled from the
// day) or "free" (empty). You fill actual weight/reps, can swap or add
// exercises, then finish — every completed set is written to workoutLog, which
// feeds computeStrength + computeDaily exactly as before.
function WorkoutSession({ session }) {
  const { state, setWorkoutLog, setActiveSession } = useStore()
  const allExercises = [...new Set(state.plan.flatMap(d => d.exercises.map(e => e.name).filter(Boolean)))]

  const [ex, setEx] = useState(() =>
    (session.exercises && session.exercises.length ? session.exercises : [{ name: '', sets: 3, goalWeight: '', goalReps: '' }])
      .map(e => ({
        name: e.name || '',
        goalWeight: e.goalWeight ?? '',
        goalReps: e.goalReps ?? '',
        sets: Array.from({ length: Math.max(1, parseInt(e.sets) || 3) }, () => ({ weight: '', reps: '', rir: '' })),
      }))
  )
  const upd = (xi, fn) => setEx(list => list.map((e, i) => i !== xi ? e : fn(e)))
  const setName = (xi, name) => upd(xi, e => ({ ...e, name }))
  const setSet = (xi, si, patch) => upd(xi, e => ({ ...e, sets: e.sets.map((s, j) => j !== si ? s : { ...s, ...patch }) }))
  const addSet = (xi) => upd(xi, e => ({ ...e, sets: [...e.sets, { weight: '', reps: '', rir: '' }] }))
  const rmSet = (xi, si) => upd(xi, e => ({ ...e, sets: e.sets.filter((_, j) => j !== si) }))
  const addEx = () => setEx(list => [...list, { name: '', goalWeight: '', goalReps: '', sets: [0, 0, 0].map(() => ({ weight: '', reps: '', rir: '' })) }])
  const rmEx = (xi) => setEx(list => list.filter((_, i) => i !== xi))

  const completed = ex.reduce((n, e) => n + (e.name.trim() ? e.sets.filter(s => s.weight !== '' && s.reps !== '').length : 0), 0)
  const finish = () => {
    const today = new Date().toISOString().slice(0, 10)
    const newSets = []
    ex.forEach(e => {
      if (!e.name.trim()) return
      e.sets.forEach(s => {
        if (s.weight !== '' && s.reps !== '') newSets.push({ date: today, day: session.day || '', exercise: e.name.trim(), weight: s.weight, reps: s.reps, rir: s.rir, tempo: '', comments: '' })
      })
    })
    if (newSets.length) setWorkoutLog([...state.workoutLog, ...newSets])
    setActiveSession(null)
  }
  const cancel = () => { if (completed === 0 || confirm('Discard this workout?')) setActiveSession(null) }

  return (
    <>
      <PageHead eyebrow="Workout" title={session.day || 'Free workout'} sub="Enter what you lift. Swap or add an exercise if you need to, then finish to save it to your log." />
      <Card>
        {ex.map((e, xi) => (
          <div className="ws-ex" key={xi}>
            <div className="ws-ex-head">
              <input className="ws-ex-name" list="ws-ex-list" placeholder="Exercise" value={e.name} onChange={ev => setName(xi, ev.target.value)} />
              <button className="ws-x" onClick={() => rmEx(xi)} aria-label="Remove exercise">✕</button>
            </div>
            {e.sets.map((s, si) => (
              <div className="ws-set" key={si}>
                <span className="ws-n">Set {si + 1}</span>
                <input type="number" placeholder={e.goalWeight !== '' && e.goalWeight != null ? `${e.goalWeight}` : 'kg'} value={s.weight} onChange={ev => setSet(xi, si, { weight: ev.target.value })} />
                <input type="number" placeholder={e.goalReps !== '' && e.goalReps != null ? `${e.goalReps}` : 'reps'} value={s.reps} onChange={ev => setSet(xi, si, { reps: ev.target.value })} />
                <input type="number" placeholder="RIR" value={s.rir} onChange={ev => setSet(xi, si, { rir: ev.target.value })} />
                <button className="ws-x" onClick={() => rmSet(xi, si)} aria-label="Remove set">✕</button>
              </div>
            ))}
            <button className="ws-addset" onClick={() => addSet(xi)}>+ Add set</button>
          </div>
        ))}
        <datalist id="ws-ex-list">{allExercises.map(x => <option key={x} value={x} />)}</datalist>
        <button className="btn ghost" onClick={addEx} style={{ marginTop: 4 }}>+ Add exercise</button>
        <div className="divider" />
        <div className="btn-row">
          <button className="btn primary" onClick={finish} disabled={completed === 0}>Finish workout{completed ? ` · ${completed} sets` : ''}</button>
          <button className="btn ghost" onClick={cancel}>Cancel</button>
        </div>
      </Card>
    </>
  )
}

// Phone-first workout log: start a session (free, or from the plan), and review
// past workouts as horizontal day cards. Same workoutLog model + 1RM maths.
export default function WorkoutLog() {
  const { state, setWorkoutLog, setActiveSession } = useStore()
  if (state.activeSession) return <WorkoutSession session={state.activeSession} />

  const log = state.workoutLog
  const del = (i) => setWorkoutLog(log.filter((_, j) => j !== i))
  const freeStart = () => setActiveSession({ day: '', exercises: [] })

  const byDate = {}
  log.forEach((r, i) => { (byDate[r.date] ||= []).push({ r, i }) })
  const dates = Object.keys(byDate).sort((a, b) => (a < b ? 1 : -1))

  return (
    <>
      <PageHead eyebrow="Log" title="Workout Log" sub="Start a session here, or tap Start on a day in your Gym Plan. Everything you log feeds your strength and volume tracking." />
      <div className="btn-row" style={{ marginBottom: 16 }}>
        <button className="btn primary" onClick={freeStart}>+ Start a free workout</button>
      </div>

      {!dates.length && <Card><p className="faint" style={{ margin: 0 }}>No workouts logged yet. Start one above, or from your Gym Plan.</p></Card>}
      {dates.length > 0 && (
        <div className="wl-scroll">
          {dates.map(date => {
            const sets = byDate[date]
            return (
              <Card key={date}>
                <div className="wl-date">{ddmm(date)}{sets[0].r.day ? ` · ${sets[0].r.day}` : ''}</div>
                {sets.map(({ r, i }) => {
                  const oneRm = r.weight !== '' && r.reps !== '' ? epley1RM(r.weight, r.reps, r.rir).toFixed(1) : null
                  return (
                    <div className="wl-set" key={i}>
                      <div style={{ minWidth: 0 }}>
                        <div className="wl-ex">{r.exercise}</div>
                        <div className="wl-meta">{r.weight || '–'}kg × {r.reps || '–'}{r.rir !== '' && r.rir != null ? ` · ${r.rir} RIR` : ''}</div>
                      </div>
                      <div className="wl-right">
                        {oneRm && <div className="wl-1rm accent">{oneRm}<small>est 1RM</small></div>}
                        <button className="gp-x" onClick={() => del(i)} aria-label="Delete set">✕</button>
                      </div>
                    </div>
                  )
                })}
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
