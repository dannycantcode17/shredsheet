import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, StatBox, Pill, fmt } from '../components/ui.jsx'
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

const axis = { stroke: 'rgba(244,244,245,0.4)', fontSize: 11 }
const tip = { background: '#0f1c33', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, fontSize: 12 }
const grid = 'rgba(255,255,255,0.06)'
const LINE_COLORS = ['#5ad1c7', '#5aa9ff', '#57e08b', '#f0b34e', '#f06fa8', '#b79cff']

export default function GymDash() {
  const { state, strength, planRes, daily } = useStore()
  const dayNames = state.plan.filter(d => d.name).map(d => d.name)
  const key6 = strength.key6

  const maxLen = Math.max(0, ...key6.map(e => e.series.length))
  const curve = Array.from({ length: maxLen }, (_, i) => {
    const o = { set: i + 1 }
    key6.forEach(e => { o[e.name] = e.series[i] != null ? Math.round(e.series[i] * 10) / 10 : null })
    return o
  })

  const setsByDay = {}
  state.workoutLog.forEach(s => { if (s.day) setsByDay[s.day] = (setsByDay[s.day] || 0) + 1 })
  const splitData = dayNames.map(n => ({ name: n, sets: setsByDay[n] || 0 }))
  const liftBars = key6.map(e => ({ name: e.name.length > 14 ? e.name.slice(0, 13) + '…' : e.name, First: e.first, Max: e.max, Target: e.target || 0 }))

  const dl = Object.values(state.dailyLog).filter(x => ['cardioMins', 'steps', 'calories', 'protein', 'weight'].some(k => x[k] !== '' && x[k] != null))
  const mean = (sel) => dl.length ? dl.reduce((a, x) => a + (parseFloat(x[sel]) || 0), 0) / dl.length : 0
  const noLifts = !key6.length

  return (
    <>
      <PageHead eyebrow="Insights" title="Gym Dashboard" sub="Strength heading up and to the right (that's the goal, anyway), plus where your training's dialled in — and where it's quietly skiving." />
      {noLifts && <Card style={{ marginBottom: 18 }}><span className="muted">No sets logged yet — fill in the Workout Log and your strength curves will show up to flex right here.</span></Card>}

      <Card>
        <div className="eyebrow">Strength Curve · estimated 1RM by set count</div>
        <div className="chart-wrap"><ResponsiveContainer>
          <LineChart data={curve} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={grid} /><XAxis dataKey="set" {...axis} /><YAxis {...axis} /><Tooltip contentStyle={tip} /><Legend wrapperStyle={{ fontSize: 11 }} />
            {key6.map((e, i) => <Line key={e.name} type="monotone" dataKey={e.name} stroke={LINE_COLORS[i % LINE_COLORS.length]} dot={false} strokeWidth={2.2} connectNulls />)}
          </LineChart>
        </ResponsiveContainer></div>
      </Card>

      <h2 className="section">Key lift analysis</h2>
      <div className="grid cols-3">
        <Card className="tight">
          <div className="stat-label">6 key lifts — green if target hit</div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {key6.length ? key6.map(e => <Pill key={e.name} tone={e.hitTarget ? 'good' : 'muted'}>{e.name}</Pill>) : <span className="faint">—</span>}
          </div>
        </Card>
        <Card className="tight">
          <div className="stat-label">Top 3 most improved</div>
          <div style={{ marginTop: 10 }}>{strength.topImproved.map(e => <div key={e.name} className="stat-row"><span className="k">{e.name}</span><span className="v pos">{fmt(e.pctGain * 100, 0, true)}%</span></div>)}{!strength.topImproved.length && <span className="faint">—</span>}</div>
        </Card>
        <Card className="tight">
          <div className="stat-label">Bottom 3 improved</div>
          <div style={{ marginTop: 10 }}>{strength.bottomImproved.map(e => <div key={e.name} className="stat-row"><span className="k">{e.name}</span><span className={`v ${e.pctGain >= 0 ? '' : 'neg'}`}>{fmt(e.pctGain * 100, 0, true)}%</span></div>)}{!strength.bottomImproved.length && <span className="faint">—</span>}</div>
        </Card>
      </div>

      <div className="grid cols-3" style={{ marginTop: 16 }}>
        <StatBox label="Avg strength gain" value={`${fmt(strength.avgPctGain * 100, 0, true)}%`} rows={[{ k: 'across logged lifts', v: '' }]} />
        <StatBox label="Sets / week" value={`${daily.whole.setsPerWeek.toFixed(1)}`} rows={[{ k: 'Plan', v: `${planRes.plannedSets}` }, { k: 'Last 7d', v: daily.last7.setsPerWeek.toFixed(1) }]} />
        <StatBox label="Activity" value={`${Math.round(mean('steps')).toLocaleString()}`} rows={[{ k: 'Steps/day (goal)', v: `${(+state.inputs.stepGoal).toLocaleString()}` }, { k: 'Cardio min/wk', v: `${Math.round(mean('cardioMins') * 7)} / ${state.inputs.cardioMinsPerWeek}` }]} />
      </div>

      <h2 className="section">Training split &amp; targets</h2>
      <div className="grid cols-2">
        <Card>
          <div className="eyebrow">Sets performed per split day</div>
          <div className="chart-wrap"><ResponsiveContainer>
            <BarChart data={splitData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={grid} /><XAxis dataKey="name" {...axis} /><YAxis {...axis} /><Tooltip contentStyle={tip} />
              <Bar dataKey="sets" fill="#5ad1c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer></div>
        </Card>
        <Card>
          <div className="eyebrow">Key lifts vs target (1RM)</div>
          <div className="chart-wrap"><ResponsiveContainer>
            <BarChart data={liftBars} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={grid} /><XAxis dataKey="name" {...axis} interval={0} angle={-15} textAnchor="end" height={50} /><YAxis {...axis} /><Tooltip contentStyle={tip} /><Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="First" fill="rgba(255,255,255,0.3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Max" fill="#5ad1c7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Target" fill="#f0b34e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer></div>
        </Card>
      </div>
    </>
  )
}
