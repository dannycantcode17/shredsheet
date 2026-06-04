import React, { useState } from 'react'

export const Eyebrow = ({ children }) => <div className="eyebrow">{children}</div>
export const Card = ({ children, className = '', ...rest }) => <div className={`card ${className}`} {...rest}>{children}</div>

// Value 4: estimates are labelled as estimates, never dressed as measurements.
export const Estimate = () => <span className="chip-est" title="An estimate from the model, not a measurement">est.</span>

// Value 3 & 5: inspectable depths, on consent. A quiet toggle that reveals the
// plain-English basis for a number — the coach's "want the lowdown?" in UI form.
export function Explain({ children, label = 'How we estimate this' }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="explain">
      <button type="button" className="explain-toggle" onClick={() => setOpen(o => !o)}>
        {open ? '× Hide' : `ⓘ ${label}`}
      </button>
      {open && <div className="explain-body">{children}</div>}
    </div>
  )
}

export const PageHead = ({ eyebrow, title, sub }) => (
  <div style={{ marginBottom: 8 }}>
    <Eyebrow>{eyebrow}</Eyebrow>
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

export const fmt = (x, dp = 1, signed = false) => {
  if (x == null || Number.isNaN(x)) return '–'
  const v = Number(x).toFixed(dp)
  return signed && x >= 0 ? `+${v}` : v
}

export const StatBox = ({ label, value, tone, rows = [], estimate = false, explain = null }) => (
  <div className="card tight stat">
    <div className="stat-label">{label}{estimate && <Estimate />}</div>
    <div className={`stat-value ${tone || ''}`}>{value}</div>
    {rows.map((r, i) => (
      <div className="stat-row" key={i}>
        <span className="k">{r.k}</span><span className={`v ${r.tone || ''}`}>{r.v}</span>
      </div>
    ))}
    {explain && <Explain>{explain}</Explain>}
  </div>
)
