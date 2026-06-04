import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Pill, fmt } from '../components/ui.jsx'
import { ALL_TRACKING } from '../lib/configurator.js'

// Metric columns, each tied to a tracking key so a system can switch it off.
const COLS = [
  { k: 'cardioMins', label: 'Cardio (min)', track: 'cardio', w: 70 },
  { k: 'steps', label: 'Steps', track: 'steps', w: 84 },
  { k: 'calories', label: 'Calories', track: 'calories', w: 84 },
  { k: 'protein', label: 'Protein (g)', track: 'protein', w: 70 },
  { k: 'weight', label: 'Weight (kg)', track: 'weight', w: 70 },
]

export default function DailyLog() {
  const { state, setDailyLog, daily } = useStore()
  const tracking = state.tracking || ALL_TRACKING
  const days = Math.max(1, parseInt(state.inputs.periodDays) || 1)
  const byDay = Object.fromEntries(daily.rows.map(r => [r.dayNum, r]))
  const cols = COLS.filter(c => tracking[c.track])
  const showDeficit = tracking.calories
  const showMuscle = tracking.muscleEstimation

  const Cell = ({ d, k, w = 70 }) => (
    <td><input style={{ width: w }} type="number" value={state.dailyLog[d]?.[k] ?? ''} onChange={e => setDailyLog(d, { [k]: e.target.value })} /></td>
  )
  return (
    <>
      <PageHead eyebrow="Log · 3" title="Daily Log" sub="Your daily journal. Log yesterday's numbers. Calculated columns update as you go." />
      {cols.length === 0 ? (
        <Card><span className="muted">Your system tracks workouts only, so there's nothing to log here. Record your sets in the <strong>Workout Log</strong>, or switch on bodyweight / calorie tracking in Settings to use this daily journal.</span></Card>
      ) : (
      <>
      {!showMuscle && (
        <Card style={{ marginBottom: 18 }}>
          <Pill tone="muted">Your system tracks lightly — muscle &amp; fat estimation is off. Turn on calorie + bodyweight tracking in Settings to unlock it.</Pill>
        </Card>
      )}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr>
              <th>Day</th><th>Date</th>
              {cols.map(c => <th key={c.k}>{c.label}</th>)}
              {showDeficit && <th>Deficit/surplus</th>}
              {showMuscle && <th>Cum. fat</th>}
              {showMuscle && <th>Cum. muscle</th>}
            </tr></thead>
            <tbody>
              {Array.from({ length: days }, (_, idx) => {
                const d = idx + 1, c = byDay[d] || {}
                return (
                  <tr key={d}>
                    <td className="faint">{d}</td>
                    <td className="faint" style={{ whiteSpace: 'nowrap' }}>{c.iso ? c.iso.slice(5) : ''}</td>
                    {cols.map(col => <Cell key={col.k} d={d} k={col.k} w={col.w} />)}
                    {showDeficit && <td className={c.deficit < 0 ? 'pos' : c.deficit > 0 ? 'neg' : 'faint'}>{c.deficit != null ? fmt(c.deficit, 0, true) : ''}</td>}
                    {showMuscle && <td className="faint">{c.logged ? fmt(c.cumFat, 2, true) : ''}</td>}
                    {showMuscle && <td className="faint">{c.logged ? fmt(c.cumMuscle, 2, true) : ''}</td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      </>
      )}
    </>
  )
}
