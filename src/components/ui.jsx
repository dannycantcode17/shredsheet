import React, { useState } from 'react'
import { Icon } from './icons.jsx'

export const Eyebrow = ({ children }) => <div className="eyebrow">{children}</div>
export const Card = ({ children, className = '', ...rest }) => <div className={`card ${className}`} {...rest}>{children}</div>

export const PageHead = ({ eyebrow, title, sub }) => (
  <div style={{ marginBottom: 8 }}>
    {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
    <h1 className="page">{title}</h1>
    {sub && <p className="page-sub">{sub}</p>}
  </div>
)

export const Field = ({ label, hint, children }) => (
  <div className="field">
    <label>{label}</label>
    {children}
    {hint && <div className="hint">{hint}</div>}
  </div>
)

export const Pill = ({ tone = 'muted', children }) => <span className={`pill ${tone}`}>{children}</span>

// Friendly, inclusive labels for the goal modes. KEYS are the engine's stored
// values (do not change them) — these are display-only.
export const GOAL_LABEL = {
  'Cut': 'Lose fat',
  'Aggressive Cut': 'Lose fat (faster)',
  'Lean Bulk': 'Build muscle, stay lean',
  'Bulk': 'Build muscle & size',
}
export const GOAL_SUB = {
  'Cut': 'Drop body fat, keep your muscle',
  'Aggressive Cut': 'Quicker fat loss, a steeper deficit',
  'Lean Bulk': 'Gain muscle while keeping fat in check',
  'Bulk': 'Maximise size, accept a little fat',
}

export const fmt = (x, dp = 1, signed = false) => {
  if (x == null || Number.isNaN(x)) return '–'
  const v = Number(x).toFixed(dp)
  return signed && x >= 0 ? `+${v}` : v
}

// Designed empty state: icon badge + headline + sub + optional CTA.
export const EmptyState = ({ icon = 'sparkles', title, sub, action, onAction, card = true }) => {
  const body = (
    <div className="empty">
      <span className="e-ico"><Icon name={icon} /></span>
      <h3 className="e-title">{title}</h3>
      {sub && <p className="e-sub">{sub}</p>}
      {action && <button className="btn primary" onClick={onAction}>{action}</button>}
    </div>
  )
  return card ? <Card>{body}</Card> : body
}

// Progress meter toward a daily target. Pure presentation — value/target
// arrive precomputed; no engine maths here.
export const Meter = ({ label, value, target, unit = '', tone, overTone = 'over' }) => {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  const over = target > 0 && value > target
  return (
    <div className="meter">
      <div className="meter-head">
        <span className="m-label">{label}</span>
        <span className="m-val"><b>{Math.round(value)}</b> / {Math.round(target)}{unit}</span>
      </div>
      <div className="meter-track">
        <div className={`meter-fill ${over ? overTone : ''} ${tone || ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export const Spinner = () => <span className="spin" aria-hidden="true" />

// SVG progress ring — the Today screen's calorie hero. Pure presentation.
export const Ring = ({ value, max, size = 176, stroke = 13, over = false, children }) => {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,168,205,0.13)" strokeWidth={stroke} />
        <circle
          className={`ring-fill ${over ? 'over' : ''}`}
          cx={size / 2} cy={size / 2} r={r} fill="none"
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}

// Thumb-sized numeric stepper: −/+ buttons around a typeable field.
// Replaces bare spreadsheet-style number cells everywhere a phone thumb works.
export const Stepper = ({ label, value, onChange, step = 1, min = 0, placeholder = '' }) => {
  const bump = (d) => {
    const base = parseFloat(value)
    const next = Math.max(min, Math.round(((Number.isFinite(base) ? base : 0) + d) * 100) / 100)
    onChange(String(next))
  }
  return (
    <div className="stepper">
      {label && <span className="st-label">{label}</span>}
      <div className="st-row">
        <button type="button" className="st-btn" aria-label={`Decrease ${label || 'value'}`} onClick={() => bump(-step)}>−</button>
        <input type="number" inputMode="decimal" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
        <button type="button" className="st-btn" aria-label={`Increase ${label || 'value'}`} onClick={() => bump(step)}>+</button>
      </div>
    </div>
  )
}

export const StatBox = ({ label, value, tone, rows = [], info }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="card tight stat">
      <div className="stat-label">{label}{info && <button type="button" className="stat-i" aria-label={`What does ${label} mean?`} aria-expanded={open} onClick={() => setOpen(o => !o)}>i</button>}</div>
      <div className={`stat-value ${tone || ''}`}>{value}</div>
      {info && open && <div className="stat-info">{info}</div>}
      {rows.map((r, i) => (
        <div className="stat-row" key={i}>
          <span className="k">{r.k}</span><span className={`v ${r.tone || ''}`}>{r.v}</span>
        </div>
      ))}
    </div>
  )
}
