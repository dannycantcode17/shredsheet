import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, StatBox, fmt } from '../components/ui.jsx'
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'

const axis = { stroke: 'rgba(244,244,245,0.4)', fontSize: 11 }
const tip = { background: '#0f1c33', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, fontSize: 12 }
const grid = 'rgba(255,255,255,0.06)'

export default function CaloriesDash() {
  const { planRes, daily } = useStore()
  const calData = daily.rows
    .filter(r => r.logged && r.consumed)
    .map(r => ({ day: r.dayNum, TDEE: Math.round(r.tdee), Consumed: r.consumed, Balance: Math.round(r.deficit) }))
  const noData = calData.length === 0

  return (
    <>
      <PageHead title="Calories" sub="Energy in vs out." />
      {noData && <Card style={{ marginBottom: 18 }}><span className="muted">No calories logged yet — add your daily calories in the Daily Log and this fills in.</span></Card>}

      <div className="grid cols-3">
        <StatBox label="Avg calories" value={`${Math.round(daily.whole.avgCalories) || '–'}`} rows={[{ k: 'Target', v: `${Math.round(planRes.calorieTarget)}` }, { k: 'Last 7d', v: `${Math.round(daily.last7.avgCalories) || '–'}` }]} />
        <StatBox label="Avg balance (kcal)" value={fmt(daily.whole.avgDeficit, 0, true)} tone={daily.whole.avgDeficit <= 0 ? 'pos' : 'neg'} rows={[{ k: 'Target', v: fmt(planRes.dailyDelta, 0, true) }, { k: 'Last 7d', v: fmt(daily.last7.avgDeficit, 0, true) }]} info="Average daily calories in minus out. Negative = deficit (fat loss); positive = surplus." />
        <StatBox label="Avg protein (g)" value={`${Math.round(daily.whole.avgProtein) || '–'}`} rows={[{ k: 'Target', v: `${Math.round(planRes.proteinTarget)}` }, { k: 'Last 7d', v: `${Math.round(daily.last7.avgProtein) || '–'}` }]} />
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
        <div className="legend"><span className="key"><span className="swatch" style={{ background: '#f06fa8' }} />TDEE (out)</span><span className="key"><span className="swatch" style={{ background: '#5aa9ff' }} />Consumed (in)</span><span className="key"><span className="swatch" style={{ background: '#57e08b' }} />Daily balance</span></div>
      </Card>
    </>
  )
}
