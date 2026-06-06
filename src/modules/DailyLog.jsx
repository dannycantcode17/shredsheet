import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Pill, fmt } from '../components/ui.jsx'
import { estimateCalories } from '../lib/ai.js'

// D1 — describe a meal, get a rough AI calorie estimate, drop it into the
// day's calories field. No food database; this is a ballpark, never precise.
function MealEstimator({ days }) {
  const { state, setDailyLog } = useStore()
  const today = Math.floor((Date.parse(new Date().toISOString().slice(0, 10)) - Date.parse(state.inputs.startDate)) / 86400000) + 1
  const [day, setDay] = useState(today >= 1 && today <= days ? today : 1)
  const [desc, setDesc] = useState('')
  const [busy, setBusy] = useState(false)
  const [est, setEst] = useState('')
  const [err, setErr] = useState('')

  const run = async () => {
    if (!desc.trim() || busy) return
    setBusy(true); setErr(''); setEst('')
    try {
      const kcal = await estimateCalories({ description: desc, apiKey: state.apiKey })
      if (kcal == null) setErr("Couldn't get a number back — is the coach connected? Check Settings.")
      else setEst(String(kcal))
    } catch (e) { setErr('⚠️ ' + e.message) } finally { setBusy(false) }
  }
  const add = () => {
    const v = Math.round(parseFloat(est) || 0)
    if (!v) return
    const current = parseFloat(state.dailyLog[day]?.calories) || 0
    setDailyLog(day, { calories: Math.round(current + v) })
    setEst(''); setDesc('')
  }

  return (
    <Card style={{ marginBottom: 18 }}>
      <div className="eyebrow">Not sure of the calories? Describe it.</div>
      <p className="muted" style={{ margin: '8px 0 14px', fontSize: 14 }}>
        Tell the coach what you ate — "two eggs, toast and a flat white" — and it'll have a guess.
      </p>
      <textarea rows={2} placeholder="e.g. chicken burrito bowl with rice, beans, guac and cheese"
        value={desc} onChange={e => setDesc(e.target.value)} />
      <div className="btn-row" style={{ marginTop: 12, alignItems: 'center' }}>
        <button className="btn primary" onClick={run} disabled={busy || !desc.trim()}>
          {busy ? 'Estimating…' : '✨ Estimate calories'}
        </button>
        <span className="faint" style={{ fontSize: 13 }}>Add to day</span>
        <input type="number" style={{ width: 80 }} value={day}
          onChange={e => setDay(Math.min(days, Math.max(1, parseInt(e.target.value) || 1)))} />
      </div>

      {err && <div style={{ marginTop: 12 }}><Pill tone="bad">{err}</Pill></div>}
      {est !== '' && (
        <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="muted" style={{ fontSize: 14 }}>Best guess:</span>
          <input type="number" style={{ width: 110 }} value={est} onChange={e => setEst(e.target.value)} />
          <span className="faint">kcal</span>
          <button className="btn" onClick={add}>+ Add to day {day}</button>
        </div>
      )}

      <div className="divider" />
      <Pill tone="warn">⚠ Rough AI estimate, not gospel</Pill>
      <p className="faint" style={{ margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.5 }}>
        It can't see your portions or the chef's olive oil habit, so treat it as a ballpark. Tweak the number
        before adding, or just log your actual calories when you know them.
      </p>
    </Card>
  )
}

export default function DailyLog() {
  const { state, setDailyLog, daily } = useStore()
  const days = Math.max(1, parseInt(state.inputs.periodDays) || 1)
  const byDay = Object.fromEntries(daily.rows.map(r => [r.dayNum, r]))
  return (
    <>
      <PageHead eyebrow="Log · 3" title="Daily Log" sub="Yesterday, by the numbers. Punch in what you ate, walked and weighed — the maths does its own homework in the calculated columns." />
      <MealEstimator days={days} />
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
                    <td><input style={{ width: 70 }} type="number" value={state.dailyLog[d]?.cardioMins ?? ''} onChange={e => setDailyLog(d, { cardioMins: e.target.value })} /></td>
                    <td><input style={{ width: 84 }} type="number" value={state.dailyLog[d]?.steps ?? ''} onChange={e => setDailyLog(d, { steps: e.target.value })} /></td>
                    <td><input style={{ width: 84 }} type="number" value={state.dailyLog[d]?.calories ?? ''} onChange={e => setDailyLog(d, { calories: e.target.value })} /></td>
                    <td><input style={{ width: 70 }} type="number" value={state.dailyLog[d]?.protein ?? ''} onChange={e => setDailyLog(d, { protein: e.target.value })} /></td>
                    <td><input style={{ width: 70 }} type="number" value={state.dailyLog[d]?.weight ?? ''} onChange={e => setDailyLog(d, { weight: e.target.value })} /></td>
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
