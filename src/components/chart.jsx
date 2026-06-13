import React from 'react'

// ============================================================
// Shared recharts theme — one place for the chart look.
// Bold choice: axis lines and tick marks are gone entirely;
// the data carries the chart. Soft horizontal grid only,
// glassy tooltip, and gradient fills defined once here.
// ============================================================

export const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: 'rgba(226,233,245,0.42)', fontSize: 11, fontFamily: 'inherit' },
  stroke: 'rgba(226,233,245,0.42)',
}

export const gridProps = {
  stroke: 'rgba(148,168,205,0.08)',
  strokeDasharray: '3 6',
  vertical: false,
}

export const tooltipProps = {
  contentStyle: {
    background: 'rgba(12,17,30,0.94)',
    border: '1px solid rgba(148,168,205,0.26)',
    borderRadius: 14,
    fontSize: 12,
    boxShadow: '0 24px 64px -16px rgba(2,5,14,0.9)',
    padding: '10px 14px',
  },
  labelStyle: { color: 'rgba(226,233,245,0.55)', fontWeight: 600, marginBottom: 4 },
  itemStyle: { padding: '1px 0' },
  cursor: { fill: 'rgba(148,168,205,0.06)', stroke: 'rgba(148,168,205,0.2)' },
}

export const C = {
  accent: '#2de3c4',
  fat: '#6aa6ff',
  muscle: '#4ee08d',
  warn: '#f7b955',
  pink: '#f06fa8',
  violet: '#a78bfa',
  ghost: 'rgba(226,233,245,0.3)',
}
export const SERIES = [C.accent, C.fat, C.muscle, C.warn, C.pink, C.violet]

// Vertical gradients for bar fills — render <ChartDefs/> inside a chart and
// reference e.g. fill="url(#grad-accent)".
export const ChartDefs = () => (
  <defs>
    {Object.entries({ accent: C.accent, fat: C.fat, muscle: C.muscle, warn: C.warn }).map(([k, color]) => (
      <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0.95} />
        <stop offset="100%" stopColor={color} stopOpacity={0.45} />
      </linearGradient>
    ))}
    {Object.entries({ accent: C.accent, fat: C.fat, muscle: C.muscle }).map(([k, color]) => (
      <linearGradient key={`a-${k}`} id={`area-${k}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0.28} />
        <stop offset="100%" stopColor={color} stopOpacity={0.02} />
      </linearGradient>
    ))}
  </defs>
)
