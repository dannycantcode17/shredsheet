import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, StatBox, EmptyState, fmt } from '../components/ui.jsx'
import { ResponsiveContainer, ComposedChart, BarChart, Bar, Cell, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { axisProps, gridProps, tooltipProps, ChartDefs, C } from '../components/chart.jsx'

// NUTRITION — the two sacred charts (Calories In/Out, Daily
// Balance) each get their own canvas instead of sharing one,
// plus a protein-adherence chart derived from the engine's
// existing per-day proteinMult. Balance bars are coloured by
// whether the day moved you toward your goal (deficit when
// cutting, surplus when building), with your daily target as a
// dashed reference line.
export default function CaloriesDash({ embedded }) {
  const { planRes, daily, setView } = useStore()
  const calData = daily.rows
    .filter(r => r.logged && r.consumed)
    .map(r => ({
      day: r.dayNum,
      TDEE: Math.round(r.tdee),
      Consumed: r.consumed,
      Balance: Math.round(r.deficit),
      Protein: Math.round(r.proteinMult * daily.proteinTarget),
    }))
  const noData = calData.length === 0
  const wantSurplus = planRes.dailyDelta >= 0
  const goodDay = (b) => (wantSurplus ? b >= 0 : b <= 0)
  const proteinTarget = Math.round(planRes.proteinTarget)
  const hitProteinDays = calData.filter(d => d.Protein >= proteinTarget).length

  return (
    <>
      {!embedded && <PageHead title="Nutrition" sub="Energy in vs out." />}
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
        <StatBox label="Protein target hit" value={calData.length ? `${hitProteinDays}/${calData.length}` : '–'} tone={calData.length && hitProteinDays / calData.length >= 0.7 ? 'pos' : undefined} rows={[{ k: 'Target', v: `${proteinTarget} g/day` }, { k: 'Avg', v: `${Math.round(daily.whole.avgProtein) || '–'} g` }]} />
      </div>

      <h2 className="section">Calories in vs out</h2>
      <Card>
        <div className="chart-wrap"><ResponsiveContainer>
          <ComposedChart data={calData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
            <ChartDefs />
            <CartesianGrid {...gridProps} /><XAxis dataKey="day" {...axisProps} /><YAxis {...axisProps} domain={['auto', 'auto']} /><Tooltip {...tooltipProps} />
            <Line type="monotone" dataKey="TDEE" stroke={C.pink} dot={false} strokeWidth={2.5} />
            <Line type="monotone" dataKey="Consumed" stroke={C.fat} dot={false} strokeWidth={2.5} />
          </ComposedChart>
        </ResponsiveContainer></div>
        <div className="legend">
          <span className="key"><span className="swatch" style={{ background: C.pink }} />TDEE (out)</span>
          <span className="key"><span className="swatch" style={{ background: C.fat }} />Consumed (in)</span>
        </div>
      </Card>

      <h2 className="section">Daily balance</h2>
      <Card>
        <div className="chart-title">Deficit / surplus per day · <b>dashed line = your daily target</b></div>
        <div className="chart-wrap"><ResponsiveContainer>
          <BarChart data={calData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid {...gridProps} /><XAxis dataKey="day" {...axisProps} /><YAxis {...axisProps} /><Tooltip {...tooltipProps} />
            <ReferenceLine y={0} stroke="rgba(226,233,245,0.22)" />
            <ReferenceLine y={Math.round(planRes.dailyDelta)} stroke={C.accent} strokeDasharray="5 5" strokeOpacity={0.8} />
            <Bar dataKey="Balance" radius={[4, 4, 4, 4]} maxBarSize={26}>
              {calData.map((d, i) => <Cell key={i} fill={goodDay(d.Balance) ? C.accent : C.warn} fillOpacity={0.8} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer></div>
        <div className="legend">
          <span className="key"><span className="swatch" style={{ background: C.accent }} />Toward goal</span>
          <span className="key"><span className="swatch" style={{ background: C.warn }} />Off plan</span>
        </div>
      </Card>

      <h2 className="section">Protein</h2>
      <Card>
        <div className="chart-title">Grams per day · <b>target {proteinTarget}g</b></div>
        <div className="chart-wrap"><ResponsiveContainer>
          <BarChart data={calData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
            <ChartDefs />
            <CartesianGrid {...gridProps} /><XAxis dataKey="day" {...axisProps} /><YAxis {...axisProps} /><Tooltip {...tooltipProps} />
            <ReferenceLine y={proteinTarget} stroke={C.fat} strokeDasharray="5 5" strokeOpacity={0.8} />
            <Bar dataKey="Protein" radius={[4, 4, 4, 4]} maxBarSize={26}>
              {calData.map((d, i) => <Cell key={i} fill={d.Protein >= proteinTarget ? C.fat : 'rgba(106,166,255,0.3)'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer></div>
      </Card>
    </>
  )
}
