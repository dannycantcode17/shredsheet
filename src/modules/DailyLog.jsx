import React, { useState, useRef } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Pill, fmt } from '../components/ui.jsx'
import { estimateCalories } from '../lib/ai.js'

// today's day-number within the period (1-based), or null if outside it
function todayDayNum(startDate) {
  const n = Math.floor((Date.parse(new Date().toISOString().slice(0, 10)) - Date.parse(startDate)) / 86400000) + 1
  return n
}
// YYYY-MM-DD -> DD/MM (English, day-first)
const ddmm = (iso) => { if (!iso) return ''; const [, m, d] = iso.split('-'); return `${d}/${m}` }
const weekdayOf = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'long' })
}

// D1 / item 12 — describe a meal, get an AI estimate, add it to the current day.
function MealEstimator({ day }) {
  const { state, setDailyLog } = useStore()
  const [desc, setDesc] = useState('')
  const [busy, setBusy] = useState(false)
  const [est, setEst] = useState('')
  const [err, setErr] = useState('')

  const run = async () => {
    if (!desc.trim() || busy) return
    setBusy(true); setErr(''); setEst('')
    try {
      const kcal = await estimateCalories({ description: desc, apiKey: state.apiKey })
      if (kcal == null) setErr("Couldn't get a number back — check the coach connection in Settings.")
      else setEst(String(kcal))
    } catch (e) { setErr('Something went wrong: ' + e.message) } finally { setBusy(false) }
  }
  const add = () => {
    const v = Math.round(parseFloat(est) || 0)
    if (!v) return
    const current = parseFloat(state.dailyLog[day]?.calories) || 0
    setDailyLog(day, { calories: Math.round(current + v) })
    setEst(''); setDesc('')
  }

  return (
    <Card style={{ marginBottom: 16 }}>
      <div className="eyebrow">Not sure of the calories?</div>
      <p className="muted" style={{ margin: '8px 0 12px', fontSize: 14 }}>
        Describe what you ate and the coach will estimate it.
      </p>
      <textarea rows={2} placeholder="e.g. chicken burrito bowl with rice, beans, guac and cheese"
        value={desc} onChange={e => setDesc(e.target.value)} />
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button className="btn primary" onClick={run} disabled={busy || !desc.trim()}>
          {busy ? 'Estimating…' : 'Estimate calories'}
        </button>
      </div>

      {err && <div style={{ marginTop: 12 }}><Pill tone="bad">{err}</Pill></div>}
      {est !== '' && (
        <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="muted" style={{ fontSize: 14 }}>Estimate:</span>
          <input type="number" style={{ width: 110, textAlign: 'right' }} value={est} onChange={e => setEst(e.target.value)} />
          <span className="faint">kcal</span>
          <button className="btn" onClick={add}>Add to this day</button>
        </div>
      )}

      <div className="divider" />
      <Pill tone="warn">AI estimate — not exact</Pill>
      <p className="faint" style={{ margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.5 }}>
        It can't see your exact portions, so treat it as a starting point. Tweak the number before adding, or
        enter your actual calories if you know them.
      </p>
    </Card>
  )
}

export default function DailyLog() {
  const { state, setDailyLog, daily } = useStore()
  const days = Math.max(1, parseInt(state.inputs.periodDays) || 1)
  const byDay = Object.fromEntries(daily.rows.map(r => [r.dayNum, r]))
  const today = Math.min(days, Math.max(1, todayDayNum(state.inputs.startDate)))
  const [viewDay, setViewDay] = useState(today)
  const d = Math.min(days, Math.max(1, viewDay))
  const c = byDay[d] || {}

  const goPrev = () => setViewDay(v => Math.max(1, v - 1))
  const goNext = () => setViewDay(v => Math.min(days, v + 1))

  // swipe between days
  const touchX = useRef(null)
  const onTouchStart = e => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = e => {
    if (touchX.current == null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 50) (dx < 0 ? goNext : goPrev)()
    touchX.current = null
  }

  const label = d === today ? 'Today' : d === today - 1 ? 'Yesterday' : weekdayOf(c.iso)

  // one input row, stable (no inline component — keeps focus)
  const numRow = (k, labelText, unit) => (
    <div className="dl-row">
      <span className="dl-label">{labelText}{unit && <span className="dl-unit">{unit}</span>}</span>
      <input type="number" value={state.dailyLog[d]?.[k] ?? ''} onChange={e => setDailyLog(d, { [k]: e.target.value })} />
    </div>
  )
  const calcRow = (labelText, value, tone) => (
    <div className="dl-row">
      <span className="dl-label">{labelText}</span>
      <span className={`dl-val ${tone || 'faint'}`}>{value}</span>
    </div>
  )

  return (
    <>
      <PageHead eyebrow="Log" title="Daily Log" sub="Log your day — food, movement and weight. The calculated rows fill in as you go." />
      <MealEstimator day={d} />
      <Card>
        <div className="dl-nav">
          <button className="dl-arrow" onClick={goPrev} disabled={d <= 1} aria-label="Previous day">‹</button>
          <div className="dl-day" onClick={() => setViewDay(today)} title="Jump to today">
            <div className="dl-day-label">{label}</div>
            <div className="dl-day-date">Day {d}{c.iso ? ` · ${ddmm(c.iso)}` : ''}</div>
          </div>
          <button className="dl-arrow" onClick={goNext} disabled={d >= days} aria-label="Next day">›</button>
        </div>

        <div className="dl-rows" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {numRow('cardioMins', 'Cardio', 'min')}
          {numRow('steps', 'Steps')}
          {numRow('calories', 'Calories', 'kcal')}
          {numRow('protein', 'Protein', 'g')}
          {numRow('weight', 'Weight', 'kg')}

          <div className="dl-subhead">Calculated</div>
          {calcRow('Deficit / surplus', c.deficit != null ? `${fmt(c.deficit, 0, true)} kcal` : '—', c.deficit < 0 ? 'pos' : c.deficit > 0 ? 'neg' : 'faint')}
          {calcRow('Cumulative fat', c.logged ? `${fmt(c.cumFat, 2, true)} kg` : '—')}
          {calcRow('Cumulative muscle', c.logged ? `${fmt(c.cumMuscle, 2, true)} kg` : '—')}
        </div>
      </Card>
    </>
  )
}
