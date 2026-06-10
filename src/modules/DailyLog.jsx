import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, fmt } from '../components/ui.jsx'

export default function DailyLog() {
  const { state, setDailyLog, daily } = useStore()
  const days = Math.max(1, parseInt(state.inputs.periodDays) || 1)
  const byDay = Object.fromEntries(daily.rows.map(r => [r.dayNum, r]))
  const [showAll, setShowAll] = useState(false)

  const start = new Date(state.inputs.startDate)
  const todayNum = Number.isFinite(start.getTime())
    ? Math.min(days, Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1))
    : days
  const RECENT = 14
  const firstShown = showAll ? 1 : Math.max(1, todayNum - RECENT + 1)
  const dayList = []
  for (let d = todayNum; d >= firstShown; d--) dayList.push(d) // newest first

  // Plain render helpers (called, NOT used as <Component/>) so the inputs keep
  // focus across re-renders — an inner component would remount every keystroke.
  const field = (d, k, label) => (
    <label className="dl-field" key={k}>
      <span className="dl-k">{label}</span>
      <input type="number" inputMode="decimal" value={state.dailyLog[d]?.[k] ?? ''} onChange={e => setDailyLog(d, { [k]: e.target.value })} />
    </label>
  )
  const tcell = (d, k, w = 70) => (
    <td><input style={{ width: w }} type="number" inputMode="decimal" value={state.dailyLog[d]?.[k] ?? ''} onChange={e => setDailyLog(d, { [k]: e.target.value })} /></td>
  )

  return (
    <>
      <PageHead eyebrow="Log" title="Daily Log" sub="Your daily journal — log yesterday's numbers and the calculated values update as you go." />

      {/* Mobile: a card per day, newest first */}
      <div className="only-mobile dl-cards">
        {dayList.map(d => {
          const c = byDay[d] || {}
          return (
            <Card key={d} className="dl-card">
              <div className="dl-head">
                <span className="dl-day">Day {d}{d === todayNum && <span className="dl-today">Today</span>}</span>
                <span className="faint">{c.iso ? c.iso.slice(5) : ''}</span>
              </div>
              <div className="dl-grid">
                {field(d, 'calories', 'Calories')}
                {field(d, 'protein', 'Protein (g)')}
                {field(d, 'weight', 'Weight (kg)')}
                {field(d, 'steps', 'Steps')}
                {field(d, 'cardioMins', 'Cardio (min)')}
              </div>
              {c.logged && (
                <div className="dl-calc">
                  <span>Balance <b className={c.deficit < 0 ? 'pos' : c.deficit > 0 ? 'neg' : ''}>{c.deficit != null ? fmt(c.deficit, 0, true) : '–'}</b></span>
                  <span>Cum. fat <b>{fmt(c.cumFat, 2, true)}</b></span>
                  <span>Cum. muscle <b>{fmt(c.cumMuscle, 2, true)}</b></span>
                </div>
              )}
            </Card>
          )
        })}
        {!showAll && todayNum > RECENT && <button className="btn ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setShowAll(true)}>Show all {days} days</button>}
        {showAll && <button className="btn ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setShowAll(false)}>Show recent only</button>}
      </div>

      {/* Desktop: the full spreadsheet-style table */}
      <div className="only-desktop">
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
                      {tcell(d, 'cardioMins')}{tcell(d, 'steps', 84)}{tcell(d, 'calories', 84)}{tcell(d, 'protein')}{tcell(d, 'weight')}
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
      </div>
    </>
  )
}
