import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, StatBox, EmptyState, fmt } from '../components/ui.jsx'
import { epley1RM } from '../lib/engine.js'
import { ResponsiveContainer, LineChart, Line, ComposedChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts'
import { axisProps, gridProps, tooltipProps, ChartDefs, C } from '../components/chart.jsx'

// STRENGTH — curated from the old three-segment dump down to the
// four things that matter: (1) headline consistency/volume KPIs,
// (2) one lift's e1RM journey (chips, not a dropdown), (3) key
// lifts vs their targets, (4) weekly load. Cut: sets-per-split-day,
// the per-set-count strength curve and the RIR chart — low signal,
// high noise. All numbers still come from computeStrength + the log.
const num = (v, d = 0) => { const x = parseFloat(v); return Number.isFinite(x) ? x : d }

export default function GymDash({ embedded }) {
  const { state, strength, planRes, daily, setView } = useStore()
  const [selLift, setSelLift] = useState('')
  const key6 = strength.key6
  const noLifts = !strength.exercises.length

  // ---- lifetime totals + consistency (mined from the set-level log) ----
  const sets = state.workoutLog.filter(s => s.exercise && s.weight !== '' && s.weight != null && s.reps !== '' && s.reps != null)
  const tonnage = sets.reduce((a, s) => a + num(s.weight) * num(s.reps), 0)
  const tonnageLabel = tonnage >= 1000 ? `${(tonnage / 1000).toFixed(1)}t` : `${Math.round(tonnage)}kg`
  const sessionDates = [...new Set(sets.map(s => s.date).filter(Boolean))].sort()
  const sessions = sessionDates.length
  const firstDate = sessionDates[0], lastDate = sessionDates[sessions - 1]
  const spanDays = firstDate && lastDate ? Math.round((new Date(lastDate) - new Date(firstDate)) / 86400000) + 1 : 0
  const sessionsPerWeek = sessions ? sessions / Math.max(1, spanDays / 7) : 0

  // ---- weekly load buckets ----
  const weeks = {}
  sets.forEach(s => {
    if (!s.date) return
    const k = Math.floor((new Date(s.date) - new Date(firstDate)) / (7 * 86400000))
    const w = (weeks[k] ||= { tonnage: 0, sets: 0 })
    w.tonnage += num(s.weight) * num(s.reps); w.sets += 1
  })
  const weekData = Object.keys(weeks).map(Number).sort((a, b) => a - b).map(k => ({
    week: `W${k + 1}`, Tonnage: Math.round(weeks[k].tonnage), Sets: weeks[k].sets,
  }))

  // ---- lift drill-down: best est. 1RM per training day ----
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
    const data = Object.keys(perDay).sort().map(d => ({ date: d.slice(5), e1RM: Math.round(perDay[d] * 10) / 10 }))
    const ex = strength.exercises.find(e => e.name === activeLift) || null
    return { data, heaviest, ex, best: ex ? ex.max : (data.length ? Math.max(...data.map(p => p.e1RM)) : 0) }
  })()

  const liftBars = key6.map(e => ({ name: e.name.length > 14 ? e.name.slice(0, 13) + '…' : e.name, First: e.first, Best: e.max, Target: e.target || 0 }))

  if (noLifts) {
    return (
      <>
        {!embedded && <PageHead title="Strength" sub="Strength, volume & consistency." />}
        <EmptyState icon="dumbbell" title="No workouts yet"
          sub="Log your first sets in Train and your strength, volume and consistency tracking light up here."
          action="Start training" onAction={() => setView('gym')} />
      </>
    )
  }

  return (
    <>
      {!embedded && <PageHead title="Strength" sub="Strength, volume & consistency." />}

      <div className="grid cols-3">
        <StatBox label="Total volume lifted" value={tonnageLabel} rows={[{ k: 'Sets', v: `${sets.length}` }, { k: 'Sessions', v: `${sessions}` }]} info="Total weight moved = weight × reps across every set you've logged (a.k.a. tonnage)." />
        <StatBox label="Sessions / week" value={sessionsPerWeek.toFixed(1)} tone={sessionsPerWeek >= num(state.inputs.gymSessionsPerWeek) ? 'pos' : undefined} rows={[{ k: 'Target', v: `${state.inputs.gymSessionsPerWeek}` }, { k: 'Sets/wk (7d)', v: daily.last7.setsPerWeek.toFixed(1) }]} />
        <StatBox label="Avg strength gain" value={`${fmt(strength.avgPctGain * 100, 0, true)}%`} tone={strength.avgPctGain >= 0 ? 'pos' : 'neg'} rows={[{ k: 'Lifts tracked', v: `${strength.exercises.length}` }, { k: 'Targets hit', v: `${key6.filter(e => e.hitTarget).length}/${key6.length}` }]} />
      </div>

      <h2 className="section">Lift progression</h2>
      <Card>
        <div className="lift-chips">
          {(key6.length ? key6.map(e => e.name) : liftNames.slice(0, 6)).map(nme => (
            <button key={nme} className={`chip ${activeLift === nme ? 'on' : ''}`} onClick={() => setSelLift(nme)}>{nme}</button>
          ))}
        </div>
        <div className="chart-wrap"><ResponsiveContainer>
          <LineChart data={liftDetail.data} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid {...gridProps} /><XAxis dataKey="date" {...axisProps} /><YAxis {...axisProps} domain={['auto', 'auto']} /><Tooltip {...tooltipProps} />
            {liftDetail.ex?.target ? <ReferenceLine y={liftDetail.ex.target} stroke={C.warn} strokeDasharray="5 5" /> : null}
            <Line type="monotone" dataKey="e1RM" stroke={C.accent} dot={{ r: 2.5, fill: C.accent, strokeWidth: 0 }} strokeWidth={2.6} connectNulls />
          </LineChart>
        </ResponsiveContainer></div>
        <div className="grid cols-3" style={{ marginTop: 12 }}>
          <StatBox label="Best est. 1RM" value={`${liftDetail.best || '–'}kg`} tone={liftDetail.ex?.hitTarget ? 'pos' : undefined} />
          <StatBox label="Heaviest set" value={`${liftDetail.heaviest || '–'}kg`} />
          <StatBox label="Target 1RM" value={liftDetail.ex?.target ? `${liftDetail.ex.target}kg` : '–'} rows={liftDetail.ex?.target ? [{ k: liftDetail.ex.hitTarget ? 'Hit ✓' : 'Not yet', v: '' }] : []} />
        </div>
      </Card>

      {liftBars.length > 0 && (
        <>
          <h2 className="section">Key lifts vs target</h2>
          <Card>
            <div className="chart-wrap"><ResponsiveContainer>
              <BarChart data={liftBars} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
                <ChartDefs />
                <CartesianGrid {...gridProps} /><XAxis dataKey="name" {...axisProps} interval={0} angle={-15} textAnchor="end" height={50} /><YAxis {...axisProps} /><Tooltip {...tooltipProps} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="First" fill={C.ghost} radius={[5, 5, 1, 1]} />
                <Bar dataKey="Best" fill="url(#grad-accent)" radius={[5, 5, 1, 1]} />
                <Bar dataKey="Target" fill="url(#grad-warn)" radius={[5, 5, 1, 1]} />
              </BarChart>
            </ResponsiveContainer></div>
          </Card>
        </>
      )}

      <h2 className="section">Weekly load</h2>
      <Card>
        <div className="chart-title">Tonnage (bars) and hard sets (line) · <b>per week</b></div>
        <div className="chart-wrap"><ResponsiveContainer>
          <ComposedChart data={weekData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
            <ChartDefs />
            <CartesianGrid {...gridProps} /><XAxis dataKey="week" {...axisProps} />
            <YAxis yAxisId="t" {...axisProps} />
            <YAxis yAxisId="s" orientation="right" {...axisProps} />
            <Tooltip {...tooltipProps} />
            <ReferenceLine yAxisId="s" y={planRes.plannedSets} stroke={C.muscle} strokeDasharray="5 5" strokeOpacity={0.6} />
            <Bar yAxisId="t" dataKey="Tonnage" fill="url(#grad-fat)" radius={[8, 8, 2, 2]} maxBarSize={48} />
            <Line yAxisId="s" type="monotone" dataKey="Sets" stroke={C.muscle} dot={{ r: 2.5, fill: C.muscle, strokeWidth: 0 }} strokeWidth={2.4} />
          </ComposedChart>
        </ResponsiveContainer></div>
        <div className="legend">
          <span className="key"><span className="swatch" style={{ background: C.fat }} />Tonnage (kg)</span>
          <span className="key"><span className="swatch" style={{ background: C.muscle }} />Sets · dashed = planned {planRes.plannedSets}/wk</span>
        </div>
      </Card>
    </>
  )
}
