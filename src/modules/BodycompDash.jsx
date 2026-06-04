import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, StatBox, fmt } from '../components/ui.jsx'
import { cleanliness, projectionBand } from '../lib/engine.js'
import { deriveInsights } from '../lib/insights.js'
import { ResponsiveContainer, LineChart, Line, ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'

const axis = { stroke: 'rgba(244,244,245,0.4)', fontSize: 11 }
const tip = { background: '#0f1c33', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, fontSize: 12 }
const grid = 'rgba(255,255,255,0.06)'

export default function BodycompDash() {
  const { state, planRes, daily, caloriesTracked, muscleEstimated } = useStore()
  const proteinTracked = state.tracking ? !!state.tracking.protein : true
  const insights = deriveInsights({ planRes, daily, flags: { calories: caloriesTracked, protein: proteinTracked, muscle: muscleEstimated } })
  const days = planRes.days
  const lastLogged = daily.rows.reduce((m, r) => (r.logged ? r.dayNum : m), 0)
  // Uncertainty band around the projection, narrowing as logged days calibrate it.
  const daysLogged = daily.whole.daysLogged
  const muscleB = projectionBand(planRes.muscleChange, daysLogged, 0.2)
  const fatB = projectionBand(planRes.fatChange, daysLogged, 0.2)
  const curve = daily.rows.map(r => {
    const frac = r.dayNum / days
    return {
      day: r.dayNum,
      fatActual: r.dayNum <= lastLogged ? -r.cumFat : null,
      fatTarget: (-planRes.fatChange) * frac,
      fatBand: [(-planRes.fatChange - fatB.half) * frac, (-planRes.fatChange + fatB.half) * frac],
      muscleActual: r.dayNum <= lastLogged ? r.cumMuscle : null,
      muscleTarget: planRes.muscleChange * frac,
      muscleBand: [(planRes.muscleChange - muscleB.half) * frac, (planRes.muscleChange + muscleB.half) * frac],
    }
  })
  const calData = daily.rows.filter(r => r.logged && r.consumed).map(r => ({ day: r.dayNum, TDEE: Math.round(r.tdee), Consumed: r.consumed, Balance: Math.round(r.deficit) }))
  const actualClean = cleanliness(daily.cumWeight, daily.cumFat, daily.cumMuscle)
  const noData = lastLogged === 0

  return (
    <>
      <PageHead eyebrow="Insights · 5" title="Bodycomp Dashboard" sub="Planned vs actual fat, muscle and energy balance over your period." />
      {insights.length > 0 && (
        <Card className="focus">
          <div className="eyebrow">Focus · what the numbers are saying</div>
          <ul className="focus-list">
            {insights.map((it, i) => (
              <li key={i} className={`focus-item ${it.tone}`}>
                <span className="focus-dot" />
                <div><strong>{it.title}.</strong> {it.text}</div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {!caloriesTracked && !muscleEstimated && (
        <Card><span className="muted">Your system tracks lightly, so body-composition estimates are off. Turn on <strong>calorie</strong> and <strong>bodyweight</strong> tracking in Settings to unlock the fat, muscle and energy-balance curves.</span></Card>
      )}
      {(caloriesTracked || muscleEstimated) && <>
      {noData && <Card style={{ marginBottom: 18 }}><span className="muted">No daily data logged yet — the target lines are shown, your actual curves appear once you start logging in the Daily Log.</span></Card>}

      <div className="grid cols-2">
        {caloriesTracked && <Card>
          <div className="eyebrow">Shred Curve · Fat (loss shown positive)</div>
          <div className="chart-wrap"><ResponsiveContainer>
            <ComposedChart data={curve} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={grid} /><XAxis dataKey="day" {...axis} /><YAxis {...axis} /><Tooltip contentStyle={tip} />
              <ReferenceLine x={lastLogged || null} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="fatBand" stroke="none" fill="#5aa9ff" fillOpacity={0.12} activeDot={false} />
              <Line type="monotone" dataKey="fatTarget" stroke="#5aa9ff" strokeDasharray="5 5" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="fatActual" stroke="#5aa9ff" dot={false} strokeWidth={2.5} connectNulls />
            </ComposedChart>
          </ResponsiveContainer></div>
          <div className="legend"><span className="key"><span className="swatch" style={{ background: '#5aa9ff' }} />Actual</span><span className="key"><span className="swatch" style={{ background: '#5aa9ff', opacity: .5 }} />Target</span><span className="key"><span className="swatch" style={{ background: '#5aa9ff', opacity: .2 }} />Typical range</span></div>
        </Card>}
        {muscleEstimated && <Card>
          <div className="eyebrow">Shred Curve · Muscle</div>
          <div className="chart-wrap"><ResponsiveContainer>
            <ComposedChart data={curve} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={grid} /><XAxis dataKey="day" {...axis} /><YAxis {...axis} /><Tooltip contentStyle={tip} />
              <ReferenceLine x={lastLogged || null} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="muscleBand" stroke="none" fill="#57e08b" fillOpacity={0.12} activeDot={false} />
              <Line type="monotone" dataKey="muscleTarget" stroke="#57e08b" strokeDasharray="5 5" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="muscleActual" stroke="#57e08b" dot={false} strokeWidth={2.5} connectNulls />
            </ComposedChart>
          </ResponsiveContainer></div>
          <div className="legend"><span className="key"><span className="swatch" style={{ background: '#57e08b' }} />Actual</span><span className="key"><span className="swatch" style={{ background: '#57e08b', opacity: .5 }} />Target</span><span className="key"><span className="swatch" style={{ background: '#57e08b', opacity: .2 }} />Typical range</span></div>
        </Card>}
      </div>

      <h2 className="section">Plan vs actual</h2>
      <div className="grid cols-3">
        {muscleEstimated && <StatBox label="Muscle change (kg)" value={fmt(daily.cumMuscle, 2, true)} tone={daily.cumMuscle >= 0 ? 'pos' : 'neg'} rows={[{ k: 'Plan (period)', v: `${fmt(planRes.muscleChange, 1, true)} ±${muscleB.half.toFixed(1)}` }]}
          estimate explain="Modelled from your training volume, protein, calorie balance and a newbie-gains curve — not a body scan. The ±range is the typical spread for an average body; it narrows as you log more days. If the scale and mirror disagree, trust them, and nudge the muscle modifier in Inputs to match your reality." />}
        {caloriesTracked && <StatBox label="Fat change (kg)" value={fmt(daily.cumFat, 2, true)} tone={daily.cumFat <= 0 ? 'pos' : 'neg'} rows={[{ k: 'Plan (period)', v: `${fmt(planRes.fatChange, 1, true)} ±${fatB.half.toFixed(1)}` }]}
          estimate explain="Inferred from your energy balance: (calories eaten − estimated burn) ÷ 7700 kcal per kg of fat, with muscle change added back. The ±range is a typical spread that narrows as you log; your logged bodyweight is the ground truth this leans on." />}
        {muscleEstimated && <StatBox label="Shred efficiency" value={`${Math.round(actualClean * 100)}%`} tone={actualClean >= 0.5 ? 'pos' : 'neg'} rows={[{ k: 'Plan', v: `${Math.round(planRes.cleanliness * 100)}%` }]}
          estimate explain="How much of your weight change is the 'good' kind — muscle gained, fat lost. 100% is a clean recomp; lower means more of the change is the wrong direction. Derived from the muscle and fat estimates above, so it inherits their uncertainty." />}
        {caloriesTracked && <StatBox label="Avg calories" value={`${Math.round(daily.whole.avgCalories) || '–'}`} rows={[{ k: 'Target', v: `${Math.round(planRes.calorieTarget)}` }, { k: 'Last 7d', v: `${Math.round(daily.last7.avgCalories) || '–'}` }]} />}
        {caloriesTracked && <StatBox label="Avg balance (kcal)" value={fmt(daily.whole.avgDeficit, 0, true)} rows={[{ k: 'Target', v: fmt(planRes.dailyDelta, 0, true) }]} />}
        {caloriesTracked && <StatBox label="Avg protein (g)" value={`${Math.round(daily.whole.avgProtein) || '–'}`} rows={[{ k: 'Target', v: `${Math.round(planRes.proteinTarget)}` }]} />}
      </div>

      {caloriesTracked && <>
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
      </>}
      </>}
    </>
  )
}
