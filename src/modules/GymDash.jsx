import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, StatBox, Pill, EmptyState, fmt } from '../components/ui.jsx'
import { epley1RM } from '../lib/engine.js'
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts'
import { axisProps, gridProps, tooltipProps, ChartDefs, C, SERIES } from '../components/chart.jsx'

const num = (v, d = 0) => { const x = parseFloat(v); return Number.isFinite(x) ? x : d }

const SEGMENTS = [['overview', 'Overview'], ['lifts', 'Lifts'], ['volume', 'Volume']]

export default function GymDash({ embedded }) {
  const { state, strength, planRes, daily, setView } = useStore()
  const [seg, setSeg] = useState('overview')
  const [selLift, setSelLift] = useState('')
  const dayNames = state.plan.filter(d => d.name).map(d => d.name)
  const key6 = strength.key6
  const noLifts = !key6.length

  // ---- strength curve (estimated 1RM by set count) ----
  const maxLen = Math.max(0, ...key6.map(e => e.series.length))
  const curve = Array.from({ length: maxLen }, (_, i) => {
    const o = { set: i + 1 }
    key6.forEach(e => { o[e.name] = e.series[i] != null ? Math.round(e.series[i] * 10) / 10 : null })
    return o
  })

  // ---- split distribution + lift-vs-target ----
  const setsByDay = {}
  state.workoutLog.forEach(s => { if (s.day) setsByDay[s.day] = (setsByDay[s.day] || 0) + 1 })
  const splitData = dayNames.map(n => ({ name: n, sets: setsByDay[n] || 0 }))
  const liftBars = key6.map(e => ({ name: e.name.length > 14 ? e.name.slice(0, 13) + '…' : e.name, First: e.first, Max: e.max, Target: e.target || 0 }))
  const topLifts = [...strength.exercises].sort((a, b) => b.max - a.max).slice(0, 6)

  // ---- lifetime / period totals + consistency (mined from the set-level log) ----
  const sets = state.workoutLog.filter(s => s.exercise && s.weight !== '' && s.weight != null && s.reps !== '' && s.reps != null)
  const totalReps = sets.reduce((a, s) => a + num(s.reps), 0)
  const tonnage = sets.reduce((a, s) => a + num(s.weight) * num(s.reps), 0)
  const tonnageLabel = tonnage >= 1000 ? `${(tonnage / 1000).toFixed(1)}t` : `${Math.round(tonnage)}kg`
  const sessionDates = [...new Set(sets.map(s => s.date).filter(Boolean))].sort()
  const sessions = sessionDates.length
  const firstDate = sessionDates[0], lastDate = sessionDates[sessions - 1]
  const spanDays = firstDate && lastDate ? Math.round((new Date(lastDate) - new Date(firstDate)) / 86400000) + 1 : 0
  const sessionsPerWeek = sessions ? sessions / Math.max(1, spanDays / 7) : 0
  const daysSinceLast = lastDate ? Math.max(0, Math.round((Date.now() - new Date(lastDate + 'T00:00:00')) / 86400000)) : null

  // ---- weekly volume / intensity buckets ----
  const weeks = {}
  sets.forEach(s => {
    if (!s.date) return
    const k = Math.floor((new Date(s.date) - new Date(firstDate)) / (7 * 86400000))
    const w = (weeks[k] ||= { tonnage: 0, sets: 0, rirSum: 0, rirN: 0 })
    w.tonnage += num(s.weight) * num(s.reps); w.sets += 1
    if (s.rir !== '' && s.rir != null) { w.rirSum += num(s.rir); w.rirN += 1 }
  })
  const weekData = Object.keys(weeks).map(Number).sort((a, b) => a - b).map(k => ({
    week: `W${k + 1}`, tonnage: Math.round(weeks[k].tonnage), sets: weeks[k].sets,
    rir: weeks[k].rirN ? Math.round((weeks[k].rirSum / weeks[k].rirN) * 10) / 10 : null,
  }))

  const dl = Object.values(state.dailyLog).filter(x => ['cardioMins', 'steps', 'calories', 'protein', 'weight'].some(k => x[k] !== '' && x[k] != null))
  const mean = (sel) => dl.length ? dl.reduce((a, x) => a + (parseFloat(x[sel]) || 0), 0) / dl.length : 0

  // ---- per-lift drill-down: best est. 1RM per day, over time ----
  const liftNames = strength.exercises.map(e => e.name)
  const activeLift = selLift && liftNames.includes(selLift) ? selLift : (key6[0]?.name || liftNames[0] || '')
  const liftDetail = (() => {
    const perDay = {}; let heaviest = 0
    state.workoutLog.forEach(s => {
      if (s.exercise !== activeLift || s.weight === '' || s.weight == null || s.reps === '' || s.reps == null) return
      const e = epley1RM(s.weight, s.reps, s.rir)
      if (perDay[s.date] == null || e > perDay[s.date]) perDay[s.date] = e
      if (num(s.weight) > heaviest) heaviest = num(s.weight)
    })
    const data = Object.keys(perDay).sort().map(d => ({ date: d.slice(5), e1rm: Math.round(perDay[d] * 10) / 10 }))
    const ex = strength.exercises.find(e => e.name === activeLift) || null
    return { data, heaviest, ex, best: ex ? ex.max : (data.length ? Math.max(...data.map(p => p.e1rm)) : 0) }
  })()

  return (
    <>
      {!embedded && <PageHead title="Gym" sub="Strength, volume & consistency." />}
      {noLifts ? (
        <EmptyState icon="dumbbell" title="No workouts yet"
          sub="Log your first sets and your strength, volume and consistency tracking light up here."
          action="Log a workout" onAction={() => setView('gym')} />
      ) : (
        <>
          <div className="segmented" role="tablist" aria-label="Gym views">
            {SEGMENTS.map(([k, label]) => (
              <button key={k} className={seg === k ? 'active' : ''} aria-current={seg === k ? 'page' : undefined} onClick={() => setSeg(k)}>{label}</button>
            ))}
          </div>

          {seg === 'overview' && (
            <>
              <div className="grid cols-3">
                <StatBox label="Sessions logged" value={`${sessions}`} rows={[{ k: 'Per week', v: sessionsPerWeek.toFixed(1) }, { k: 'Target/wk', v: `${state.inputs.gymSessionsPerWeek}` }]} />
                <StatBox label="Total volume lifted" value={tonnageLabel} rows={[{ k: 'Total sets', v: `${sets.length}` }, { k: 'Total reps', v: `${totalReps.toLocaleString()}` }]} info="Total weight moved = weight × reps across every set you've logged (a.k.a. tonnage)." />
                <StatBox label="Last session" value={daysSinceLast === 0 ? 'Today' : daysSinceLast === 1 ? '1 day ago' : `${daysSinceLast}d ago`} rows={[{ k: 'Date', v: lastDate ? lastDate.slice(5) : '–' }]} tone={daysSinceLast != null && daysSinceLast <= 2 ? 'pos' : daysSinceLast > 4 ? 'neg' : undefined} />
                <StatBox label="Avg strength gain" value={`${fmt(strength.avgPctGain * 100, 0, true)}%`} tone={strength.avgPctGain >= 0 ? 'pos' : 'neg'} rows={[{ k: 'Across logged lifts', v: `${strength.exercises.length}` }]} />
                <StatBox label="Sets / week" value={`${daily.whole.setsPerWeek.toFixed(1)}`} rows={[{ k: 'Plan', v: `${planRes.plannedSets}` }, { k: 'Last 7d', v: daily.last7.setsPerWeek.toFixed(1) }]} />
                <StatBox label="Daily activity" value={`${Math.round(mean('steps')).toLocaleString()}`} rows={[{ k: 'Steps/day (goal)', v: `${(+state.inputs.stepGoal).toLocaleString()}` }, { k: 'Cardio min/wk', v: `${Math.round(mean('cardioMins') * 7)} / ${state.inputs.cardioMinsPerWeek}` }]} />
              </div>

              <h2 className="section">Sets performed per split day</h2>
              <Card>
                <div className="chart-wrap"><ResponsiveContainer>
                  <BarChart data={splitData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
                    <ChartDefs />
                    <CartesianGrid {...gridProps} /><XAxis dataKey="name" {...axisProps} /><YAxis {...axisProps} /><Tooltip {...tooltipProps} />
                    <Bar dataKey="sets" fill="url(#grad-accent)" radius={[8, 8, 2, 2]} maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer></div>
              </Card>
            </>
          )}

          {seg === 'lifts' && (
            <>
              <Card>
                <div className="chart-title">Strength curve · <b>estimated 1RM by set count</b></div>
                <div className="chart-wrap"><ResponsiveContainer>
                  <LineChart data={curve} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid {...gridProps} /><XAxis dataKey="set" {...axisProps} /><YAxis {...axisProps} /><Tooltip {...tooltipProps} /><Legend wrapperStyle={{ fontSize: 11 }} />
                    {key6.map((e, i) => <Line key={e.name} type="monotone" dataKey={e.name} stroke={SERIES[i % SERIES.length]} dot={false} strokeWidth={2.2} connectNulls />)}
                  </LineChart>
                </ResponsiveContainer></div>
              </Card>

              <h2 className="section">Key lift analysis</h2>
              <div className="grid cols-3">
                <Card className="tight">
                  <div className="stat-label">6 key lifts — green if target hit</div>
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {key6.map(e => <Pill key={e.name} tone={e.hitTarget ? 'good' : 'muted'}>{e.name}</Pill>)}
                  </div>
                </Card>
                <Card className="tight">
                  <div className="stat-label">Top 3 most improved</div>
                  <div style={{ marginTop: 10 }}>{strength.topImproved.map(e => <div key={e.name} className="stat-row"><span className="k">{e.name}</span><span className="v pos">{fmt(e.pctGain * 100, 0, true)}%</span></div>)}{!strength.topImproved.length && <span className="faint">—</span>}</div>
                </Card>
                <Card className="tight">
                  <div className="stat-label">Heaviest lifts (est. 1RM)</div>
                  <div style={{ marginTop: 10 }}>{topLifts.map(e => <div key={e.name} className="stat-row"><span className="k">{e.name}</span><span className="v">{e.max}kg</span></div>)}</div>
                </Card>
              </div>

              <h2 className="section">Key lifts vs target (1RM)</h2>
              <Card>
                <div className="chart-wrap"><ResponsiveContainer>
                  <BarChart data={liftBars} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid {...gridProps} /><XAxis dataKey="name" {...axisProps} interval={0} angle={-15} textAnchor="end" height={50} /><YAxis {...axisProps} /><Tooltip {...tooltipProps} /><Legend wrapperStyle={{ fontSize: 11 }} />
                    <ChartDefs />
                    <Bar dataKey="First" fill={C.ghost} radius={[5, 5, 1, 1]} />
                    <Bar dataKey="Max" fill="url(#grad-accent)" radius={[5, 5, 1, 1]} />
                    <Bar dataKey="Target" fill="url(#grad-warn)" radius={[5, 5, 1, 1]} />
                  </BarChart>
                </ResponsiveContainer></div>
              </Card>

              <h2 className="section">Lift detail · est. 1RM over time</h2>
              <Card>
                <div style={{ marginBottom: 12 }}>
                  <select value={activeLift} onChange={e => setSelLift(e.target.value)} style={{ maxWidth: 280 }}>
                    {liftNames.map(nme => <option key={nme} value={nme}>{nme}</option>)}
                  </select>
                </div>
                <div className="chart-wrap"><ResponsiveContainer>
                  <LineChart data={liftDetail.data} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid {...gridProps} /><XAxis dataKey="date" {...axisProps} /><YAxis {...axisProps} domain={['auto', 'auto']} /><Tooltip {...tooltipProps} />
                    {liftDetail.ex?.target ? <ReferenceLine y={liftDetail.ex.target} stroke={C.warn} strokeDasharray="5 5" /> : null}
                    <Line type="monotone" dataKey="e1rm" stroke={C.accent} dot={{ r: 2.5, fill: C.accent, strokeWidth: 0 }} strokeWidth={2.6} connectNulls />
                  </LineChart>
                </ResponsiveContainer></div>
                <div className="grid cols-3" style={{ marginTop: 4 }}>
                  <StatBox label="Best est. 1RM" value={`${liftDetail.best || '–'}kg`} tone={liftDetail.ex?.hitTarget ? 'pos' : undefined} />
                  <StatBox label="Heaviest set" value={`${liftDetail.heaviest || '–'}kg`} />
                  <StatBox label="Target 1RM" value={liftDetail.ex?.target ? `${liftDetail.ex.target}kg` : '–'} rows={liftDetail.ex?.target ? [{ k: liftDetail.ex.hitTarget ? 'Hit ✓' : 'Not yet', v: '' }] : []} />
                </div>
              </Card>
            </>
          )}

          {seg === 'volume' && (
            <>
              <Card>
                <div className="chart-title">Tonnage per week · <b>total kg moved (weight × reps)</b></div>
                <div className="chart-wrap"><ResponsiveContainer>
                  <BarChart data={weekData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
                    <ChartDefs />
                    <CartesianGrid {...gridProps} /><XAxis dataKey="week" {...axisProps} /><YAxis {...axisProps} /><Tooltip {...tooltipProps} />
                    <Bar dataKey="tonnage" fill="url(#grad-fat)" radius={[8, 8, 2, 2]} maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer></div>
              </Card>

              <h2 className="section">Hard sets per week</h2>
              <Card>
                <div className="chart-wrap"><ResponsiveContainer>
                  <BarChart data={weekData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
                    <ChartDefs />
                    <CartesianGrid {...gridProps} /><XAxis dataKey="week" {...axisProps} /><YAxis {...axisProps} /><Tooltip {...tooltipProps} />
                    <Bar dataKey="sets" fill="url(#grad-muscle)" radius={[8, 8, 2, 2]} maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer></div>
              </Card>

              <h2 className="section">Training intensity · avg reps-in-reserve per week</h2>
              <Card>
                <div className="chart-wrap"><ResponsiveContainer>
                  <LineChart data={weekData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid {...gridProps} /><XAxis dataKey="week" {...axisProps} /><YAxis {...axisProps} allowDecimals /><Tooltip {...tooltipProps} />
                    <Line type="monotone" dataKey="rir" stroke={C.warn} dot={{ r: 2.5, fill: C.warn, strokeWidth: 0 }} strokeWidth={2.6} connectNulls />
                  </LineChart>
                </ResponsiveContainer></div>
                <div className="legend"><span className="faint">Lower RIR = training closer to failure.</span></div>
              </Card>
            </>
          )}
        </>
      )}
    </>
  )
}
