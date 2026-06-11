import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Field, Pill } from '../components/ui.jsx'
import { GOALS, INTENSITIES, EXPERIENCE } from '../lib/defaults.js'

const Num = ({ k }) => { const { state, setInputs } = useStore(); return (
  <input type="number" value={state.inputs[k] ?? ''} onChange={e => setInputs({ [k]: e.target.value })} />
)}
const Pct = ({ k }) => { const { state, setInputs } = useStore(); return (
  <input type="number" step="5" value={Math.round((state.inputs[k] ?? 1) * 100)} onChange={e => setInputs({ [k]: (parseFloat(e.target.value) || 0) / 100 })} />
)}

export default function Inputs() {
  const { state, setInputs, setOnboarded, setView } = useStore()
  const i = state.inputs
  const cut = i.goal === 'Cut' || i.goal === 'Aggressive Cut'
  const warnGoal = (cut && i.goalWeightKg > i.startWeightKg) || (!cut && i.goalWeightKg < i.startWeightKg)
  return (
    <>
      <PageHead eyebrow="Setup" title="Inputs" sub="Tell the Shredsheet who you are and what you're chasing. Everything downstream recalculates live." />

      <h2 className="section">General</h2>
      <Card>
        <div className="grid cols-3">
          <Field label="Start date"><input type="date" value={i.startDate} onChange={e => setInputs({ startDate: e.target.value })} /></Field>
          <Field label="Period length (days)" hint="No 186-day cap any more"><Num k="periodDays" /></Field>
          <Field label="Age"><Num k="age" /></Field>
          <Field label="Sex"><select value={i.sex} onChange={e => setInputs({ sex: e.target.value })}><option>Male</option><option>Female</option></select></Field>
          <Field label="Height (cm)"><Num k="heightCm" /></Field>
          <Field label="Starting weight (kg)"><Num k="startWeightKg" /></Field>
          <Field label="Training experience"><select value={i.experience} onChange={e => setInputs({ experience: e.target.value })}>{EXPERIENCE.map(x => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Gym sessions/wk (last 6 months)" hint="Drives the 'newbie gains' curve"><Num k="sessionsLast6m" /></Field>
        </div>
      </Card>

      <h2 className="section">Goals for the period</h2>
      <Card>
        <div className="grid cols-3">
          <Field label="Goal weight (kg)"><Num k="goalWeightKg" /></Field>
          <Field label="Primary goal"><select value={i.goal} onChange={e => setInputs({ goal: e.target.value })}>{GOALS.map(x => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Gym sessions / week"><Num k="gymSessionsPerWeek" /></Field>
          <Field label="Cardio (mins / week)"><Num k="cardioMinsPerWeek" /></Field>
          <Field label="Step goal / day"><Num k="stepGoal" /></Field>
          <div />
          <Field label="Weight-training intensity"><select value={i.weightIntensity} onChange={e => setInputs({ weightIntensity: e.target.value })}>{INTENSITIES.map(x => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Cardio intensity"><select value={i.cardioIntensity} onChange={e => setInputs({ cardioIntensity: e.target.value })}>{INTENSITIES.map(x => <option key={x}>{x}</option>)}</select></Field>
        </div>
        {warnGoal && <Pill tone="warn">⚠ {cut ? 'Cut selected but goal weight is above your start' : 'Bulk selected but goal weight is below your start'}</Pill>}
      </Card>

      <h2 className="section">Manual logic modifiers <span className="faint" style={{ textTransform: 'none', letterSpacing: 0 }}>— your override on the model (100% = average)</span></h2>
      <Card>
        <div className="grid cols-2">
          <Field label="Metabolism modifier (%)" hint="Up if you stay lean easily; down if you gain fat on low calories."><Pct k="metabolismModifier" /></Field>
          <Field label="Muscle modifier (%)" hint="Up if you build muscle easily; down if gains are stubborn. 0% turns muscle tracking off."><Pct k="muscleModifier" /></Field>
        </div>
      </Card>

      <h2 className="section">Calculated targets</h2>
      <Card>
        <span className="muted">Your live targets — daily calories &amp; protein are on <b>Today</b>; projected fat &amp; muscle change live in <b>Progress</b>. Everything recalculates the moment you change an input.</span>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => setView('today')}>Today →</button>
          <button className="btn" onClick={() => setView('data')}>Progress →</button>
        </div>
      </Card>

      {!state.onboarded && (
        <div style={{ marginTop: 24 }}>
          <button className="btn primary" style={{ fontSize: 15, padding: '13px 22px' }} onClick={() => { setOnboarded(true); setView('today') }}>✓ Start tracking →</button>
          <div className="hint" style={{ marginTop: 8 }}>Next: set up your split in Plan, then log day by day. You can change these inputs any time.</div>
        </div>
      )}
    </>
  )
}
