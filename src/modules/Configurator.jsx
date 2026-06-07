import React, { useState, createContext, useContext } from 'react'
import { useStore } from '../state/store.jsx'
import { INTENSITIES } from '../lib/defaults.js'
import { GOAL_LABEL, GOAL_SUB } from '../components/ui.jsx'

// ============================================================
// THE CONFIGURATOR — gated onboarding flow.
// Shown on first load (state.onboarded === false). One question per
// screen — eased in, never a wall of inputs. Mobile-first.
//
// Fields read/write a local *draft* that starts blank — nothing is
// pre-selected on fresh entry. Selections persist as you move through
// the steps and only land in the store (state.inputs) on finish, so
// untouched keys keep their sensible defaults (start date, modifiers).
// ============================================================

const DraftCtx = createContext(null)
const useDraft = () => useContext(DraftCtx)
// a field counts as answered when it's neither blank nor null
const isFilled = (d, k) => d[k] !== '' && d[k] != null

// little number field used throughout the flow
function NumField({ k, suffix }) {
  const { draft, update } = useDraft()
  return (
    <div className="cfg-row" style={{ alignItems: 'center' }}>
      <input className="cfg-input" type="number" inputMode="numeric"
        value={draft[k] ?? ''} onChange={e => update({ [k]: e.target.value })} />
      {suffix && <span className="faint" style={{ flex: '0 0 auto', fontSize: 14 }}>{suffix}</span>}
    </div>
  )
}

// transparency signpost — what a field actually changes downstream
function Sign({ children }) {
  return <div className="cfg-signpost"><span className="ico">→</span><span>{children}</span></div>
}

// tappable choice chips — friendlier than a dropdown on a phone
function ChoiceChips({ k, options, columns }) {
  const { draft, update } = useDraft()
  return (
    <div className={`cfg-choices ${columns === 2 ? 'two' : ''}`}>
      {options.map(o => {
        const selected = draft[k] === o.value
        return (
          <button key={o.value} type="button"
            className={`cfg-choice ${selected ? 'selected' : ''}`}
            aria-pressed={selected}
            onClick={() => update({ [k]: o.value })}>
            <span className="c-title">{o.title}</span>
            {o.sub && <span className="c-sub">{o.sub}</span>}
          </button>
        )
      })}
    </div>
  )
}

// height with a cm <-> ft/in toggle. Only heightCm ever reaches the draft
// (and therefore the engine) — the ft/in entry is converted silently.
function HeightField() {
  const { draft, update } = useDraft()
  const [unit, setUnit] = useState('cm')
  const [ft, setFt] = useState('')
  const [inch, setInch] = useState('')

  const toCm = (f, n) => {
    const c = (parseFloat(f) || 0) * 30.48 + (parseFloat(n) || 0) * 2.54
    return c ? Math.round(c) : ''
  }
  const switchTo = (u) => {
    if (u === unit) return
    if (u === 'ft') {
      const cm = parseFloat(draft.heightCm)
      if (cm) {
        const totalIn = cm / 2.54
        const f = Math.floor(totalIn / 12)
        setFt(String(f)); setInch(String(Math.round(totalIn - f * 12)))
      }
    }
    setUnit(u)
  }
  const onFt = (v) => { setFt(v); update({ heightCm: toCm(v, inch) }) }
  const onIn = (v) => { setInch(v); update({ heightCm: toCm(ft, v) }) }

  return (
    <>
      <div className="cfg-seg" style={{ marginBottom: 12 }}>
        <button type="button" className={unit === 'cm' ? 'on' : ''} onClick={() => switchTo('cm')}>cm</button>
        <button type="button" className={unit === 'ft' ? 'on' : ''} onClick={() => switchTo('ft')}>ft / in</button>
      </div>
      {unit === 'cm' ? (
        <div className="cfg-row" style={{ alignItems: 'center' }}>
          <input className="cfg-input" type="number" inputMode="numeric"
            value={draft.heightCm ?? ''} onChange={e => update({ heightCm: e.target.value })} />
          <span className="faint" style={{ flex: '0 0 auto', fontSize: 14 }}>cm</span>
        </div>
      ) : (
        <div className="cfg-row">
          <div className="cfg-row" style={{ alignItems: 'center' }}>
            <input className="cfg-input" type="number" inputMode="numeric" placeholder="5"
              value={ft} onChange={e => onFt(e.target.value)} />
            <span className="faint" style={{ flex: '0 0 auto', fontSize: 14 }}>ft</span>
          </div>
          <div className="cfg-row" style={{ alignItems: 'center' }}>
            <input className="cfg-input" type="number" inputMode="numeric" placeholder="10"
              value={inch} onChange={e => onIn(e.target.value)} />
            <span className="faint" style={{ flex: '0 0 auto', fontSize: 14 }}>in</span>
          </div>
        </div>
      )}
      <Sign>Part of your BMR calculation.{unit === 'ft' && draft.heightCm ? ` We'll log it as ${draft.heightCm}cm.` : ''}</Sign>
    </>
  )
}

// Display order is fat-loss -> muscle; value stays the engine key.
const GOAL_CHOICES = ['Cut', 'Aggressive Cut', 'Lean Bulk', 'Bulk'].map(v => ({
  value: v, title: GOAL_LABEL[v], sub: GOAL_SUB[v],
}))

const INTENSITY_CHOICES = [
  { value: 'Relaxed', title: 'Relaxed', sub: 'Steady, plenty in the tank' },
  { value: 'Moderate', title: 'Moderate', sub: 'Working, but sustainable' },
  { value: 'Intense', title: 'Intense', sub: 'Hard graft, near the limit' },
]

// Coach voice presets. The VALUE is the tone instruction that gets appended to
// the coach's prompt (app-side); title/sub are what the user sees.
const VOICE_CHOICES = [
  { value: 'Warm, patient and supportive. Encourage effort, celebrate small wins, and never judge a slip.', title: 'Gentle & encouraging', sub: 'Supportive and kind' },
  { value: 'Direct, concise and honest. Get to the point with no fluff — clear, and still respectful.', title: 'Straight-talking', sub: 'Clear and to the point' },
  { value: 'Upbeat, energetic and motivating. Bring positive energy and momentum.', title: 'Upbeat & motivating', sub: 'High energy' },
  { value: 'Neutral and matter-of-fact. Lead with the data and clear recommendations, minimal chit-chat.', title: 'Just the facts', sub: 'Calm and analytical' },
]

// CONFIGURATOR-LOCAL goal suggestion. Pure UI maths from the draft inputs —
// deliberately NOT the engine. A realistic weekly rate as a fraction of
// bodyweight, by goal type, nudged a little by experience. Then projects an
// endpoint (if a timeframe is set) or a timeframe (if a goal weight is set).
const WEEKLY_RATE = { 'Aggressive Cut': 0.010, 'Cut': 0.0075, 'Lean Bulk': 0.0025, 'Bulk': 0.005 }
function goalSuggestion(d) {
  const startW = parseFloat(d.startWeightKg)
  const goal = d.goal
  if (!goal || !startW) return null
  const isCut = goal === 'Cut' || goal === 'Aggressive Cut'
  const expMult = d.experience === 'Beginner' ? 1.15 : d.experience === 'Advanced' ? 0.9 : 1
  const weekly = startW * WEEKLY_RATE[goal] * expMult // kg/week (magnitude)
  const days = parseFloat(d.periodDays)
  const goalW = parseFloat(d.goalWeightKg)

  if (days) {
    const delta = weekly * (days / 7)
    const endpoint = Math.round(isCut ? startW - delta : startW + delta)
    const body = isCut
      ? `At a steady ${weekly.toFixed(1)}kg/week, ${Math.round(startW)}kg over ${Math.round(days)} days lands around ${endpoint}kg — mostly fat, if your protein and training stay consistent.`
      : `Muscle builds slowly — about ${weekly.toFixed(2)}kg/week. Over ${Math.round(days)} days that's roughly ${Math.round(startW)}kg to ${endpoint}kg, with fat kept in check.`
    return { head: 'A realistic target', body, action: { label: `Use ${endpoint}kg as my target`, patch: { goalWeightKg: endpoint } } }
  }
  if (goalW) {
    const needDays = Math.max(7, Math.round((Math.abs(goalW - startW) / weekly) * 7))
    const body = isCut
      ? `At a steady ${weekly.toFixed(1)}kg/week, ${Math.round(startW)}kg to ${Math.round(goalW)}kg takes about ${needDays} days. A steadier pace helps protect your muscle.`
      : `At about ${weekly.toFixed(2)}kg/week of lean mass, ${Math.round(startW)}kg to ${Math.round(goalW)}kg takes roughly ${needDays} days.`
    return { head: 'Suggested timeframe', body, action: { label: `Use ${needDays} days`, patch: { periodDays: needDays } } }
  }
  const body = isCut
    ? `A steady pace is about ${weekly.toFixed(1)}kg/week — roughly ${(weekly * 4).toFixed(1)}kg a month, mostly fat. Add a target weight or timeframe for a full projection.`
    : `Expect about ${weekly.toFixed(2)}kg/week of lean mass with fat in check. Add a target weight or timeframe for a full projection.`
  return { head: 'A realistic pace', body, action: null }
}

function GoalSuggestion() {
  const { draft, update } = useDraft()
  const s = goalSuggestion(draft)
  if (!s) return null
  return (
    <div className="cfg-suggest">
      <div className="s-head">💡 {s.head}</div>
      <div className="s-body">{s.body}</div>
      {s.action && <button type="button" className="btn" onClick={() => update(s.action.patch)}>{s.action.label}</button>}
    </div>
  )
}

// What do you train? Exercises grouped by equipment type — the user toggles
// the ones they do regularly. Two jobs: (1) gauge training level from the
// pattern (the heavy technical compounds count for more), and (2) persist the
// selection so the gym plan can be built from it later (via the Claude
// connector). The big barbell lifts + weighted bodyweight read as "technical".
const EXERCISE_GROUPS = [
  {
    label: 'Barbell', emoji: '🏋️',
    items: ['Back Squat', 'Deadlift', 'Bench Press', 'Overhead Press', 'Barbell Row', 'Romanian Deadlift'],
    technical: true,
  },
  {
    label: 'Dumbbell', emoji: '🛎️',
    items: ['DB Bench Press', 'DB Shoulder Press', 'DB Row', 'DB Curl', 'Lateral Raise', 'DB Lunge'],
    technical: false,
  },
  {
    label: 'Machine & cable', emoji: '⚙️',
    items: ['Leg Press', 'Lat Pulldown', 'Cable Row', 'Leg Curl', 'Cable Fly', 'Tricep Pushdown'],
    technical: false,
  },
  {
    label: 'Bodyweight', emoji: '🤸',
    items: ['Pull-up', 'Chin-up', 'Dip', 'Push-up', 'Hanging Leg Raise', 'Nordic Curl'],
    technical: false,
  },
]
// heavy compounds that signal a more advanced trainer
const TECHNICAL = new Set([
  'Back Squat', 'Deadlift', 'Bench Press', 'Overhead Press', 'Barbell Row', 'Romanian Deadlift',
  'Pull-up', 'Chin-up', 'Dip', 'Nordic Curl',
])
function inferExperience(list) {
  if (!list.length) return ''
  const tech = list.filter(n => TECHNICAL.has(n)).length
  const score = list.length + tech * 0.6
  if (score <= 4) return 'Beginner'
  if (score <= 10) return 'Intermediate'
  return 'Advanced'
}

function ExerciseGrid() {
  const { draft, update } = useDraft()
  const selected = draft.exercisesDone || []
  const toggle = (name) => {
    const next = selected.includes(name) ? selected.filter(x => x !== name) : [...selected, name]
    update({ exercisesDone: next, experience: inferExperience(next) })
  }
  return (
    <>
      <p className="cfg-lede" style={{ marginBottom: 18 }}>Tap the lifts you do regularly — barbell, dumbbell, machine or bodyweight. This shapes your plan and reads your level.</p>
      {EXERCISE_GROUPS.map(g => (
        <div className="cfg-grp" key={g.label}>
          <div className="cfg-grp-label"><span>{g.emoji}</span>{g.label}</div>
          <div className="cfg-grid">
            {g.items.map(name => {
              const on = selected.includes(name)
              return (
                <button key={name} type="button" className={`cfg-tile ${on ? 'selected' : ''}`}
                  aria-pressed={on} onClick={() => toggle(name)}>
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <Sign>
        {draft.experience
          ? `Reading you as ${draft.experience.toLowerCase()} from this — it tunes how fast we expect strength and muscle to move, and seeds your gym plan.`
          : 'No need to label yourself — we read your training level from what you pick.'}
      </Sign>
    </>
  )
}

// Claude spark mark — a radial burst in Claude's signature warm colour.
function ClaudeMark({ size = 60 }) {
  const rays = Array.from({ length: 12 }, (_, idx) => {
    const a = (idx * 30) * Math.PI / 180
    const r1 = 13
    const r2 = idx % 2 ? 30 : 42
    return <line key={idx} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} />
  })
  return (
    <svg viewBox="-50 -50 100 100" width={size} height={size} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="7" strokeLinecap="round">{rays}</g>
    </svg>
  )
}

// PLACEHOLDER step — the Claude connector. Non-functional for now; it holds
// the spot for the headless / Claude-MCP integration (the coach reading your
// data and building/running your plan). 'Connect' just acknowledges intent.
function ClaudeConnect() {
  const [asked, setAsked] = useState(false)
  return (
    <>
      <div className="cfg-mark"><ClaudeMark /></div>
      <span className="pill muted" style={{ marginBottom: 10 }}>Coming soon</span>
      <h1 className="cfg-q">Connect Claude.</h1>
      <p className="cfg-lede">This is the good bit. Hook up Claude and the Shredsheet starts running itself — your coach reads every number, builds your plan, and can act on it. Even hands-free.</p>
      <button type="button" className="cfg-connect-btn" onClick={() => setAsked(true)}>
        <ClaudeMark size={18} /> Connect Claude
      </button>
      {asked
        ? <div className="cfg-signpost" style={{ marginTop: 14 }}><span className="ico">✦</span><span>Coming soon — we're wiring this up. Your spot's saved, and your coach still works the moment you're set up.</span></div>
        : <div className="cfg-signpost" style={{ marginTop: 14 }}><span className="ico">→</span><span>No rush — you can do this any time. Skip ahead and your coach still has your back.</span></div>}
    </>
  )
}

// PLACEHOLDER step — pick a cinematic background "vibe". Saves the preference;
// full theming is on the way (this isn't a boring dark/light toggle).
const VIBES = [
  { value: 'Beach', title: 'Beach', sub: 'The original — sun, sea, calm', grad: 'linear-gradient(180deg,#0a1628,#1a2c4a 48%,#8fb0c4)' },
  { value: 'Dusk', title: 'Dusk', sub: 'Warm sunset haze', grad: 'linear-gradient(180deg,#1a1026,#5a2b3e 55%,#f0a35e)' },
  { value: 'Aurora', title: 'Aurora', sub: 'Cool northern lights', grad: 'linear-gradient(180deg,#06121f,#0f3b3a 50%,#57e08b)' },
  { value: 'Midnight', title: 'Midnight', sub: 'Deep, dark focus', grad: 'linear-gradient(180deg,#05080f,#0d1424 70%,#1a2c4a)' },
  { value: 'Daylight', title: 'Light', sub: 'Clean and bright', grad: 'linear-gradient(180deg,#eef3f8,#cdd9e6 60%,#9fb3c7)' },
]
function VibePicker() {
  const { draft, update } = useDraft()
  return (
    <>
      <div className="cfg-vibes">
        {VIBES.map(v => {
          const on = draft.vibe === v.value
          return (
            <button key={v.value} type="button" className={`cfg-vibe ${on ? 'selected' : ''}`}
              aria-pressed={on} onClick={() => update({ vibe: v.value })}>
              <div className="cfg-vibe-prev" style={{ background: v.grad }} />
              <div className="cfg-vibe-meta">
                <div className="v-title">{v.title}{v.value === 'Beach' ? ' · now' : ''}</div>
                <div className="v-sub">{v.sub}</div>
              </div>
            </button>
          )
        })}
      </div>
      <Sign>Sets the mood of your whole app. More vibes on the way — full theming's coming, this just saves your pick.</Sign>
    </>
  )
}

export default function Configurator() {
  const { setInputs, setOnboarded, setView } = useStore()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState({}) // starts blank — nothing pre-selected
  const update = (patch) => setDraft(d => ({ ...d, ...patch }))
  const i = draft

  // One question per screen. Each step: { eyebrow, render }.
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
          <p className="cfg-lede">First we build your system — who you are, what you're chasing. One quick question at a time.</p>
          <div className="cfg-signpost"><span className="ico">🔒</span><span>Your coach joins once your system is set — no point coaching a blank sheet.</span></div>
        </>
      ),
    },

    // — Coach voice (asked early; sets the tone for the whole journey) —
    {
      eyebrow: 'Your coach',
      render: () => (
        <>
          <h1 className="cfg-q">How should your coach talk to you?</h1>
          <ChoiceChips k="coachVoice" options={VOICE_CHOICES} />
          <Sign>Sets your coach's tone — pick whatever feels right. You can change it later, and it never affects your numbers.</Sign>
        </>
      ),
    },

    // — About you (one per screen) —
    {
      eyebrow: 'About you',
      requires: 'sex',
      render: () => (
        <>
          <h1 className="cfg-q">Are you male or female?</h1>
          <ChoiceChips k="sex" columns={2} options={[{ value: 'Male', title: 'Male' }, { value: 'Female', title: 'Female' }]} />
          <Sign>Shapes your calorie burn and how fast we expect muscle to come on.</Sign>
        </>
      ),
    },
    {
      eyebrow: 'About you',
      requires: 'age',
      render: () => (
        <>
          <h1 className="cfg-q">How old are you?</h1>
          <NumField k="age" suffix="years" />
          <Sign>Feeds your metabolism (BMR) — the calories you'd burn doing nothing.</Sign>
        </>
      ),
    },
    {
      eyebrow: 'About you',
      requires: 'heightCm',
      render: () => (
        <>
          <h1 className="cfg-q">How tall are you?</h1>
          <HeightField />
        </>
      ),
    },
    {
      eyebrow: 'About you',
      requires: 'startWeightKg',
      render: () => (
        <>
          <h1 className="cfg-q">What do you weigh right now?</h1>
          <NumField k="startWeightKg" suffix="kg" />
          <Sign>The anchor for your calorie target and daily protein goal.</Sign>
        </>
      ),
    },

    // — Your goal (all on one screen) —
    {
      eyebrow: 'Your goal',
      requires: ['goal', 'goalWeightKg', 'periodDays'],
      render: () => (
        <>
          <h1 className="cfg-q">What are you aiming for?</h1>
          <div className="cfg-block">
            <label className="cfg-label">Your goal</label>
            <ChoiceChips k="goal" options={GOAL_CHOICES} />
            <Sign>Sets whether we focus on losing fat or building muscle, and how your calorie target is shaped.</Sign>
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Target weight</label>
            <NumField k="goalWeightKg" suffix="kg" />
          </div>
          <div className="cfg-block">
            <label className="cfg-label">Over how long?</label>
            <NumField k="periodDays" suffix="days" />
          </div>
          <GoalSuggestion />
        </>
      ),
    },

    // — Training (one per screen) —
    {
      eyebrow: 'Training',
      render: () => (
        <>
          <h1 className="cfg-q">What do you train?</h1>
          <ExerciseGrid />
        </>
      ),
    },
    {
      eyebrow: 'Training',
      render: () => (
        <>
          <h1 className="cfg-q">Gym sessions a week, lately?</h1>
          <NumField k="sessionsLast6m" suffix="/ wk" />
          <Sign>Your average over the last 6 months — drives the 'newbie gains' curve. Fewer recent sessions, more room to grow.</Sign>
        </>
      ),
    },
    {
      eyebrow: 'Training',
      render: () => (
        <>
          <h1 className="cfg-q">And how many are you planning now?</h1>
          <NumField k="gymSessionsPerWeek" suffix="/ wk" />
          <Sign>Helps your coach picture the week ahead.</Sign>
        </>
      ),
    },
    {
      eyebrow: 'Training',
      render: () => (
        <>
          <h1 className="cfg-q">How much cardio a week?</h1>
          <NumField k="cardioMinsPerWeek" suffix="min/wk" />
          <Sign>Adds to your daily burn (TDEE). Zero's fine.</Sign>
        </>
      ),
    },
    {
      eyebrow: 'Training',
      render: () => (
        <>
          <h1 className="cfg-q">Daily step goal?</h1>
          <NumField k="stepGoal" suffix="steps" />
          <Sign>Also part of your daily burn.</Sign>
        </>
      ),
    },
    {
      eyebrow: 'Training',
      render: () => (
        <>
          <h1 className="cfg-q">How hard do you lift?</h1>
          <ChoiceChips k="weightIntensity" options={INTENSITY_CHOICES} />
          <Sign>Tunes how many calories your lifting burns.</Sign>
        </>
      ),
    },
    {
      eyebrow: 'Training',
      render: () => (
        <>
          <h1 className="cfg-q">How hard's your cardio?</h1>
          <ChoiceChips k="cardioIntensity" options={INTENSITY_CHOICES} />
          <Sign>Tunes how many calories your cardio burns.</Sign>
        </>
      ),
    },

    // — Connect Claude (placeholder) —
    {
      eyebrow: 'Your coach',
      render: () => <ClaudeConnect />,
    },

    // — Your vibe (placeholder) —
    {
      eyebrow: 'Your vibe',
      render: () => (
        <>
          <span className="pill muted" style={{ marginBottom: 10 }}>Preview</span>
          <h1 className="cfg-q">Pick your vibe.</h1>
          <VibePicker />
        </>
      ),
    },

    // — review (system built -> coach steps in) —
    {
      eyebrow: 'System built',
      render: () => (
        <>
          <h1 className="cfg-q">Your system's built.</h1>
          <p className="cfg-lede">
            {(i.sex || '—')}, {(i.age || '—')} · {(i.heightCm || '—')}cm · {(i.startWeightKg || '—')}kg → {(i.goalWeightKg || '—')}kg.
            Goal: {(i.goal ? GOAL_LABEL[i.goal] : '—')} over {(i.periodDays || '—')} days.
          </p>
          <p className="cfg-lede">Now your coach steps in — they've got everything they need. Tweak any of this later in Settings → Inputs.</p>
        </>
      ),
    },
  ]

  const last = step === steps.length - 1
  const finish = () => {
    // commit only the values the user actually filled in; untouched keys
    // keep their store defaults (start date, metabolism/muscle modifiers).
    const filled = Object.fromEntries(
      Object.entries(draft).filter(([, v]) => v !== '' && v != null)
    )
    setInputs(filled)
    setOnboarded(true)
    setView('dashboard')
  }
  const req = steps[step].requires
  const stepOk = !req || (Array.isArray(req) ? req.every(k => isFilled(draft, k)) : isFilled(draft, req))
  const next = () => { if (!stepOk) return; last ? finish() : setStep(s => s + 1) }
  const back = () => setStep(s => Math.max(0, s - 1))
  const pct = `${(step / (steps.length - 1)) * 100}%`

  return (
    <DraftCtx.Provider value={{ draft, update }}>
      <div className="cfg-root app-root">
        <div className="cfg-shell">
          <div className="cfg-progress" aria-hidden="true">
            <div className="fill" style={{ width: pct }} />
          </div>

          <div className="cfg-card" key={step}>
            <div className="cfg-eyebrow">{steps[step].eyebrow}</div>
            {steps[step].render()}
          </div>

          <div className="cfg-nav">
            {step > 0 && <button className="btn back" onClick={back}>←</button>}
            <button className="btn primary" onClick={next} disabled={!stepOk}>
              {step === 0 ? 'Build my system' : last ? 'Meet your coach' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </DraftCtx.Provider>
  )
}
