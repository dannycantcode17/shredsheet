import React, { useState } from 'react'

export const Eyebrow = ({ children }) => <div className="eyebrow">{children}</div>
export const Card = ({ children, className = '', ...rest }) => <div className={`card ${className}`} {...rest}>{children}</div>

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

export const StatBox = ({ label, value, tone, rows = [], explain }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="card tight stat">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${tone || ''}`}>{value}</div>
      {rows.map((r, i) => (
        <div className="stat-row" key={i}>
          <span className="k">{r.k}</span><span className={`v ${r.tone || ''}`}>{r.v}</span>
        </div>
      ))}
      {explain && (
        <>
          <button type="button" className="stat-explain" aria-expanded={open} onClick={() => setOpen(o => !o)}>
            <span>ⓘ</span> How we work this out
          </button>
          {open && <div className="stat-explain-body">{explain}</div>}
        </>
      )}
    </div>
  )
}
