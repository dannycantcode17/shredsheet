import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, StatBox, EmptyState, fmt } from '../components/ui.jsx'
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { axisProps, gridProps, tooltipProps, ChartDefs, C } from '../components/chart.jsx'

export default function CaloriesDash({ embedded }) {
  const { planRes, daily, setView } = useStore()
  const calData = daily.rows
    .filter(r => r.logged && r.consumed)
    .map(r => ({ day: r.dayNum, TDEE: Math.round(r.tdee), Consumed: r.consumed, Balance: Math.round(r.deficit) }))
  const noData = calData.length === 0

  return (
    <>
      {!embedded && <PageHead title="Calories" sub="Energy in vs out." />}
      {noData && (
        <div style={{ marginBottom: 18 }}>
          <EmptyState icon="flame" title="No calories logged yet"
            sub="Log a meal or your daily calories and your energy balance fills in here."
            action="Log food" onAction={() => setView('food')} />
        </div>
      )}

      <div className="grid cols-3">
        <StatBox label="Avg calories" value={`${Math.round(daily.whole.avgCalories) || '–'}`} rows={[{ k: 'Target', v: `${Math.round(planRes.calorieTarget)}` }, { k: 'Last 7d', v: `${Math.round(daily.last7.avgCalories) || '–'}` }]} />
        <StatBox label="Avg balance (kcal)" value={fmt(daily.whole.avgDeficit, 0, true)} tone={daily.whole.avgDeficit <= 0 ? 'pos' : 'neg'} rows={[{ k: 'Target', v: fmt(planRes.dailyDelta, 0, true) }, { k: 'Last 7d', v: fmt(daily.last7.avgDeficit, 0, true) }]} info="Average daily calories in minus out. Negative = deficit (fat loss); positive = surplus." />
        <StatBox label="Avg protein (g)" value={`${Math.round(daily.whole.avgProtein) || '–'}`} rows={[{ k: 'Target', v: `${Math.round(planRes.proteinTarget)}` }, { k: 'Last 7d', v: `${Math.round(daily.last7.avgProtein) || '–'}` }]} />
      </div>

      <h2 className="section">Calories in vs out</h2>
      <Card>
        <div className="chart-wrap"><ResponsiveContainer>
          <ComposedChart data={calData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
            <ChartDefs />
            <CartesianGrid {...gridProps} /><XAxis dataKey="day" {...axisProps} /><YAxis {...axisProps} /><Tooltip {...tooltipProps} />
            <ReferenceLine y={0} stroke="rgba(226,233,245,0.2)" />
            <Bar dataKey="Balance" fill="url(#grad-muscle)" radius={[4, 4, 4, 4]} maxBarSize={26} />
            <Line type="monotone" dataKey="TDEE" stroke={C.pink} dot={false} strokeWidth={2.5} />
            <Line type="monotone" dataKey="Consumed" stroke={C.fat} dot={false} strokeWidth={2.5} />
          </ComposedChart>
        </ResponsiveContainer></div>
        <div className="legend">
          <span className="key"><span className="swatch" style={{ background: C.pink }} />TDEE (out)</span>
          <span className="key"><span className="swatch" style={{ background: C.fat }} />Consumed (in)</span>
          <span className="key"><span className="swatch" style={{ background: C.muscle }} />Daily balance</span>
        </div>
      </Card>
    </>
  )
}
