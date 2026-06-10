import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, StatBox, EmptyState, fmt } from '../components/ui.jsx'
import { cleanliness } from '../lib/engine.js'
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { axisProps, gridProps, tooltipProps, ChartDefs, C } from '../components/chart.jsx'

export default function BodycompDash({ embedded }) {
  const { planRes, daily, setView } = useStore()
  const days = planRes.days
  const lastLogged = daily.rows.reduce((m, r) => (r.logged ? r.dayNum : m), 0)
  // Combined Shred Curve: muscle rises above zero, fat falls below it — same kg axis.
  const curve = daily.rows.map(r => ({
    day: r.dayNum,
    muscleActual: r.dayNum <= lastLogged ? r.cumMuscle : null,
    muscleTarget: planRes.muscleChange * (r.dayNum / days),
    fatActual: r.dayNum <= lastLogged ? r.cumFat : null, // negative = fat lost → trends down
    fatTarget: planRes.fatChange * (r.dayNum / days),
  }))
  const actualClean = cleanliness(daily.cumWeight, daily.cumFat, daily.cumMuscle)
  const noData = lastLogged === 0

  return (
    <>
      {!embedded && <PageHead title="Bodycomp" sub="Planned vs actual — fat & muscle." />}
      {noData && (
        <div style={{ marginBottom: 14 }}>
          <EmptyState icon="trend" title="Your curves start here"
            sub="Log a few days of weight and calories and your actual fat & muscle lines draw themselves over the targets."
            action="Open the Daily Log" onAction={() => setView('daily')} />
        </div>
      )}

      <Card>
        <div className="chart-title">Shred curve · <b>muscle up, fat down (kg)</b></div>
        <div className="chart-wrap"><ResponsiveContainer>
          {/* actuals get a soft gradient fill so they read as "real" against the dashed plan */}
          <ComposedChart data={curve} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
            <ChartDefs />
            <CartesianGrid {...gridProps} /><XAxis dataKey="day" {...axisProps} /><YAxis {...axisProps} /><Tooltip {...tooltipProps} />
            <ReferenceLine y={0} stroke="rgba(226,233,245,0.2)" />
            <ReferenceLine x={lastLogged || null} stroke="rgba(226,233,245,0.3)" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="muscleTarget" stroke={C.muscle} strokeDasharray="5 5" strokeOpacity={0.55} dot={false} strokeWidth={1.8} />
            <Area type="monotone" dataKey="muscleActual" stroke={C.muscle} fill="url(#area-muscle)" dot={false} strokeWidth={2.6} connectNulls />
            <Line type="monotone" dataKey="fatTarget" stroke={C.fat} strokeDasharray="5 5" strokeOpacity={0.55} dot={false} strokeWidth={1.8} />
            <Area type="monotone" dataKey="fatActual" stroke={C.fat} fill="url(#area-fat)" dot={false} strokeWidth={2.6} connectNulls />
          </ComposedChart>
        </ResponsiveContainer></div>
        <div className="legend">
          <span className="key"><span className="swatch" style={{ background: C.muscle }} />Muscle</span>
          <span className="key"><span className="swatch" style={{ background: C.fat }} />Fat</span>
          <span className="key"><span className="swatch" style={{ background: 'rgba(226,233,245,0.4)' }} />Target (dashed)</span>
        </div>
      </Card>

      <h2 className="section">Plan vs actual</h2>
      <div className="grid cols-3">
        <StatBox label="Muscle change (kg)" value={fmt(daily.cumMuscle, 2, true)} tone={daily.cumMuscle >= 0 ? 'pos' : 'neg'} rows={[{ k: 'Plan (period)', v: fmt(planRes.muscleChange, 1, true) }]} />
        <StatBox label="Fat change (kg)" value={fmt(daily.cumFat, 2, true)} tone={daily.cumFat <= 0 ? 'pos' : 'neg'} rows={[{ k: 'Plan (period)', v: fmt(planRes.fatChange, 1, true) }]} />
        <StatBox label="Shred efficiency" value={`${Math.round(actualClean * 100)}%`} tone={actualClean >= 0.5 ? 'pos' : 'neg'} rows={[{ k: 'Plan', v: `${Math.round(planRes.cleanliness * 100)}%` }]} info="How clean your change is — the share that's the good kind (muscle up, fat down). 50%+ is solid." />
      </div>
    </>
  )
}
