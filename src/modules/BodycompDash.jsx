import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, StatBox, fmt } from '../components/ui.jsx'
import { cleanliness } from '../lib/engine.js'
import { ResponsiveContainer, LineChart, Line, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'

const axis = { stroke: 'rgba(244,244,245,0.4)', fontSize: 11 }
const tip = { background: '#0f1c33', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, fontSize: 12 }
const grid = 'rgba(255,255,255,0.06)'
// cap tooltip values to ≤2 dp (drops trailing zeros) — no long float tails
const tipFmt = (v) => (v == null || Number.isNaN(Number(v)) ? '–' : Number(Number(v).toFixed(2)))

export default function BodycompDash() {
  const { state, planRes, daily, setDailyLog } = useStore()
  const [w, setW] = useState('')
  const todayNum = Math.min(Math.max(1, planRes.days), Math.max(1, Math.floor((Date.parse(new Date().toISOString().slice(0, 10)) - Date.parse(state.inputs.startDate)) / 86400000) + 1))
  const loggedToday = state.dailyLog[todayNum]?.weight
  const logWeight = () => { if (w === '') return; setDailyLog(todayNum, { weight: w }); setW('') }
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
      <PageHead eyebrow="Insights" title="Bodycomp Dashboard" sub="Your plan compared with what you've actually logged — fat, muscle and energy balance over time." />

      <Card style={{ marginBottom: 16 }}>
        <div className="food-entry">
          <label className="gp-f" style={{ flex: 1 }}><span>Today's weigh-in</span><input type="number" placeholder={loggedToday != null && loggedToday !== '' ? `${loggedToday}` : 'kg'} value={w} onChange={e => setW(e.target.value)} /></label>
          <button className="btn primary" onClick={logWeight} disabled={w === ''}>Log weight</button>
        </div>
        {loggedToday != null && loggedToday !== '' && <p className="faint" style={{ margin: '10px 0 0', fontSize: 12.5 }}>Logged today: {loggedToday}kg.</p>}
      </Card>

      {noData && <Card style={{ marginBottom: 18 }}><span className="muted">Nothing logged yet, so these show your targets for now. Once you start logging, your actual curves appear here.</span></Card>}

      <div className="grid cols-2">
        <Card>
          <div className="eyebrow">Shred Curve · Fat (loss shown positive)</div>
          <div className="chart-wrap"><ResponsiveContainer>
            <LineChart data={curve} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={grid} /><XAxis dataKey="day" {...axis} /><YAxis {...axis} /><Tooltip contentStyle={tip} formatter={tipFmt} />
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
              <CartesianGrid stroke={grid} /><XAxis dataKey="day" {...axis} /><YAxis {...axis} /><Tooltip contentStyle={tip} formatter={tipFmt} />
              <ReferenceLine x={lastLogged || null} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="muscleTarget" stroke="#57e08b" strokeDasharray="5 5" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="muscleActual" stroke="#57e08b" dot={false} strokeWidth={2.5} connectNulls />
            </LineChart>
          </ResponsiveContainer></div>
          <div className="legend"><span className="key"><span className="swatch" style={{ background: '#57e08b' }} />Actual</span><span className="key"><span className="swatch" style={{ background: '#57e08b', opacity: .5 }} />Target</span></div>
        </Card>
      </div>

      <h2 className="section">How you're tracking vs your plan</h2>
      <div className="grid cols-3">
        <StatBox label="Muscle so far" value={`${fmt(daily.cumMuscle, 2, true)} kg`} tone={daily.cumMuscle >= 0 ? 'pos' : 'neg'} rows={[{ k: 'Plan, full period', v: `${fmt(planRes.muscleChange, 1, true)} kg` }]}
          explain="Estimated muscle you've changed since day one, from your logged training and protein. 'Plan, full period' is the target for your whole stretch — compare the two to see if you're on pace." />
        <StatBox label="Fat so far" value={`${fmt(daily.cumFat, 2, true)} kg`} tone={daily.cumFat <= 0 ? 'pos' : 'neg'} rows={[{ k: 'Plan, full period', v: `${fmt(planRes.fatChange, 1, true)} kg` }]}
          explain="The fat side of your change so far (negative means fat lost). 'Plan, full period' is the target for the whole stretch." />
        <StatBox label="Change quality" value={`${Math.round(actualClean * 100)}%`} tone={actualClean >= 0.5 ? 'pos' : 'neg'} rows={[{ k: 'Plan', v: `${Math.round(planRes.cleanliness * 100)}%` }]}
          explain="Of the weight you've moved, how much is the kind you want — fat down on a cut, muscle up on a gain. Higher is cleaner. 'Plan' is what your setup predicts." />
        <StatBox label="Avg calories / day" value={`${Math.round(daily.whole.avgCalories) || '–'}`} rows={[{ k: 'Target', v: `${Math.round(planRes.calorieTarget)}` }, { k: 'Last 7 days', v: `${Math.round(daily.last7.avgCalories) || '–'}` }]}
          explain="Your average daily calories across logged days. 'Target' is your plan's daily goal; 'Last 7 days' is the recent average, handy for spotting a drift." />
        <StatBox label="Avg daily balance" value={`${fmt(daily.whole.avgDeficit, 0, true)} kcal`} rows={[{ k: 'Target', v: `${fmt(planRes.dailyDelta, 0, true)} kcal` }]}
          explain="Average calories eaten minus burned per logged day. Negative is a deficit (fat loss), positive a surplus. 'Target' is your plan's intended daily balance." />
        <StatBox label="Avg protein / day" value={`${Math.round(daily.whole.avgProtein) || '–'} g`} rows={[{ k: 'Target', v: `${Math.round(planRes.proteinTarget)} g` }]}
          explain="Average daily protein across logged days vs your target. Protein helps protect muscle, especially while in a deficit." />
      </div>

      <h2 className="section">Calories in vs out</h2>
      <Card>
        <div className="chart-wrap"><ResponsiveContainer>
          <ComposedChart data={calData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={grid} /><XAxis dataKey="day" {...axis} /><YAxis {...axis} /><Tooltip contentStyle={tip} formatter={tipFmt} />
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
