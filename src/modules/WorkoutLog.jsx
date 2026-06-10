import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card } from '../components/ui.jsx'
import { epley1RM } from '../lib/engine.js'

export default function WorkoutLog() {
  const { state, setWorkoutLog } = useStore()
  const log = state.workoutLog
  const dayNames = state.plan.filter(d => d.name).map(d => d.name)
  const exercises = [...new Set(state.plan.flatMap(d => d.exercises.map(e => e.name).filter(Boolean)))]
  const update = (i, patch) => setWorkoutLog(log.map((r, j) => j !== i ? r : { ...r, ...patch }))
  const addRow = () => setWorkoutLog([...log, { date: new Date().toISOString().slice(0, 10), day: dayNames[0] || '', exercise: '', weight: '', reps: '', rir: '', tempo: '', comments: '' }])
  const del = (i) => setWorkoutLog(log.filter((_, j) => j !== i))
  return (
    <>
      <PageHead eyebrow="Log" title="Workout Log" sub="One row per set. The detail powers volume, calorie burn, muscle and strength tracking." />
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr>
              <th>Date</th><th>Split day</th><th>Exercise</th><th style={{ width: 80 }}>Weight</th><th style={{ width: 64 }}>Reps</th><th style={{ width: 60 }}>RIR</th><th style={{ width: 70 }}>Tempo</th><th style={{ width: 70 }}>est. 1RM</th><th></th>
            </tr></thead>
            <tbody>
              {log.map((r, i) => (
                <tr key={i}>
                  <td><input type="date" style={{ width: 140 }} value={r.date} onChange={e => update(i, { date: e.target.value })} /></td>
                  <td><select value={r.day} onChange={e => update(i, { day: e.target.value })}><option value="">—</option>{dayNames.map(d => <option key={d}>{d}</option>)}</select></td>
                  <td><select value={r.exercise} onChange={e => update(i, { exercise: e.target.value })}><option value="">—</option>{exercises.map(x => <option key={x}>{x}</option>)}</select></td>
                  <td><input type="number" inputMode="decimal" value={r.weight} onChange={e => update(i, { weight: e.target.value })} /></td>
                  <td><input type="number" inputMode="decimal" value={r.reps} onChange={e => update(i, { reps: e.target.value })} /></td>
                  <td><input type="number" inputMode="numeric" value={r.rir} onChange={e => update(i, { rir: e.target.value })} /></td>
                  <td><input type="number" inputMode="numeric" value={r.tempo} onChange={e => update(i, { tempo: e.target.value })} /></td>
                  <td className="accent">{r.weight && r.reps ? epley1RM(r.weight, r.reps, r.rir).toFixed(1) : ''}</td>
                  <td><button className="btn ghost" style={{ padding: '8px 12px' }} onClick={() => del(i)} aria-label="Delete set">✕</button></td>
                </tr>
              ))}
              {!log.length && <tr><td colSpan={9} className="faint" style={{ padding: 18 }}>No sets logged yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 14 }}><button className="btn primary" onClick={addRow}>+ Add set</button></div>
      </Card>
    </>
  )
}
