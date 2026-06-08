import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, StatBox, Pill, fmt } from '../components/ui.jsx'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

const axis = { stroke: 'rgba(244,244,245,0.4)', fontSize: 11 }
const tip = { background: '#0f1c33', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, fontSize: 12 }
const grid = 'rgba(255,255,255,0.06)'
const LINE_COLORS = ['#5ad1c7', '#5aa9ff', '#57e08b', '#f0b34e', '#f06fa8', '#b79cff']
const tipFmt = (v) => (v == null || Number.isNaN(Number(v)) ? '–' : Number(Number(v).toFixed(1)))

// Phone-first strength view: the 1RM progression chart up top, then key lifts
// as a glanceable progress list, then a few headline numbers. Same strength
// maths (computeStrength) — presentation only.
export default function GymDash() {
  const { state, strength, planRes, daily } = useStore()
  const key6 = strength.key6

  const maxLen = Math.max(0, ...key6.map(e => e.series.length))
  const curve = Array.from({ length: maxLen }, (_, i) => {
    const o = { set: i + 1 }
    key6.forEach(e => { o[e.name] = e.series[i] != null ? Math.round(e.series[i] * 10) / 10 : null })
    return o
  })

  const dl = Object.values(state.dailyLog).filter(x => ['cardioMins', 'steps', 'calories', 'protein', 'weight'].some(k => x[k] !== '' && x[k] != null))
  const mean = (sel) => dl.length ? dl.reduce((a, x) => a + (parseFloat(x[sel]) || 0), 0) / dl.length : 0
  const noLifts = !key6.length
  const lifts = [...key6].sort((a, b) => b.pctGain - a.pctGain)

  return (
    <>
      <PageHead eyebrow="Insights" title="Gym Dashboard" sub="Your strength over time, and how your training's balanced." />
      {noLifts && <Card style={{ marginBottom: 18 }}><span className="muted">No sets logged yet. Add a few in the Workout Log and your strength progress shows up here.</span></Card>}

      {!noLifts && (
        <Card style={{ marginBottom: 16 }}>
          <div className="eyebrow">Estimated 1RM over time</div>
          <div className="chart-wrap"><ResponsiveContainer>
            <LineChart data={curve} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={grid} /><XAxis dataKey="set" {...axis} /><YAxis {...axis} /><Tooltip contentStyle={tip} formatter={tipFmt} /><Legend wrapperStyle={{ fontSize: 11 }} />
              {key6.map((e, i) => <Line key={e.name} type="monotone" dataKey={e.name} stroke={LINE_COLORS[i % LINE_COLORS.length]} dot={false} strokeWidth={2.2} connectNulls />)}
            </LineChart>
          </ResponsiveContainer></div>
        </Card>
      )}

      {!noLifts && (
        <Card style={{ marginBottom: 16 }}>
          <div className="eyebrow">Key lifts</div>
          {lifts.map(e => (
            <div className="gd-lift" key={e.name}>
              <div style={{ minWidth: 0 }}>
                <div className="gd-name">{e.name}</div>
                <div className="gd-prog">{e.first}kg → {e.max}kg{e.target != null ? ` · target ${e.target}kg` : ''}</div>
              </div>
              <div className="gd-right">
                <span className={`gd-gain ${e.pctGain >= 0 ? 'pos' : 'neg'}`}>{fmt(e.pctGain * 100, 0, true)}%</span>
                {e.hitTarget != null && <Pill tone={e.hitTarget ? 'good' : 'muted'}>{e.hitTarget ? 'Target hit' : 'In progress'}</Pill>}
              </div>
            </div>
          ))}
        </Card>
      )}

      <div className="grid cols-3">
        <StatBox label="Avg strength gain" value={`${fmt(strength.avgPctGain * 100, 0, true)}%`}
          explain="The average change in your estimated 1RM across every lift you've logged, from your first logged set to your best." />
        <StatBox label="Sets / week" value={`${daily.whole.setsPerWeek.toFixed(1)}`} rows={[{ k: 'Plan', v: `${planRes.plannedSets}` }, { k: 'Last 7 days', v: daily.last7.setsPerWeek.toFixed(1) }]}
          explain="Your average logged sets per week. 'Plan' is the weekly total in your Gym Plan; 'Last 7 days' is the recent rate, so you can see if volume's holding up." />
        <StatBox label="Steps / day" value={`${Math.round(mean('steps')).toLocaleString()}`} rows={[{ k: 'Goal', v: `${(+state.inputs.stepGoal || 0).toLocaleString()}` }, { k: 'Cardio/wk', v: `${Math.round(mean('cardioMins') * 7)} min` }]}
          explain="Average daily steps from your logged days vs your step goal, plus your weekly cardio. These feed your daily calorie burn." />
      </div>
    </>
  )
}
