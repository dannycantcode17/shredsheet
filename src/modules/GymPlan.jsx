import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Pill } from '../components/ui.jsx'

export default function GymPlan() {
  const { state, setPlan, planRes } = useStore()
  const updateEx = (di, ei, patch) => setPlan(state.plan.map((d, idx) => idx !== di ? d : { ...d, exercises: d.exercises.map((e, j) => j !== ei ? e : { ...e, ...patch }) }))
  const updateName = (di, name) => setPlan(state.plan.map((d, idx) => idx !== di ? d : { ...d, name }))
  return (
    <>
      <PageHead eyebrow="Setup" title="Gym Plan" sub="Define your training days. Name a day to activate it. Add goal weight + reps for your key lifts to set strength targets." />
      <div style={{ marginBottom: 18 }}><Pill tone="muted">{planRes.plannedSets} planned sets across the split</Pill></div>
      {state.plan.map((day, di) => (
        <Card key={di} style={{ marginBottom: 16 }}>
          <div className="row-between" style={{ marginBottom: 12 }}>
            <input style={{ maxWidth: 280, fontWeight: 700 }} placeholder={`Day ${di + 1} — name it to activate (e.g. PUSH)`} value={day.name} onChange={e => updateName(di, e.target.value)} />
          </div>
          {day.name && (
            <table className="tbl">
              <thead><tr><th style={{ width: 30 }}>#</th><th>Exercise</th><th style={{ width: 90 }}>Compound</th><th style={{ width: 80 }}>Sets</th><th style={{ width: 110 }}>Goal wt (kg)</th><th style={{ width: 90 }}>Reps for</th></tr></thead>
              <tbody>
                {day.exercises.map((e, ei) => (
                  <tr key={ei}>
                    <td className="faint">{ei + 1}</td>
                    <td><input value={e.name} onChange={ev => updateEx(di, ei, { name: ev.target.value })} placeholder="—" /></td>
                    <td style={{ textAlign: 'center' }}><input type="checkbox" style={{ width: 'auto' }} checked={!!e.compound} onChange={ev => updateEx(di, ei, { compound: ev.target.checked })} /></td>
                    <td><input type="number" value={e.sets} onChange={ev => updateEx(di, ei, { sets: ev.target.value })} /></td>
                    <td><input type="number" value={e.goalWeight} onChange={ev => updateEx(di, ei, { goalWeight: ev.target.value })} /></td>
                    <td><input type="number" value={e.goalReps} onChange={ev => updateEx(di, ei, { goalReps: ev.target.value })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      ))}
    </>
  )
}
