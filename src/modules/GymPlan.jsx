import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Pill } from '../components/ui.jsx'
import { generatePlan, regenerateExercises } from '../lib/plan.js'
import { DEFAULT_PLAN } from '../lib/defaults.js'

// true when the plan is still the untouched sample (safe to auto-generate over)
const isDefaultPlan = (plan) => plan.length === DEFAULT_PLAN.length && plan.every((d, i) => d.name === DEFAULT_PLAN[i].name)

// Phone-first gym plan: auto-generated from the configurator inputs, refined
// (happy with the split? -> happy with the exercises?), then confirmed/locked
// into a read-only plan. Days scroll sideways. Plan data + engine unchanged.
export default function GymPlan() {
  const { state, setPlan, setPlanLocked, setPlanGenerated, setActiveSession, setView, planRes } = useStore()
  const { plan, planLocked, planGenerated, inputs, apiKey } = state
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState('split') // split -> exercises -> (locked)
  const [prefer, setPrefer] = useState('')
  const [showPrefer, setShowPrefer] = useState(false)
  const genOnce = useRef(false)

  const run = async (fn, markGenerated) => {
    setBusy(true)
    try {
      const p = await fn()
      if (p && p.length) { setPlan(p); setStage('split'); setShowPrefer(false); setPrefer('') }
    } finally {
      setBusy(false)
      if (markGenerated) setPlanGenerated(true)
    }
  }

  // first landing after onboarding: build a plan once — only over the untouched
  // default, so a customised plan is never clobbered
  useEffect(() => {
    if (!planGenerated && !planLocked && !genOnce.current && isDefaultPlan(plan)) {
      genOnce.current = true
      run(() => generatePlan({ inputs, apiKey }), true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const days = plan.filter(d => d.name)

  // editing helpers (unlocked)
  const setDay = (di, patch) => setPlan(plan.map((d, i) => i !== di ? d : { ...d, ...patch }))
  const setEx = (di, ei, patch) => setPlan(plan.map((d, i) => i !== di ? d : { ...d, exercises: d.exercises.map((e, j) => j !== ei ? e : { ...e, ...patch }) }))
  const addEx = (di) => setPlan(plan.map((d, i) => i !== di ? d : { ...d, exercises: [...d.exercises, { name: '', compound: false, sets: '', goalWeight: '', goalReps: '' }] }))
  const removeEx = (di, ei) => setPlan(plan.map((d, i) => i !== di ? d : { ...d, exercises: d.exercises.filter((_, j) => j !== ei) }))
  const startWorkout = (d) => { setActiveSession({ day: d.name, exercises: d.exercises.filter(e => e.name) }); setView('workout') }

  return (
    <>
      <PageHead eyebrow="Your plan" title="Gym Plan" sub="Built around your goal, kit and experience. Refine it, lock it in, then start training." />

      {busy && <Card><span className="muted">Building your plan…</span></Card>}

      {!busy && planLocked && (
        <>
          <div className="row-between" style={{ marginBottom: 14 }}>
            <Pill tone="good">Plan locked</Pill>
            <button className="btn" onClick={() => { setPlanLocked(false); setStage('exercises') }}>Unlock to edit</button>
          </div>

          <Card className="gp-howto" style={{ marginBottom: 14 }}>
            <div className="eyebrow">You're set — here's the routine</div>
            <ol className="gp-steps">
              <li><b>Train.</b> On a gym day, tap <b>Start</b> on that day below — your sets are pre-filled, just enter what you lifted.</li>
              <li><b>Eat.</b> Log your food each day so calories and protein track against your target.</li>
              <li><b>Check in.</b> Your dashboards and AI coach update as you go — ask the coach anything.</li>
            </ol>
          </Card>

          <div className="gp-scroll">
            {days.map((d) => (
              <Card key={d.name} className="gp-day">
                <div className="gp-day-head">
                  <span className="gp-day-name" style={{ fontWeight: 700, fontSize: 16 }}>{d.name}</span>
                  <button className="btn primary gp-start" onClick={() => startWorkout(d)}>Start</button>
                </div>
                {d.exercises.filter(e => e.name).map((e, ei) => (
                  <div className="gp-ro-ex" key={ei}>
                    <span className="gp-ro-name">{e.name}</span>
                    <span className="gp-ro-detail">{(e.sets || '–')}×{(e.goalReps || '–')}{e.goalWeight ? ` · ${e.goalWeight}kg` : ''}</span>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </>
      )}

      {!busy && !planLocked && (
        <>
          <Card className="gp-refine">
            {stage === 'split' ? (
              <>
                <div className="row-between">
                  <span className="muted" style={{ fontSize: 14 }}>Happy with this split? <span className="faint">({days.map(d => d.name).join(' · ') || 'no days yet'})</span></span>
                </div>
                <div className="btn-row" style={{ marginTop: 12 }}>
                  <button className="btn primary" onClick={() => setStage('exercises')} disabled={!days.length}>Yes — check exercises</button>
                  <button className="btn" onClick={() => setShowPrefer(v => !v)}>Change the split</button>
                </div>
                {showPrefer && (
                  <div style={{ marginTop: 12 }}>
                    <input placeholder="e.g. 4 days, upper/lower — or just a number of days" value={prefer} onChange={e => setPrefer(e.target.value)} />
                    <div className="btn-row" style={{ marginTop: 10 }}>
                      <button className="btn primary" onClick={() => run(() => generatePlan({ inputs, prefer, apiKey }))}>Regenerate split</button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <span className="muted" style={{ fontSize: 14 }}>Happy with the exercises? Edit any below, then lock it in.</span>
                <div className="btn-row" style={{ marginTop: 12 }}>
                  <button className="btn primary" onClick={() => setPlanLocked(true)}>Confirm &amp; lock plan</button>
                  <button className="btn" onClick={() => run(() => regenerateExercises({ inputs, plan, apiKey }))}>Regenerate exercises</button>
                  <button className="btn ghost" onClick={() => setStage('split')}>← Back to split</button>
                </div>
              </>
            )}
            <div style={{ marginTop: 10 }}>
              <button className="btn ghost" onClick={() => run(() => generatePlan({ inputs, apiKey }))}>↻ Start over</button>
              <span className="faint" style={{ fontSize: 12, marginLeft: 10 }}>{planRes.plannedSets} sets / week</span>
            </div>
          </Card>

          <div className="gp-scroll">
            {days.map((d) => {
              const di = plan.indexOf(d)
              return (
                <Card key={di} className="gp-day">
                  <div className="gp-day-head">
                    <input className="gp-day-name" value={d.name} onChange={e => setDay(di, { name: e.target.value })} />
                  </div>
                  {d.exercises.map((e, ei) => (
                    <div className="gp-ex" key={ei}>
                      <div className="gp-ex-top">
                        <input className="gp-ex-name" placeholder="Exercise" value={e.name} onChange={ev => setEx(di, ei, { name: ev.target.value })} />
                        <button className="gp-x" onClick={() => removeEx(di, ei)} aria-label="Remove">✕</button>
                      </div>
                      <div className="gp-ex-fields">
                        <label className="gp-f"><span>Sets</span><input type="number" value={e.sets} onChange={ev => setEx(di, ei, { sets: ev.target.value })} /></label>
                        <label className="gp-f"><span>Goal kg</span><input type="number" value={e.goalWeight} onChange={ev => setEx(di, ei, { goalWeight: ev.target.value })} /></label>
                        <label className="gp-f"><span>Goal reps</span><input type="number" value={e.goalReps} onChange={ev => setEx(di, ei, { goalReps: ev.target.value })} /></label>
                        <button type="button" className={`gp-tag ${e.compound ? 'on' : ''}`} onClick={() => setEx(di, ei, { compound: !e.compound })}>Compound</button>
                      </div>
                    </div>
                  ))}
                  <button className="gp-addex" onClick={() => addEx(di)}>+ Add exercise</button>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
