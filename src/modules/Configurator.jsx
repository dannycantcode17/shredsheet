import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { INTENSITIES, EXPERIENCE } from '../lib/defaults.js'

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

// transparency signpost — what a field actually changes downstream
function Sign({ children }) {
  return <div className="cfg-signpost"><span className="ico">→</span><span>{children}</span></div>
}

// tappable choice chips — friendlier than a dropdown on a phone
function ChoiceChips({ k, options, columns }) {
  const { state, setInputs } = useStore()
  return (
    <div className={`cfg-choices ${columns === 2 ? 'two' : ''}`}>
      {options.map(o => {
        const selected = state.inputs[k] === o.value
        return (
          <button key={o.value} type="button"
            className={`cfg-choice ${selected ? 'selected' : ''}`}
            aria-pressed={selected}
            onClick={() => setInputs({ [k]: o.value })}>
            <span className="c-title">{o.title}</span>
            {o.sub && <span className="c-sub">{o.sub}</span>}
          </button>
        )
      })}
    </div>
  )
}

const GOAL_CHOICES = [
  { value: 'Cut', title: 'Cut', sub: 'Drop fat, hold onto muscle' },
  { value: 'Lean Bulk', title: 'Lean Bulk', sub: 'Build muscle, keep fat in check' },
  { value: 'Bulk', title: 'Bulk', sub: 'Go for size, accept some fat' },
  { value: 'Aggressive Cut', title: 'Aggressive Cut', sub: 'Fat off, fast' },
]

export default function Configurator() {
  const { state, setInputs, setOnboarded, setView } = useStore()
  const [step, setStep] = useState(0)
  const i = state.inputs

  const steps = [
    // 0 — welcome (cinematic loop hook)
    {
      eyebrow: 'The Shredsheet',
      render: () => (
        <>
          <h1 className="cfg-q">Log it. Coach reads it.<br />You get the move.</h1>
          <div className="cfg-loop">
            <div className="cfg-loop-step">
              <div className="l-ico">📝</div>
              <div>
                <div className="l-title">You log</div>
                <div className="l-sub">Yesterday's food, steps and lifts. Ten seconds, done.</div>
              </div>
            </div>
            <div className="cfg-loop-arrow">↓</div>
            <div className="cfg-loop-step">
              <div className="l-ico">🧠</div>
              <div>
                <div className="l-title">Your coach reads everything</div>
                <div className="l-sub">Every number, instantly. No squinting at spreadsheets.</div>
              </div>
            </div>
            <div className="cfg-loop-arrow">↓</div>
            <div className="cfg-loop-step">
              <div className="l-ico">💡</div>
              <div>
                <div className="l-title">You get the insight</div>
                <div className="l-sub">One clear move for the week ahead. That's the whole game.</div>
              </div>
            </div>
          </div>
          <p className="cfg-lede">First we build your system — who you are, what you're chasing. Takes about a minute.</p>
          <div className="cfg-signpost"><span className="ico">🔒</span><span>Your coach joins once your system is set — no point coaching a blank sheet.</span></div>
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
            <label className="cfg-label">Are you male or female?</label>
            <ChoiceChips k="sex" columns={2} options={[{ value: 'Male', title: 'Male' }, { value: 'Female', title: 'Female' }]} />
            <Sign>Shapes your calorie burn and how fast we expect muscle to come on.</Sign>
          </div>
          <div className="cfg-block">
            <label className="cfg-label">How old are you?</label>
            <NumField k="age" suffix="years" />
            <Sign>Feeds your metabolism (BMR) — the calories you'd burn doing nothing.</Sign>
          </div>
          <div className="cfg-block">
            <label className="cfg-label">How tall are you?</label>
            <NumField k="heightCm" suffix="cm" />
            <Sign>Also part of your BMR calculation.</Sign>
          </div>
          <div className="cfg-block">
            <label className="cfg-label">What do you weigh right now?</label>
            <NumField k="startWeightKg" suffix="kg" />
            <Sign>The anchor for your calorie target and daily protein goal.</Sign>
          </div>
        </>
      ),
    },
    // 2 — goal
    {
      eyebrow: 'Your goal · 2',
      render: () => (
        <>
          <h1 className="cfg-q">What's your goal?</h1>
          <div className="cfg-block">
            <ChoiceChips k="goal" options={GOAL_CHOICES} />
            <Sign>Decides whether we chase fat loss or muscle — and how aggressive your calorie target gets.</Sign>
          </div>
          <div className="cfg-block">
            <label className="cfg-label">What weight are you aiming for?</label>
            <NumField k="goalWeightKg" suffix="kg" />
            <Sign>The finish line — sets your total change and daily deficit or surplus.</Sign>
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Over how long?</label>
            <NumField k="periodDays" suffix="days" />
            <Sign>Spreads that change across the days — longer means gentler.</Sign>
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
            <Sign>Calibrates how quickly we expect your strength and muscle to move.</Sign>
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Gym sessions / week, last 6 months</label>
            <NumField k="sessionsLast6m" suffix="/ wk" />
            <Sign>Drives the 'newbie gains' curve — fewer recent sessions means more room to grow.</Sign>
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Sessions / week you're planning now</label>
            <NumField k="gymSessionsPerWeek" suffix="/ wk" />
            <Sign>Helps your coach picture your week ahead.</Sign>
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Cardio</label>
            <NumField k="cardioMinsPerWeek" suffix="min/wk" />
            <Sign>Adds to your daily burn (TDEE).</Sign>
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Daily step goal</label>
            <NumField k="stepGoal" suffix="steps" />
            <Sign>Also part of your daily burn.</Sign>
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Weight-training intensity</label>
            <SelectField k="weightIntensity" options={INTENSITIES} />
            <Sign>Tunes how many calories your lifting burns.</Sign>
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Cardio intensity</label>
            <SelectField k="cardioIntensity" options={INTENSITIES} />
            <Sign>Tunes how many calories your cardio burns.</Sign>
          </div>
        </>
      ),
    },
    // 4 — review (system built -> coach steps in)
    {
      eyebrow: 'System built · 4',
      render: () => (
        <>
          <h1 className="cfg-q">Your system's built.</h1>
          <p className="cfg-lede">
            {i.sex}, {i.age} · {i.heightCm}cm · {i.startWeightKg}kg → {i.goalWeightKg}kg.
            Goal: {i.goal} over {i.periodDays} days.
          </p>
          <p className="cfg-lede">Now your coach steps in — they've got everything they need. Tweak any of this later in Settings → Inputs.</p>
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
            {step === 0 ? 'Build my system' : last ? 'Meet your coach' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
