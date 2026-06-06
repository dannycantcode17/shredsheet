import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { GOALS, INTENSITIES, EXPERIENCE } from '../lib/defaults.js'

// ============================================================
// THE CONFIGURATOR — gated onboarding flow.
// Shown on first load (state.onboarded === false). Collects the
// core inputs, then drops the user into the app. Mobile-first.
// ============================================================

// little labelled number field used throughout the flow
function NumField({ k, suffix }) {
  const { state, setInputs } = useStore()
  return (
    <div className="cfg-row" style={{ alignItems: 'center' }}>
      <input className="cfg-input" type="number" inputMode="numeric"
        value={state.inputs[k] ?? ''} onChange={e => setInputs({ [k]: e.target.value })} />
      {suffix && <span className="faint" style={{ flex: '0 0 auto', fontSize: 14 }}>{suffix}</span>}
    </div>
  )
}

function SelectField({ k, options }) {
  const { state, setInputs } = useStore()
  return (
    <select className="cfg-input" value={state.inputs[k]} onChange={e => setInputs({ [k]: e.target.value })}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  )
}

export default function Configurator() {
  const { state, setInputs, setOnboarded, setView } = useStore()
  const [step, setStep] = useState(0)
  const i = state.inputs

  const steps = [
    // 0 — welcome
    {
      eyebrow: 'The Shredsheet',
      render: () => (
        <>
          <h1 className="cfg-q">Let's build your system.</h1>
          <p className="cfg-lede">A few quick questions and the whole sheet wires itself to you — targets, curves, the lot.</p>
        </>
      ),
    },
    // 1 — about you
    {
      eyebrow: 'About you · 1',
      render: () => (
        <>
          <h1 className="cfg-q">First, the basics.</h1>
          <div className="cfg-block">
            <label className="cfg-label">Sex</label>
            <SelectField k="sex" options={['Male', 'Female']} />
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Age</label>
            <NumField k="age" />
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Height</label>
            <NumField k="heightCm" suffix="cm" />
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Starting weight</label>
            <NumField k="startWeightKg" suffix="kg" />
          </div>
        </>
      ),
    },
    // 2 — goal
    {
      eyebrow: 'Your goal · 2',
      render: () => (
        <>
          <h1 className="cfg-q">What are you here to do?</h1>
          <div className="cfg-block">
            <label className="cfg-label">Primary goal</label>
            <SelectField k="goal" options={GOALS} />
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Goal weight</label>
            <NumField k="goalWeightKg" suffix="kg" />
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Over how long?</label>
            <NumField k="periodDays" suffix="days" />
          </div>
        </>
      ),
    },
    // 3 — training & activity
    {
      eyebrow: 'Training · 3',
      render: () => (
        <>
          <h1 className="cfg-q">How you train.</h1>
          <div className="cfg-block">
            <label className="cfg-label">Training experience</label>
            <SelectField k="experience" options={EXPERIENCE} />
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Gym sessions / week (last 6 months)</label>
            <NumField k="sessionsLast6m" />
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Gym sessions / week (planned)</label>
            <NumField k="gymSessionsPerWeek" />
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Cardio</label>
            <NumField k="cardioMinsPerWeek" suffix="min/wk" />
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Daily step goal</label>
            <NumField k="stepGoal" />
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Weight-training intensity</label>
            <SelectField k="weightIntensity" options={INTENSITIES} />
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Cardio intensity</label>
            <SelectField k="cardioIntensity" options={INTENSITIES} />
          </div>
        </>
      ),
    },
    // 4 — review
    {
      eyebrow: 'All set · 4',
      render: () => (
        <>
          <h1 className="cfg-q">That's your system.</h1>
          <p className="cfg-lede">
            {i.sex}, {i.age} · {i.heightCm}cm · {i.startWeightKg}kg → {i.goalWeightKg}kg.
            Goal: {i.goal} over {i.periodDays} days.
          </p>
          <p className="cfg-lede">You can fine-tune any of this later in Settings → Inputs.</p>
        </>
      ),
    },
  ]

  const last = step === steps.length - 1
  const finish = () => { setOnboarded(true); setView('dashboard') }
  const next = () => last ? finish() : setStep(s => s + 1)
  const back = () => setStep(s => Math.max(0, s - 1))

  return (
    <div className="cfg-root app-root">
      <div className="cfg-shell">
        <div className="cfg-progress" aria-hidden="true">
          {steps.map((_, idx) => (
            <span key={idx} className={`seg ${idx < step ? 'done' : idx === step ? 'active' : ''}`} />
          ))}
        </div>

        <div className="cfg-card" key={step}>
          <div className="cfg-eyebrow">{steps[step].eyebrow}</div>
          {steps[step].render()}
        </div>

        <div className="cfg-nav">
          {step > 0 && <button className="btn back" onClick={back}>←</button>}
          <button className="btn primary" onClick={next}>
            {step === 0 ? 'Get started' : last ? 'Enter the Shredsheet' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
