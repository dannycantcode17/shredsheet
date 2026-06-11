import React from 'react'
import { useStore } from '../state/store.jsx'
import { Card, Meter, Ring, EmptyState, fmt, GOAL_LABEL } from '../components/ui.jsx'
import { Icon } from '../components/icons.jsx'

// ============================================================
// TODAY — the new home screen.
// IA decision: the app's daily job is answering three questions —
//   1. How much can I still eat today?   (calorie ring + protein)
//   2. What training is due?             (session card → Train)
//   3. Is the recomp on track?           (pace vs plan, from engine rows)
// Everything here is read/derived from the engine's existing
// outputs (planRes, daily.rows) and today's dailyLog entry.
// No new maths — only presentation of numbers the engine already makes.
// ============================================================

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function Today() {
  const { state, setDailyLog, setView, planRes, daily } = useStore()
  const days = planRes.days
  const start = new Date(state.inputs.startDate)
  const rawDayNum = Number.isFinite(start.getTime()) ? Math.floor((Date.now() - start.getTime()) / 86400000) + 1 : 1
  const dayNum = Math.min(days, Math.max(1, rawDayNum))
  const beyondPlan = rawDayNum > days
  const log = state.dailyLog[dayNum] || {}
  const row = daily.rows[dayNum - 1] || {}

  const eaten = parseFloat(log.calories) || 0
  const protein = parseFloat(log.protein) || 0
  const target = Math.round(planRes.calorieTarget)
  const remaining = Math.round(target - eaten)
  const overBudget = remaining < 0

  // today's energy balance (only meaningful once calories are logged)
  const balance = row.deficit
  const wantSurplus = planRes.dailyDelta >= 0
  const balanceGood = balance != null && (wantSurplus ? balance >= 0 : balance <= 0)

  // today's training, straight from the workout log
  const iso = todayISO()
  const setsToday = state.workoutLog.filter(s => s.date === iso && s.exercise)
  const volToday = setsToday.reduce((a, s) => a + (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0), 0)
  const volLabel = volToday >= 1000 ? `${(volToday / 1000).toFixed(1)}t` : `${Math.round(volToday)}kg`

  // pace vs plan — the engine's cumulative actuals against a linear plan-to-date
  const frac = dayNum / days
  const plannedFat = planRes.fatChange * frac
  const plannedMuscle = planRes.muscleChange * frac
  const anyLogged = daily.rows.some(r => r.logged)
  const fatOnTrack = daily.cumFat <= plannedFat
  const muscleOnTrack = daily.cumMuscle >= plannedMuscle * 0.85

  const quick = (k, label, unit) => (
    <label className="dl-field" key={k}>
      <span className="dl-k">{label}{unit ? ` (${unit})` : ''}</span>
      <input type="number" inputMode="decimal" value={log[k] ?? ''} onChange={e => setDailyLog(dayNum, { [k]: e.target.value })} />
    </label>
  )

  return (
    <>
      <div className="today-head">
        <div className="eyebrow">Day {dayNum} of {days} · {GOAL_LABEL[state.inputs.goal] || state.inputs.goal}</div>
        <h1 className="page">Today</h1>
        <div className="today-rail" aria-hidden="true"><div className="fill" style={{ width: `${Math.min(100, frac * 100)}%` }} /></div>
        {beyondPlan && <p className="page-sub" style={{ marginTop: 10 }}>Your plan period has ended — reconfigure to start a new block.</p>}
      </div>

      {/* 1 · the calorie budget */}
      <Card className="today-hero">
        <Ring value={eaten} max={target} over={overBudget}>
          <div className="ring-big">{Math.abs(remaining).toLocaleString()}</div>
          <div className="ring-sub">{overBudget ? 'kcal over' : 'kcal left'}</div>
        </Ring>
        <div className="today-hero-side">
          <div className="th-row"><span className="k">Eaten</span><span className="v">{Math.round(eaten).toLocaleString()} kcal</span></div>
          <div className="th-row"><span className="k">Target</span><span className="v">{target.toLocaleString()} kcal</span></div>
          <div className="th-row">
            <span className="k">Balance</span>
            <span className={`v ${balance != null ? (balanceGood ? 'pos' : 'neg') : 'faint'}`}>
              {balance != null ? `${fmt(balance, 0, true)} kcal` : '—'}
            </span>
          </div>
          <Meter label="Protein" value={protein} target={planRes.proteinTarget} unit="g" tone="blue" overTone="" />
          <button className="btn primary today-cta" onClick={() => setView('food')}>+ Log food</button>
        </div>
      </Card>

      {/* 2 · today's training */}
      <h2 className="section">Training</h2>
      {setsToday.length > 0 ? (
        <Card className="today-train">
          <div className="tt-stats">
            <div className="tt-stat"><div className="tt-num">{setsToday.length}</div><div className="tt-lbl">sets</div></div>
            <div className="tt-stat"><div className="tt-num">{volLabel}</div><div className="tt-lbl">volume</div></div>
            <div className="tt-stat"><div className="tt-num">{[...new Set(setsToday.map(s => s.exercise))].length}</div><div className="tt-lbl">exercises</div></div>
          </div>
          <button className="btn" onClick={() => setView('gym')}>Continue session →</button>
        </Card>
      ) : (
        <Card className="today-train">
          <div className="tt-empty">
            <span className="tt-ico"><Icon name="dumbbell" /></span>
            <div>
              <div className="tt-title">Nothing logged yet</div>
              <div className="tt-sub">Your plan is loaded in Train — every set you log feeds the model.</div>
            </div>
          </div>
          <button className="btn primary" onClick={() => setView('gym')}>Start session →</button>
        </Card>
      )}

      {/* 3 · quick capture for the daily journal */}
      <h2 className="section">Quick log</h2>
      <Card>
        <div className="today-quick">
          {quick('weight', 'Weight', 'kg')}
          {quick('steps', 'Steps')}
          {quick('cardioMins', 'Cardio', 'min')}
        </div>
      </Card>

      {/* 4 · pace vs plan */}
      <h2 className="section">Pace vs plan</h2>
      {anyLogged ? (
        <div className="grid cols-2">
          <Card className="tight pace">
            <div className="stat-label">Fat {daily.cumFat <= 0 ? 'lost' : 'gained'} <span className={`pace-dot ${fatOnTrack ? 'on' : 'off'}`} /></div>
            <div className={`stat-value ${daily.cumFat <= 0 ? 'pos' : 'neg'}`}>{fmt(daily.cumFat, 1, true)} kg</div>
            <div className="stat-row"><span className="k">Plan by day {dayNum}</span><span className="v">{fmt(plannedFat, 1, true)} kg</span></div>
          </Card>
          <Card className="tight pace">
            <div className="stat-label">Muscle {daily.cumMuscle >= 0 ? 'gained' : 'lost'} <span className={`pace-dot ${muscleOnTrack ? 'on' : 'off'}`} /></div>
            <div className={`stat-value ${daily.cumMuscle >= 0 ? 'pos' : 'neg'}`}>{fmt(daily.cumMuscle, 1, true)} kg</div>
            <div className="stat-row"><span className="k">Plan by day {dayNum}</span><span className="v">{fmt(plannedMuscle, 1, true)} kg</span></div>
          </Card>
        </div>
      ) : (
        <EmptyState icon="trend" title="Your pace appears here"
          sub="Log food, weight or training for a day or two and the model starts tracking you against the plan."
          action="See the full picture" onAction={() => setView('data')} />
      )}
      {anyLogged && (
        <div style={{ marginTop: 14 }}>
          <button className="btn ghost" onClick={() => setView('data')}>Full progress →</button>
        </div>
      )}
    </>
  )
}
