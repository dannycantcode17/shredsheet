import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useStore } from '../state/store.jsx'
import { QUESTIONS, classify } from '../lib/configurator.js'
import { TRACK_LABELS } from '../lib/systems.js'
import { askCoach } from '../lib/ai.js'

// Coach is the single AI persona across onboarding and coaching. Here she/he
// greets the athlete, explains the Shredsheet, and (at the end) reads back the
// system they've been assigned — personalised by the live model when available.

function CoachBadge({ children }) {
  return (
    <div className="coach-badge">
      <span className="coach-dot" />
      <span className="coach-name">Coach</span>
      {children}
    </div>
  )
}

function Intro({ onStart }) {
  return (
    <div className="config-stage">
      <CoachBadge />
      <h1 className="config-h1">Right — let's build your system.</h1>
      <p className="config-lead">
        The Shredsheet started life as an obsessively-engineered spreadsheet: an engine that turns
        your training and nutrition into honest answers about muscle and fat. I'm Coach — the voice
        on top of that engine.
      </p>
      <p className="config-lead">
        I'll ask you a handful of questions, one at a time. No essays, no judgement. By the end I'll
        have matched you to one of eight systems and set the maths up around <em>you</em>.
      </p>
      <div className="config-nav">
        <button className="btn primary lg" onClick={onStart}>Let's go →</button>
      </div>
    </div>
  )
}

function ChoiceQuestion({ q, value, onChoose }) {
  return (
    <div className="opt-list">
      {q.options.map(o => (
        <button
          key={String(o.value)}
          className={`opt ${value === o.value ? 'selected' : ''}`}
          onClick={() => onChoose(o.value)}
        >
          <span className="opt-label">{o.label}</span>
          {o.desc && <span className="opt-desc">{o.desc}</span>}
        </button>
      ))}
    </div>
  )
}

function NumberQuestion({ q, value, onChange, onNext }) {
  const valid = value !== '' && value != null && Number(value) >= q.min && Number(value) <= q.max
  return (
    <div className="num-wrap">
      <div className="num-field">
        <input
          type="number" autoFocus inputMode="decimal"
          placeholder={q.placeholder} value={value ?? ''}
          min={q.min} max={q.max}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && valid) onNext() }}
        />
        {q.unit && <span className="num-unit">{q.unit}</span>}
      </div>
      <button className="btn primary lg" disabled={!valid} onClick={onNext}>Next →</button>
    </div>
  )
}

function Reveal({ result, apiKey, onEnter }) {
  const { system, tracking, inputsPatch } = result
  const [welcome, setWelcome] = useState('')
  const [busy, setBusy] = useState(true)
  const tracked = Object.keys(TRACK_LABELS).filter(k => tracking[k])

  useEffect(() => {
    let cancelled = false
    const ctx = `You are Coach, the voice of The Shredsheet — warm, sharp, encouraging, never cringe, British English. The Shredsheet began as an obsessively-engineered training-and-nutrition spreadsheet; you are the coaching layer on top of its engine. Never mention any individual creator. Reply in plain prose: no headings, no bullet points, no emoji.`
    const msg = `Welcome the athlete in three short sentences. They've just been assigned the "${system.label}" system — ${system.tagline} They are ${inputsPatch.experience.toLowerCase()} level, ${inputsPatch.sex.toLowerCase()}, going from ${inputsPatch.startWeightKg}kg to ${inputsPatch.goalWeightKg}kg over ${inputsPatch.periodDays} days. Make it specific to their system and goal, and end with a line of encouragement.`
    askCoach({ messages: [{ role: 'user', content: msg }], context: ctx, apiKey })
      .then(t => { if (!cancelled && t && !t.startsWith('⚠️')) setWelcome(t) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBusy(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="config-stage reveal">
      <CoachBadge />
      <div className="reveal-eyebrow">Your system</div>
      <h1 className="config-h1 accent">{system.label}</h1>
      <p className="config-lead">{system.tagline}</p>

      <div className="reveal-coach">
        {busy && !welcome
          ? <span className="shimmer">Coach is reading your answers…</span>
          : (welcome || `You're set up for ${system.label.toLowerCase()} — ${inputsPatch.experience.toLowerCase()} level, ${inputsPatch.startWeightKg}kg heading for ${inputsPatch.goalWeightKg}kg over ${inputsPatch.periodDays} days. Let's get to work.`)}
      </div>

      <div className="reveal-track">
        <div className="reveal-track-head">What you'll track</div>
        <div className="reveal-pills">
          {tracked.map(k => <span key={k} className="pill good">{TRACK_LABELS[k]}</span>)}
        </div>
        <div className="reveal-note">
          {tracking.muscleEstimation
            ? 'Full muscle & fat estimation is unlocked — you log enough for the engine to do its best work.'
            : "Heads up: muscle estimation needs calorie + bodyweight logging. You can switch that on any time in Settings to unlock it."}
        </div>
      </div>

      <div className="config-nav">
        <button className="btn primary lg" onClick={onEnter}>Enter The Shredsheet →</button>
      </div>
    </div>
  )
}

export default function Configurator() {
  const { state, completeOnboarding, setView } = useStore()
  const [phase, setPhase] = useState('intro')   // 'intro' | 'questions' | 'reveal'
  const [qi, setQi] = useState(0)
  const [answers, setAnswers] = useState({})
  const advanceTimer = useRef()

  useEffect(() => () => clearTimeout(advanceTimer.current), [])

  const q = QUESTIONS[qi]
  const result = useMemo(() => (phase === 'reveal' ? classify(answers) : null), [phase, answers])

  const goNext = () => { if (qi < QUESTIONS.length - 1) setQi(qi + 1); else setPhase('reveal') }
  const goBack = () => { if (qi > 0) setQi(qi - 1); else setPhase('intro') }
  const setAnswer = (key, value) => setAnswers(a => ({ ...a, [key]: value }))
  const choose = (key, value) => { setAnswer(key, value); advanceTimer.current = setTimeout(goNext, 170) }

  const finish = () => {
    completeOnboarding({ systemId: result.systemId, inputsPatch: result.inputsPatch, tracking: result.tracking })
    setView('bodycomp')
  }

  return (
    <div className="config-root">
      <div className="config-bg" />
      <div className="config-card" key={phase + qi /* re-trigger entrance animation */}>
        {phase === 'intro' && <Intro onStart={() => { setPhase('questions'); setQi(0) }} />}

        {phase === 'questions' && (
          <div className="config-stage">
            <div className="config-progress">
              <div className="config-progress-bar" style={{ width: `${(qi / QUESTIONS.length) * 100}%` }} />
            </div>
            <div className="config-step-no">Question {qi + 1} of {QUESTIONS.length}</div>
            <h1 className="config-h1 q">{q.prompt}</h1>
            {q.sub && <p className="config-lead sub">{q.sub}</p>}

            {q.kind === 'choice'
              ? <ChoiceQuestion q={q} value={answers[q.key]} onChoose={v => choose(q.key, v)} />
              : <NumberQuestion q={q} value={answers[q.key]} onChange={v => setAnswer(q.key, v)} onNext={goNext} />}

            <div className="config-nav between">
              <button className="btn ghost" onClick={goBack}>← Back</button>
            </div>
          </div>
        )}

        {phase === 'reveal' && result && (
          <Reveal result={result} apiKey={state.apiKey} onEnter={finish} />
        )}
      </div>
    </div>
  )
}
