import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Field, StatBox, Pill, fmt, GOAL_LABEL } from '../components/ui.jsx'
import { GOALS, INTENSITIES, EXPERIENCE } from '../lib/defaults.js'

const Num = ({ k }) => { const { state, setInputs } = useStore(); return (
  <input type="number" value={state.inputs[k] ?? ''} onChange={e => setInputs({ [k]: e.target.value })} />
)}
const Pct = ({ k }) => { const { state, setInputs } = useStore(); return (
  <input type="number" step="5" value={Math.round((state.inputs[k] ?? 1) * 100)} onChange={e => setInputs({ [k]: (parseFloat(e.target.value) || 0) / 100 })} />
)}

export default function Inputs() {
  const { state, setInputs, planRes } = useStore()
  const i = state.inputs
  const cut = i.goal === 'Cut' || i.goal === 'Aggressive Cut'
  const warnGoal = (cut && i.goalWeightKg > i.startWeightKg) || (!cut && i.goalWeightKg < i.startWeightKg)
  return (
    <>
      <PageHead eyebrow="Setup" title="Inputs" sub="Your details and your goal. Everything below recalculates as you change them." />

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
          <Field label="Primary goal"><select value={i.goal} onChange={e => setInputs({ goal: e.target.value })}>{GOALS.map(x => <option key={x} value={x}>{GOAL_LABEL[x] || x}</option>)}</select></Field>
          <Field label="Gym sessions / week"><Num k="gymSessionsPerWeek" /></Field>
          <Field label="Cardio (mins / week)"><Num k="cardioMinsPerWeek" /></Field>
          <Field label="Step goal / day"><Num k="stepGoal" /></Field>
          <div />
          <Field label="Weight-training intensity"><select value={i.weightIntensity} onChange={e => setInputs({ weightIntensity: e.target.value })}>{INTENSITIES.map(x => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Cardio intensity"><select value={i.cardioIntensity} onChange={e => setInputs({ cardioIntensity: e.target.value })}>{INTENSITIES.map(x => <option key={x}>{x}</option>)}</select></Field>
        </div>
        {warnGoal && <Pill tone="warn">⚠ {cut ? 'Your goal is fat loss, but your target weight is above your current weight' : 'Your goal is muscle gain, but your target weight is below your current weight'}</Pill>}
      </Card>

      <h2 className="section">Manual logic modifiers <span className="faint" style={{ textTransform: 'none', letterSpacing: 0 }}>— your override on the model (100% = average)</span></h2>
      <Card>
        <div className="grid cols-2">
          <Field label="Metabolism modifier (%)" hint="Up if you stay lean easily; down if you gain fat on low calories."><Pct k="metabolismModifier" /></Field>
          <Field label="Muscle modifier (%)" hint="Up if you build muscle easily; down if gains are stubborn. 0% turns muscle tracking off."><Pct k="muscleModifier" /></Field>
        </div>
      </Card>

      <h2 className="section">Your targets (calculated — no need to edit)</h2>
      <div className="grid cols-3">
        <StatBox label="Total weight change" value={`${fmt(planRes.weightChange, 1, true)} kg`}
          explain="Your goal weight minus your starting weight — the total change your plan is aiming for over the whole period." />
        <StatBox label="Of that, muscle" value={`${fmt(planRes.muscleChange, 1, true)} kg`} tone={planRes.muscleChange >= 0 ? 'pos' : 'neg'}
          explain="How much of that change the plan expects to be muscle, based on your training volume, experience and protein." />
        <StatBox label="Of that, fat" value={`${fmt(planRes.fatChange, 1, true)} kg`} tone={planRes.fatChange <= 0 ? 'pos' : 'neg'}
          explain="The rest of the weight change after muscle — i.e. the fat side of the projection (negative means fat lost)." />
        <StatBox label="Change quality" value={`${Math.round(planRes.cleanliness * 100)}%`} tone={planRes.cleanliness >= 0.5 ? 'pos' : 'neg'}
          explain="How much of the projected change is the kind you want — fat down on a cut, muscle up on a gain. Higher is cleaner." />
        <StatBox label="Daily calorie target" value={`${Math.round(planRes.calorieTarget)} kcal`} rows={[{ k: 'Maintenance (TDEE)', v: `${Math.round(planRes.tdee)} kcal` }]}
          explain="What to eat each day to hit your goal: your maintenance calories (TDEE — what you'd burn at this weight and activity) plus the deficit or surplus the plan needs." />
        <StatBox label={`Daily ${planRes.dailyDelta >= 0 ? 'surplus' : 'deficit'}`} value={`${fmt(planRes.dailyDelta, 0, true)} kcal`} rows={[{ k: 'Protein target', v: `${Math.round(planRes.proteinTarget)} g` }]}
          explain="How far above or below maintenance you'll eat each day to reach your goal in time. 'Protein target' is your daily protein goal." />
      </div>
      {planRes.cleanliness < 0.5 && (
        <Card style={{ marginTop: 16, borderColor: 'rgba(240,179,78,0.35)' }}>
          <Pill tone="warn">Worth a look</Pill>
          <p className="muted" style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55 }}>
            Right now, less than half of your projected change is the kind you're aiming for — more of it is fat
            (on a gain) or muscle (on a cut) than ideal. Nudging your training volume, protein or the modifiers
            above can tighten that up. Totally fine to leave it for now, too.
          </p>
        </Card>
      )}
    </>
  )
}
