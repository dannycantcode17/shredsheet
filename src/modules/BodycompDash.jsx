import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, StatBox, fmt } from '../components/ui.jsx'
import { cleanliness } from '../lib/engine.js'
import { ResponsiveContainer, LineChart, Line, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'

const axis = { stroke: 'rgba(244,244,245,0.4)', fontSize: 11 }
const tip = { background: '#0f1c33', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, fontSize: 12 }
const grid = 'rgba(255,255,255,0.06)'

export default function BodycompDash() {
  const { state, planRes, daily } = useStore()
  const days = planRes.days
  const lastLogged = daily.rows.reduce((m, r) => (r.logged ? r.dayNum : m), 0)
  const curve = daily.rows.map(r => ({
    day: r.dayNum,
    fatActual: r.dayNum <= lastLogged ? -r.cumFat : null,
    fatTarget: (-planRes.fatChange) * (r.dayNum / days),
    muscleActual: r.dayNum <= lastLogged ? r.cumMuscle : null,
    muscleTarget: planRes.muscleChange * (r.dayNum / days),
  }))
  const calData = daily.rows.filter(r => r.logged && r.consumed).map(r => ({ day: r.dayNum, TDEE: Math.round(r.tdee), Consumed: r.consumed, Balance: Math.round(r.deficit) }))
  const actualClean = cleanliness(daily.cumWeight, daily.cumFat, daily.cumMuscle)
  const noData = lastLogged === 0

  return (
    <>
      <PageHead eyebrow="Insights · 5" title="Bodycomp Dashboard" sub="Planned vs actual fat, muscle and energy balance over your period." />
      {noData && <Card style={{ marginBottom: 18 }}><span className="muted">No daily data logged yet — the target lines are shown, your actual curves appear once you start logging in the Daily Log.</span></Card>}

      <div className="grid cols-2">
        <Card>
          <div className="eyebrow">Shred Curve · Fat (loss shown positive)</div>
          <div className="chart-wrap"><ResponsiveContainer>
            <LineChart data={curve} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={grid} /><XAxis dataKey="day" {...axis} /><YAxis {...axis} /><Tooltip contentStyle={tip} />
              <ReferenceLine x={lastLogged || null} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="fatTarget" stroke="#5aa9ff" strokeDasharray="5 5" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="fatActual" stroke="#5aa9ff" dot={false} strokeWidth={2.5} connectNulls />
            </LineChart>
          </ResponsiveContainer></div>
          <div className="legend"><span className="key"><span className="swatch" style={{ background: '#5aa9ff' }} />Actual</span><span className="key"><span className="swatch" style={{ background: '#5aa9ff', opacity: .5 }} />Target</span></div>
        </Card>
        <Card>
          <div className="eyebrow">Shred Curve · Muscle</div>
          <div className="chart-wrap"><ResponsiveContainer>
            <LineChart data={curve} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={grid} /><XAxis dataKey="day" {...axis} /><YAxis {...axis} /><Tooltip contentStyle={tip} />
              <ReferenceLine x={lastLogged || null} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="muscleTarget" stroke="#57e08b" strokeDasharray="5 5" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="muscleActual" stroke="#57e08b" dot={false} strokeWidth={2.5} connectNulls />
            </LineChart>
          </ResponsiveContainer></div>
          <div className="legend"><span className="key"><span className="swatch" style={{ background: '#57e08b' }} />Actual</span><span className="key"><span className="swatch" style={{ background: '#57e08b', opacity: .5 }} />Target</span></div>
        </Card>
      </div>

      <h2 className="section">Plan vs actual</h2>
      <div className="grid cols-3">
        <StatBox label="Muscle change (kg)" value={fmt(daily.cumMuscle, 2, true)} tone={daily.cumMuscle >= 0 ? 'pos' : 'neg'} rows={[{ k: 'Plan (period)', v: fmt(planRes.muscleChange, 1, true) }]} />
        <StatBox label="Fat change (kg)" value={fmt(daily.cumFat, 2, true)} tone={daily.cumFat <= 0 ? 'pos' : 'neg'} rows={[{ k: 'Plan (period)', v: fmt(planRes.fatChange, 1, true) }]} />
        <StatBox label="Shred efficiency" value={`${Math.round(actualClean * 100)}%`} tone={actualClean >= 0.5 ? 'pos' : 'neg'} rows={[{ k: 'Plan', v: `${Math.round(planRes.cleanliness * 100)}%` }]} />
        <StatBox label="Avg calories" value={`${Math.round(daily.whole.avgCalories) || '–'}`} rows={[{ k: 'Target', v: `${Math.round(planRes.calorieTarget)}` }, { k: 'Last 7d', v: `${Math.round(daily.last7.avgCalories) || '–'}` }]} />
        <StatBox label="Avg balance (kcal)" value={fmt(daily.whole.avgDeficit, 0, true)} rows={[{ k: 'Target', v: fmt(planRes.dailyDelta, 0, true) }]} />
        <StatBox label="Avg protein (g)" value={`${Math.round(daily.whole.avgProtein) || '–'}`} rows={[{ k: 'Target', v: `${Math.round(planRes.proteinTarget)}` }]} />
      </div>

      <h2 className="section">Calories in vs out</h2>
      <Card>
        <div className="chart-wrap"><ResponsiveContainer>
          <ComposedChart data={calData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={grid} /><XAxis dataKey="day" {...axis} /><YAxis {...axis} /><Tooltip contentStyle={tip} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
            <Bar dataKey="Balance" fill="#57e08b" opacity={0.55} />
            <Line type="monotone" dataKey="TDEE" stroke="#f06fa8" dot={false} strokeWidth={2.5} />
            <Line type="monotone" dataKey="Consumed" stroke="#5aa9ff" dot={false} strokeWidth={2.5} />
          </ComposedChart>
        </ResponsiveContainer></div>
        <div className="legend"><span className="key"><span className="swatch" style={{ background: '#f06fa8' }} />TDEE</span><span className="key"><span className="swatch" style={{ background: '#5aa9ff' }} />Consumed</span><span className="key"><span className="swatch" style={{ background: '#57e08b' }} />Daily balance</span></div>
      </Card>
    </>
  )
}
