import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, EmptyState, Stepper } from '../components/ui.jsx'
import { Icon } from '../components/icons.jsx'
import { epley1RM } from '../lib/engine.js'

// ============================================================
// TRAIN — plan-driven session logging.
// IA decision: the old logger made you pick an exercise from a
// dropdown, divorced from your programme. Rebuilt around the
// plan: pick your split day, your planned exercises appear as
// tappable rows showing done/planned sets and last time's top
// set. Tap one → the logger arms itself (pre-filled from last
// time), weight/reps become thumb steppers. The workoutLog
// records exactly the same shape as before — engine untouched.
// ============================================================

const num = (v, d = 0) => { const x = parseFloat(v); return Number.isFinite(x) ? x : d }
const todayISO = () => new Date().toISOString().slice(0, 10)

export default function Workout() {
  const { state, setWorkoutLog, setDailyLog, setView, strength } = useStore()
  const today = todayISO()
  const activeDays = state.plan.filter(d => d.name)
  const dayNames = activeDays.map(d => d.name)
  const allExercises = [...new Set(state.plan.flatMap(d => d.exercises.map(e => e.name).filter(Boolean)))]

  const start = new Date(state.inputs.startDate)
  const todayDayNum = Number.isFinite(start.getTime()) ? Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1) : 1

  // default to the least-recently-trained day so the split rotates naturally
  const lastTrained = (name) => {
    let last = ''
    for (const s of state.workoutLog) if (s.day === name && s.date > last) last = s.date
    return last
  }
  const suggested = dayNames.length
    ? [...dayNames].sort((a, b) => lastTrained(a).localeCompare(lastTrained(b)))[0]
    : ''
  const [day, setDay] = useState(suggested)
  const [exercise, setExercise] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [showRpe, setShowRpe] = useState(false)
  const [showOther, setShowOther] = useState(false)
  const [rir, setRir] = useState('')
  const [tempo, setTempo] = useState('')

  // today's sets, keeping each set's index into the full log (for delete)
  const todayIdx = state.workoutLog.map((s, i) => ({ s, i })).filter(({ s }) => s.date === today && s.exercise)
  const count = todayIdx.length
  const repsToday = todayIdx.reduce((a, { s }) => a + num(s.reps), 0)
  const volToday = todayIdx.reduce((a, { s }) => a + num(s.weight) * num(s.reps), 0)
  const doneByExercise = {}
  todayIdx.forEach(({ s }) => { doneByExercise[s.exercise] = (doneByExercise[s.exercise] || 0) + 1 })

  // group today's sets by exercise, in the order they first appear
  const order = []
  const groups = {}
  todayIdx.forEach(({ s, i }) => { if (!groups[s.exercise]) { groups[s.exercise] = []; order.push(s.exercise) } groups[s.exercise].push({ s, i }) })

  // top set last time this lift was trained (progressive-overload cue)
  const lastTime = (name) => {
    let best = null
    for (const s of state.workoutLog) {
      if (s.exercise !== name || s.date >= today || s.weight === '' || s.reps === '') continue
      if (!best || s.date > best.date || (s.date === best.date && num(s.weight) > num(best.weight))) best = s
    }
    return best
  }

  const pick = (name) => {
    if (exercise === name) { setExercise(''); return }
    setExercise(name)
    const lt = lastTime(name)
    setWeight(lt ? String(lt.weight) : '')
    setReps(lt ? String(lt.reps) : '')
  }

  const addSet = () => {
    if (!exercise || weight === '' || reps === '') return
    setWorkoutLog([...state.workoutLog, { date: today, day, exercise, weight, reps, rir, tempo, comments: '' }])
  }
  const del = (i) => setWorkoutLog(state.workoutLog.filter((_, j) => j !== i))

  if (!allExercises.length) {
    return (
      <>
        <PageHead title="Train" sub="Log today's session." />
        <EmptyState icon="calendar" title="No programme yet"
          sub="Build your split in the Plan studio first — then your exercises live here, ready to log."
          action="Open Plan →" onAction={() => setView('plan')} />
      </>
    )
  }

  const planDay = activeDays.find(d => d.name === day)
  const planned = planDay ? planDay.exercises.filter(e => e.name) : []
  const plannedNames = planned.map(e => e.name)
  const others = allExercises.filter(x => !plannedNames.includes(x))
  const lt = exercise ? lastTime(exercise) : null
  const strengthByName = Object.fromEntries(strength.exercises.map(e => [e.name, e]))
  const cardio = state.dailyLog[todayDayNum]?.cardioMins ?? ''
  const volLabel = volToday >= 1000 ? `${(volToday / 1000).toFixed(1)}t` : `${Math.round(volToday)}kg`
  const e1rmNow = exercise && weight !== '' && reps !== '' ? epley1RM(weight, reps, rir) : null

  return (
    <>
      <PageHead title="Train" sub={`Today · ${today.slice(5)}`} />

      <Card className="wk-tally">
        <div><div className="wk-count">{count}</div><div className="wk-count-l">sets today</div></div>
        <div className="wk-sec"><span>{repsToday} reps</span><span>{volLabel} volume</span></div>
      </Card>

      {dayNames.length > 0 && (
        <div className="wk-days">
          {dayNames.map(n => (
            <button key={n} className={`wk-day ${day === n ? 'active' : ''}`} onClick={() => setDay(n)}>
              {n}{n === suggested && day !== n ? <span className="wk-due">due</span> : null}
            </button>
          ))}
        </div>
      )}

      {/* the day's programme — tap an exercise to arm the logger */}
      <Card className="tr-plan">
        <div className="stat-label" style={{ marginBottom: 6 }}>{day || 'Session'} · programme</div>
        {planned.map(e => {
          const done = doneByExercise[e.name] || 0
          const target = num(e.sets)
          const lt2 = lastTime(e.name)
          const st = strengthByName[e.name]
          const complete = target > 0 && done >= target
          return (
            <button key={e.name} type="button" className={`tr-ex ${exercise === e.name ? 'sel' : ''} ${complete ? 'done' : ''}`} onClick={() => pick(e.name)}>
              <span className="tr-ex-main">
                <span className="tr-ex-name">{e.name}</span>
                <span className="tr-ex-meta">
                  {lt2 ? `Last: ${lt2.weight}kg × ${lt2.reps}` : 'First time — set your opener'}
                  {st?.target ? ` · target ${st.target}kg e1RM${st.hitTarget ? ' ✓' : ''}` : ''}
                </span>
              </span>
              <span className="tr-ex-side">
                {target > 0 && (
                  <span className="tr-dots" aria-label={`${done} of ${target} sets done`}>
                    {Array.from({ length: Math.min(target, 6) }, (_, k) => <i key={k} className={k < done ? 'on' : ''} />)}
                    {done > target && <em>+{done - target}</em>}
                  </span>
                )}
                {complete ? <span className="tr-check"><Icon name="check" /></span> : <span className="tr-count">{done}/{target || '–'}</span>}
              </span>
            </button>
          )
        })}
        {others.length > 0 && (
          <>
            <button type="button" className="tr-other-toggle" onClick={() => setShowOther(o => !o)}>
              {showOther ? 'Hide' : 'Off-programme exercise'} {showOther ? '▴' : '▾'}
            </button>
            {showOther && (
              <div className="chips" style={{ marginTop: 10 }}>
                {others.map(x => <button key={x} className={`chip ${exercise === x ? 'on' : ''}`} onClick={() => pick(x)}>{x}</button>)}
              </div>
            )}
          </>
        )}
      </Card>

      {/* the armed logger */}
      {exercise && (
        <Card className="tr-logger">
          <div className="tr-log-head">
            <span className="tr-log-name">{exercise}</span>
            {lt && <span className="faint">last {lt.weight}kg × {lt.reps}</span>}
          </div>
          <div className="wk-we">
            <Stepper label="Weight (kg)" value={weight} onChange={setWeight} step={2.5} />
            <Stepper label="Reps" value={reps} onChange={setReps} step={1} />
          </div>
          {showRpe && (
            <div className="wk-we">
              <Stepper label="RIR" value={rir} onChange={setRir} step={1} />
              <Stepper label="Tempo" value={tempo} onChange={setTempo} step={1} />
            </div>
          )}
          <div className="btn-row" style={{ marginTop: 6 }}>
            <button className="btn primary" style={{ flex: 1, padding: 14, fontSize: 15 }} onClick={addSet} disabled={weight === '' || reps === ''}>
              + Add set{e1rmNow ? <span className="tr-e1rm">≈ {e1rmNow.toFixed(0)} e1RM</span> : null}
            </button>
            <button className="btn ghost" onClick={() => setShowRpe(v => !v)}>{showRpe ? 'Hide' : 'RIR / tempo'}</button>
          </div>
        </Card>
      )}

      {/* today's logged work */}
      {order.length > 0 && order.map(name => (
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
      ))}

      <Card className="wk-cardio">
        <label className="dl-field"><span className="dl-k">Cardio today (min)</span>
          <input type="number" inputMode="numeric" value={cardio} onChange={e => setDailyLog(todayDayNum, { cardioMins: e.target.value })} />
        </label>
      </Card>
    </>
  )
}
