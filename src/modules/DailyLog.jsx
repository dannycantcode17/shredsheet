import React, { useState, useRef } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, fmt } from '../components/ui.jsx'

const todayDayNum = (startDate) => Math.floor((Date.parse(new Date().toISOString().slice(0, 10)) - Date.parse(startDate)) / 86400000) + 1
const ddmm = (iso) => { if (!iso) return ''; const [, m, d] = iso.split('-'); return `${d}/${m}` }
const weekdayOf = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'long' })
}

// "Daily" — a single-day stats view. Food and workouts logged elsewhere show
// here read-only; steps and weight are the remaining manual inputs (steps will
// move to health-app sync later). Engine reads dailyLog[day] unchanged.
export default function DailyLog() {
  const { state, setDailyLog, daily } = useStore()
  const days = Math.max(1, parseInt(state.inputs.periodDays) || 1)
  const byDay = Object.fromEntries(daily.rows.map(r => [r.dayNum, r]))
  const today = Math.min(days, Math.max(1, todayDayNum(state.inputs.startDate)))
  const [viewDay, setViewDay] = useState(today)
  const d = Math.min(days, Math.max(1, viewDay))
  const c = byDay[d] || {}
  const log = state.dailyLog[d] || {}
  const has = (v) => v !== '' && v != null

  const goPrev = () => setViewDay(v => Math.max(1, v - 1))
  const goNext = () => setViewDay(v => Math.min(days, v + 1))
  const touchX = useRef(null)
  const onTouchStart = e => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = e => {
    if (touchX.current == null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 50) (dx < 0 ? goNext : goPrev)()
    touchX.current = null
  }
  const label = d === today ? 'Today' : d === today - 1 ? 'Yesterday' : weekdayOf(c.iso)

  const numRow = (k, labelText, unit) => (
    <div className="dl-row">
      <span className="dl-label">{labelText}{unit && <span className="dl-unit">{unit}</span>}</span>
      <input type="number" value={state.dailyLog[d]?.[k] ?? ''} onChange={e => setDailyLog(d, { [k]: e.target.value })} />
    </div>
  )
  const statRow = (labelText, value, via) => (
    <div className="dl-row">
      <span className="dl-label">{labelText}{via && <span className="dl-unit">via {via}</span>}</span>
      <span className="dl-val faint">{value}</span>
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
      <PageHead eyebrow="Log" title="Daily" sub="Your day at a glance. Food and workouts you log elsewhere flow in here, alongside steps and weight." />
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
          {numRow('steps', 'Steps')}
          {numRow('weight', 'Weight', 'kg')}
          <p className="faint" style={{ fontSize: 12, margin: '4px 0 0' }}>Step sync with your health app is coming. Weight has a quick weigh-in on the Bodycomp Dash too.</p>

          <div className="dl-subhead">Logged elsewhere</div>
          {statRow('Calories', has(log.calories) ? `${Math.round(log.calories)} kcal` : '—', 'Food')}
          {statRow('Protein', has(log.protein) ? `${Math.round(log.protein)} g` : '—', 'Food')}
          {statRow('Cardio', has(log.cardioMins) ? `${Math.round(log.cardioMins)} min` : '—', 'Workout Log')}

          <div className="dl-subhead">Calculated</div>
          {calcRow('Deficit / surplus', c.deficit != null ? `${fmt(c.deficit, 0, true)} kcal` : '—', c.deficit < 0 ? 'pos' : c.deficit > 0 ? 'neg' : 'faint')}
          {calcRow('Cumulative fat', c.logged ? `${fmt(c.cumFat, 2, true)} kg` : '—')}
          {calcRow('Cumulative muscle', c.logged ? `${fmt(c.cumMuscle, 2, true)} kg` : '—')}
        </div>
      </Card>
    </>
  )
}
