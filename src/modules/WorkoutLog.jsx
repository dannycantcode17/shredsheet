import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Field } from '../components/ui.jsx'
import { epley1RM } from '../lib/engine.js'

const ddmm = (iso) => { if (!iso) return ''; const [, m, d] = iso.split('-'); return `${d}/${m}` }

// Phone-first logging: a quick entry card at the top, then your recent sets as
// a list grouped by date. Same workoutLog data model and 1RM maths as before.
export default function WorkoutLog() {
  const { state, setWorkoutLog } = useStore()
  const log = state.workoutLog
  const dayNames = state.plan.filter(d => d.name).map(d => d.name)
  const exercises = [...new Set(state.plan.flatMap(d => d.exercises.map(e => e.name).filter(Boolean)))]

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    day: dayNames[0] || '', exercise: '', weight: '', reps: '', rir: '', tempo: '',
  })
  const set = (patch) => setForm(f => ({ ...f, ...patch }))
  const canAdd = form.exercise.trim() && form.weight !== '' && form.reps !== ''
  const add = () => {
    if (!canAdd) return
    setWorkoutLog([...log, { ...form, exercise: form.exercise.trim(), comments: '' }])
    set({ weight: '', reps: '', rir: '', tempo: '' }) // keep date/day/exercise for fast repeat logging
  }
  const del = (i) => setWorkoutLog(log.filter((_, j) => j !== i))

  // most-recent first; group by date
  const rows = log.map((r, i) => ({ r, i })).sort((a, b) => (a.r.date < b.r.date ? 1 : a.r.date > b.r.date ? -1 : b.i - a.i))

  return (
    <>
      <PageHead eyebrow="Log" title="Workout Log" sub="Log your sets as you go. One row per set — it feeds your strength and volume tracking." />

      <Card style={{ marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Log a set</div>
        <Field label="Exercise">
          <input list="wl-exercises" placeholder="Pick or type an exercise" value={form.exercise} onChange={e => set({ exercise: e.target.value })} />
          <datalist id="wl-exercises">{exercises.map(x => <option key={x} value={x} />)}</datalist>
        </Field>
        <div className="wl-grid" style={{ marginBottom: 16 }}>
          <Field label="Weight (kg)"><input type="number" value={form.weight} onChange={e => set({ weight: e.target.value })} /></Field>
          <Field label="Reps"><input type="number" value={form.reps} onChange={e => set({ reps: e.target.value })} /></Field>
          <Field label="RIR"><input type="number" value={form.rir} onChange={e => set({ rir: e.target.value })} /></Field>
          <Field label="Tempo"><input type="number" value={form.tempo} onChange={e => set({ tempo: e.target.value })} /></Field>
        </div>
        <div className="wl-grid" style={{ marginBottom: 16 }}>
          <Field label="Date"><input type="date" value={form.date} onChange={e => set({ date: e.target.value })} /></Field>
          <Field label="Day"><select value={form.day} onChange={e => set({ day: e.target.value })}><option value="">—</option>{dayNames.map(d => <option key={d}>{d}</option>)}</select></Field>
        </div>
        <button className="btn primary" onClick={add} disabled={!canAdd}>Add set</button>
      </Card>

      <Card>
        <div className="eyebrow">Recent sets</div>
        {!rows.length && <p className="faint" style={{ marginTop: 12 }}>No sets logged yet. Add your first one above.</p>}
        {rows.map(({ r, i }, idx) => {
          const showDate = idx === 0 || rows[idx - 1].r.date !== r.date
          const oneRm = r.weight !== '' && r.reps !== '' ? epley1RM(r.weight, r.reps, r.rir).toFixed(1) : null
          return (
            <React.Fragment key={i}>
              {showDate && <div className="wl-date">{ddmm(r.date) || 'No date'}{r.day ? ` · ${r.day}` : ''}</div>}
              <div className="wl-set">
                <div style={{ minWidth: 0 }}>
                  <div className="wl-ex">{r.exercise}</div>
                  <div className="wl-meta">
                    {r.weight || '–'}kg × {r.reps || '–'}
                    {r.rir !== '' && r.rir != null ? ` · ${r.rir} RIR` : ''}
                    {r.tempo !== '' && r.tempo != null ? ` · tempo ${r.tempo}` : ''}
                  </div>
                </div>
                <div className="wl-right">
                  {oneRm && <div className="wl-1rm accent">{oneRm}<small>est 1RM</small></div>}
                  <button className="gp-x" onClick={() => del(i)} aria-label="Delete set">✕</button>
                </div>
              </div>
            </React.Fragment>
          )
        })}
      </Card>
    </>
  )
}
