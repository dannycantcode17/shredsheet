import React from 'react'
import { MUSCLE_LABELS } from '../lib/muscles.js'

// Stylised front/back figure. Each muscle region is coloured by its share
// of training volume relative to the most-worked group, so imbalances
// (e.g. all push, no pull) jump straight out.

// Cold → teal → warm scale. t in 0..1.
function heatColor(t) {
  if (!t || t <= 0) return 'rgba(120,140,160,0.10)'
  const stops = [[51, 71, 95], [90, 209, 199], [240, 179, 78]]
  const seg = t < 0.5 ? 0 : 1
  const local = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5
  const a = stops[seg], b = stops[seg + 1]
  const mix = i => Math.round(a[i] + (b[i] - a[i]) * local)
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`
}

// Region geometry. e = ellipse [cx,cy,rx,ry]; r = rounded rect [x,y,w,h].
const FRONT = [
  { group: 'shoulders', e: [50, 80, 13, 11] }, { group: 'shoulders', e: [110, 80, 13, 11] },
  { group: 'chest', r: [60, 84, 18, 26, 7] }, { group: 'chest', r: [82, 84, 18, 26, 7] },
  { group: 'biceps', e: [44, 112, 8, 17] }, { group: 'biceps', e: [116, 112, 8, 17] },
  { group: 'forearms', e: [39, 150, 7, 18] }, { group: 'forearms', e: [121, 150, 7, 18] },
  { group: 'abs', r: [68, 116, 24, 50, 6] },
  { group: 'quads', r: [60, 188, 16, 64, 8] }, { group: 'quads', r: [84, 188, 16, 64, 8] },
]
const BACK = [
  { group: 'traps', r: [64, 72, 32, 22, 8] },
  { group: 'shoulders', e: [50, 82, 13, 11] }, { group: 'shoulders', e: [110, 82, 13, 11] },
  { group: 'back', r: [58, 96, 44, 54, 10] },
  { group: 'triceps', e: [44, 112, 8, 17] }, { group: 'triceps', e: [116, 112, 8, 17] },
  { group: 'glutes', r: [60, 160, 40, 28, 12] },
  { group: 'hamstrings', r: [60, 192, 16, 56, 8] }, { group: 'hamstrings', r: [84, 192, 16, 56, 8] },
  { group: 'calves', e: [68, 280, 8, 20] }, { group: 'calves', e: [92, 280, 8, 20] },
]

function Figure({ regions, byGroup, max, title }) {
  const fill = g => heatColor(max > 0 ? byGroup[g] / max : 0)
  return (
    <div className="bh-figure">
      <svg viewBox="0 0 160 320" width="100%" height="320" role="img" aria-label={`${title} muscle volume`}>
        {/* faint skeleton for readability */}
        <g fill="rgba(255,255,255,0.05)">
          <circle cx="80" cy="34" r="16" />
          <rect x="72" y="48" width="16" height="14" rx="4" />
        </g>
        {regions.map((reg, i) => {
          const f = fill(reg.group)
          const common = { fill: f, stroke: 'rgba(255,255,255,0.10)', strokeWidth: 1 }
          const node = reg.e
            ? <ellipse cx={reg.e[0]} cy={reg.e[1]} rx={reg.e[2]} ry={reg.e[3]} {...common} />
            : <rect x={reg.r[0]} y={reg.r[1]} width={reg.r[2]} height={reg.r[3]} rx={reg.r[4]} {...common} />
          return <g key={i}><title>{`${MUSCLE_LABELS[reg.group]}: ${(byGroup[reg.group] || 0).toFixed(1)} set-equiv`}</title>{node}</g>
        })}
      </svg>
      <div className="bh-caption">{title}</div>
    </div>
  )
}

export default function BodyHeatmap({ volume }) {
  const { byGroup, max, total } = volume
  if (!total) {
    return <div className="muted" style={{ fontSize: 14 }}>Log some workouts and your trained muscles light up here.</div>
  }
  // top + neglected groups for a quick read-out
  const ranked = Object.entries(byGroup).filter(([, v]) => v >= 0).sort((a, b) => b[1] - a[1])
  const top = ranked.slice(0, 3).filter(([, v]) => v > 0)
  const cold = ranked.filter(([, v]) => v === 0).map(([g]) => g)

  return (
    <div>
      <div className="bh-views">
        <Figure regions={FRONT} byGroup={byGroup} max={max} title="Front" />
        <Figure regions={BACK} byGroup={byGroup} max={max} title="Back" />
      </div>
      <div className="bh-legend">
        <span className="bh-scale" /> <span className="faint">low</span>
        <span className="faint" style={{ marginLeft: 'auto' }}>high</span>
      </div>
      <div className="bh-readout">
        {top.length > 0 && <div><span className="faint">Most volume:</span> {top.map(([g]) => MUSCLE_LABELS[g]).join(', ')}</div>}
        {cold.length > 0 && <div style={{ marginTop: 4 }}><span className="faint">Untrained:</span> {cold.map(g => MUSCLE_LABELS[g]).join(', ')}</div>}
      </div>
    </div>
  )
}
