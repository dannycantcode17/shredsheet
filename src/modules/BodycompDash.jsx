import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, StatBox, EmptyState, ChartTabs, fmt } from '../components/ui.jsx'
import { cleanliness } from '../lib/engine.js'
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { axisProps, gridProps, tooltipProps, ChartDefs, C } from '../components/chart.jsx'

// BODY — the crown-jewel Shred Curve plus a scale-weight trend.
// All series come straight from the engine's daily rows; the only
// derivation added here is the linear plan line for scale weight
// (start → goal across the period), which is pure presentation.
export default function BodycompDash({ embedded }) {
  const { state, planRes, daily, setView } = useStore()
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
  const [chart, setChart] = useState('curve')

  // scale-weight trend: logged weigh-ins vs the straight line to goal
  const startW = parseFloat(state.inputs.startWeightKg) || 0
  const weightData = daily.rows.map(r => ({
    day: r.dayNum,
    Weight: r.weight,
    Plan: Math.round((startW + planRes.weightChange * (r.dayNum / days)) * 10) / 10,
  }))
  const weighIns = daily.rows.filter(r => r.weight != null).length

  return (
    <>
      {!embedded && <PageHead title="Body" sub="Planned vs actual — fat & muscle." />}

      <div className="grid cols-3">
        <StatBox label="Fat change" value={`${fmt(daily.cumFat, 1, true)} kg`} tone={daily.cumFat <= 0 ? 'pos' : 'neg'} rows={[{ k: 'Plan (period)', v: `${fmt(planRes.fatChange, 1, true)} kg` }]} />
        <StatBox label="Muscle change" value={`${fmt(daily.cumMuscle, 1, true)} kg`} tone={daily.cumMuscle >= 0 ? 'pos' : 'neg'} rows={[{ k: 'Plan (period)', v: `${fmt(planRes.muscleChange, 1, true)} kg` }]} />
        <StatBox label="Shred efficiency" value={`${Math.round(actualClean * 100)}%`} tone={actualClean >= 0.5 ? 'pos' : 'neg'} rows={[{ k: 'Plan', v: `${Math.round(planRes.cleanliness * 100)}%` }]} info="How clean your change is — the share that's the good kind (muscle up, fat down). 50%+ is solid." />
      </div>

      {noData && (
        <div style={{ margin: '22px 0 0' }}>
          <EmptyState icon="trend" title="Your curves start here"
            sub="Log a few days of weight and calories and your actual fat & muscle lines draw themselves over the targets."
            action="Open Today" onAction={() => setView('today')} />
        </div>
      )}
      <ChartTabs tabs={[['curve', 'The Shred Curve'], ['weight', 'Scale weight']]} value={chart} onChange={setChart} />
      {chart === 'curve' && <Card>
        <div className="chart-title">Muscle up, fat down · <b>cumulative kg</b></div>
        <div className="chart-wrap"><ResponsiveContainer>
          {/* actuals get a soft gradient fill so they read as "real" against the dashed plan */}
          <ComposedChart data={curve} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
            <ChartDefs />
            <CartesianGrid {...gridProps} /><XAxis dataKey="day" {...axisProps} /><YAxis {...axisProps} /><Tooltip {...tooltipProps} />
            <ReferenceLine y={0} stroke="rgba(226,233,245,0.2)" />
            <ReferenceLine x={lastLogged || null} stroke="rgba(226,233,245,0.3)" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="muscleTarget" name="Muscle (plan)" stroke={C.muscle} strokeDasharray="5 5" strokeOpacity={0.55} dot={false} strokeWidth={1.8} />
            <Area type="monotone" dataKey="muscleActual" name="Muscle" stroke={C.muscle} fill="url(#area-muscle)" dot={false} strokeWidth={2.6} connectNulls />
            <Line type="monotone" dataKey="fatTarget" name="Fat (plan)" stroke={C.fat} strokeDasharray="5 5" strokeOpacity={0.55} dot={false} strokeWidth={1.8} />
            <Area type="monotone" dataKey="fatActual" name="Fat" stroke={C.fat} fill="url(#area-fat)" dot={false} strokeWidth={2.6} connectNulls />
          </ComposedChart>
        </ResponsiveContainer></div>
        <div className="legend">
          <span className="key"><span className="swatch" style={{ background: C.muscle }} />Muscle</span>
          <span className="key"><span className="swatch" style={{ background: C.fat }} />Fat</span>
          <span className="key"><span className="swatch" style={{ background: 'rgba(226,233,245,0.4)' }} />Plan (dashed)</span>
        </div>
      </Card>}

      {chart === 'weight' && <Card>
        <div className="chart-title">Weigh-ins vs the line to goal · <b>{weighIns} logged</b></div>
        <div className="chart-wrap"><ResponsiveContainer>
          <ComposedChart data={weightData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
            <ChartDefs />
            <CartesianGrid {...gridProps} /><XAxis dataKey="day" {...axisProps} /><YAxis {...axisProps} domain={['auto', 'auto']} /><Tooltip {...tooltipProps} />
            <Line type="monotone" dataKey="Plan" stroke="rgba(226,233,245,0.35)" strokeDasharray="5 5" dot={false} strokeWidth={1.8} />
            <Line type="monotone" dataKey="Weight" stroke={C.accent} dot={{ r: 2.5, fill: C.accent, strokeWidth: 0 }} strokeWidth={2.6} connectNulls />
          </ComposedChart>
        </ResponsiveContainer></div>
        {!weighIns && <div className="legend"><span className="faint">Weigh in on the Today screen and your trend appears against the plan line.</span></div>}
      </Card>}
    </>
  )
}
