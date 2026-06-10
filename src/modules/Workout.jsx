import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, EmptyState } from '../components/ui.jsx'
import { epley1RM } from '../lib/engine.js'

const num = (v, d = 0) => { const x = parseFloat(v); return Number.isFinite(x) ? x : d }
const todayISO = () => new Date().toISOString().slice(0, 10)

export default function Workout() {
  const { state, setWorkoutLog, setDailyLog, setView } = useStore()
  const today = todayISO()
  const dayNames = state.plan.filter(d => d.name).map(d => d.name)
  const exercises = [...new Set(state.plan.flatMap(d => d.exercises.map(e => e.name).filter(Boolean)))]

  const start = new Date(state.inputs.startDate)
  const todayDayNum = Number.isFinite(start.getTime()) ? Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1) : 1

  const [day, setDay] = useState(dayNames[0] || '')
  const [exercise, setExercise] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [showRpe, setShowRpe] = useState(false)
  const [rir, setRir] = useState('')
  const [tempo, setTempo] = useState('')

  // today's sets, keeping each set's index into the full log (for delete)
  const todayIdx = state.workoutLog.map((s, i) => ({ s, i })).filter(({ s }) => s.date === today && s.exercise)
  const count = todayIdx.length
  const repsToday = todayIdx.reduce((a, { s }) => a + num(s.reps), 0)
  const volToday = todayIdx.reduce((a, { s }) => a + num(s.weight) * num(s.reps), 0)

  // group today's sets by exercise, in the order they first appear
  const order = []
  const groups = {}
  todayIdx.forEach(({ s, i }) => { if (!groups[s.exercise]) { groups[s.exercise] = []; order.push(s.exercise) } groups[s.exercise].push({ s, i }) })

  // top set last time you trained this lift (progressive-overload cue)
  const lastTime = (name) => {
    let best = null
    for (const s of state.workoutLog) {
      if (s.exercise !== name || s.date >= today || s.weight === '' || s.reps === '') continue
      if (!best || s.date > best.date || (s.date === best.date && num(s.weight) > num(best.weight))) best = s
    }
    return best
  }

  const addSet = () => {
    if (!exercise || weight === '' || reps === '') return
    setWorkoutLog([...state.workoutLog, { date: today, day, exercise, weight, reps, rir, tempo, comments: '' }])
    setWeight(''); setReps('') // keep exercise + day so logging the next set is one tap
  }
  const del = (i) => setWorkoutLog(state.workoutLog.filter((_, j) => j !== i))

  if (!exercises.length) {
    return (
      <>
        <PageHead title="Workout" sub="Log today's session." />
        <EmptyState icon="calendar" title="No plan yet"
          sub="Name your training days and add exercises in Gym Plan first — then come back here to log sets."
          action="Open Gym Plan →" onAction={() => setView('plan')} />
      </>
    )
  }

  const lt = exercise ? lastTime(exercise) : null
  const cardio = state.dailyLog[todayDayNum]?.cardioMins ?? ''
  const volLabel = volToday >= 1000 ? `${(volToday / 1000).toFixed(1)}t` : `${Math.round(volToday)}kg`

  return (
    <>
      <PageHead title="Workout" sub={`Today · ${today.slice(5)}`} />

      <Card className="wk-tally">
        <div><div className="wk-count">{count}</div><div className="wk-count-l">sets today</div></div>
        <div className="wk-sec"><span>{repsToday} reps</span><span>{volLabel} volume</span></div>
      </Card>

      {dayNames.length > 0 && (
        <div className="wk-days">
          {dayNames.map(n => <button key={n} className={`wk-day ${day === n ? 'active' : ''}`} onClick={() => setDay(n)}>{n}</button>)}
        </div>
      )}

      <Card className="wk-add">
        <label className="dl-field"><span className="dl-k">Exercise</span>
          <select value={exercise} onChange={e => setExercise(e.target.value)}><option value="">— pick —</option>{exercises.map(x => <option key={x}>{x}</option>)}</select>
        </label>
        {lt && <div className="wk-last">Last time: <b>{lt.weight}kg × {lt.reps}</b> <span className="faint">({lt.date.slice(5)})</span></div>}
        <div className="wk-we">
          <label className="dl-field"><span className="dl-k">Weight (kg)</span><input type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} /></label>
          <label className="dl-field"><span className="dl-k">Reps</span><input type="number" inputMode="numeric" value={reps} onChange={e => setReps(e.target.value)} /></label>
        </div>
        {showRpe && (
          <div className="wk-we">
            <label className="dl-field"><span className="dl-k">RIR</span><input type="number" inputMode="numeric" value={rir} onChange={e => setRir(e.target.value)} /></label>
            <label className="dl-field"><span className="dl-k">Tempo</span><input type="number" inputMode="numeric" value={tempo} onChange={e => setTempo(e.target.value)} /></label>
          </div>
        )}
        <div className="btn-row" style={{ marginTop: 4 }}>
          <button className="btn primary" style={{ flex: 1, justifyContent: 'center', padding: 13 }} onClick={addSet} disabled={!exercise || weight === '' || reps === ''}>+ Add set</button>
          <button className="btn ghost" onClick={() => setShowRpe(v => !v)}>{showRpe ? 'Hide' : 'RIR / tempo'}</button>
        </div>
      </Card>

      {order.length > 0 ? order.map(name => (
        <Card key={name} className="wk-group">
          <div className="wk-gh">{name}<span className="faint">{groups[name].length} set{groups[name].length > 1 ? 's' : ''}</span></div>
          {groups[name].map(({ s, i }, k) => (
            <div className="wk-set" key={i}>
              <span className="wk-n">{k + 1}</span>
              <span className="wk-wr">{s.weight}kg × {s.reps}</span>
              <span className="wk-1rm faint">{s.weight && s.reps ? `${epley1RM(s.weight, s.reps, s.rir).toFixed(1)} 1RM` : ''}</span>
              <button className="btn ghost wk-x" aria-label="Delete set" onClick={() => del(i)}>✕</button>
            </div>
          ))}
        </Card>
      )) : (
        <EmptyState icon="dumbbell" title="No sets yet"
          sub="Pick an exercise above and add your first set — it lands here as you go." />
      )}

      <Card className="wk-cardio">
        <label className="dl-field"><span className="dl-k">Cardio today (min)</span>
          <input type="number" inputMode="numeric" value={cardio} onChange={e => setDailyLog(todayDayNum, { cardioMins: e.target.value })} />
        </label>
      </Card>
    </>
  )
}
