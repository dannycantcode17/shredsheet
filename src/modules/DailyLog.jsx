import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, fmt } from '../components/ui.jsx'

export default function DailyLog() {
  const { state, setDailyLog, daily } = useStore()
  const days = Math.max(1, parseInt(state.inputs.periodDays) || 1)
  const byDay = Object.fromEntries(daily.rows.map(r => [r.dayNum, r]))
  const Cell = ({ d, k, w = 70 }) => (
    <td><input style={{ width: w }} type="number" value={state.dailyLog[d]?.[k] ?? ''} onChange={e => setDailyLog(d, { [k]: e.target.value })} /></td>
  )
  return (
    <>
      <PageHead eyebrow="Log · 3" title="Daily Log" sub="Yesterday, by the numbers. Punch in what you ate, walked and weighed — the maths does its own homework in the calculated columns." />
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr>
              <th>Day</th><th>Date</th><th>Cardio (min)</th><th>Steps</th><th>Calories</th><th>Protein (g)</th><th>Weight (kg)</th>
              <th>Deficit/surplus</th><th>Cum. fat</th><th>Cum. muscle</th>
            </tr></thead>
            <tbody>
              {Array.from({ length: days }, (_, idx) => {
                const d = idx + 1, c = byDay[d] || {}
                return (
                  <tr key={d}>
                    <td className="faint">{d}</td>
                    <td className="faint" style={{ whiteSpace: 'nowrap' }}>{c.iso ? c.iso.slice(5) : ''}</td>
                    <Cell d={d} k="cardioMins" /><Cell d={d} k="steps" w={84} /><Cell d={d} k="calories" w={84} /><Cell d={d} k="protein" /><Cell d={d} k="weight" />
                    <td className={c.deficit < 0 ? 'pos' : c.deficit > 0 ? 'neg' : 'faint'}>{c.deficit != null ? fmt(c.deficit, 0, true) : ''}</td>
                    <td className="faint">{c.logged ? fmt(c.cumFat, 2, true) : ''}</td>
                    <td className="faint">{c.logged ? fmt(c.cumMuscle, 2, true) : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
