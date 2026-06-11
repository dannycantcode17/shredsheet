import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Stepper, EmptyState } from '../components/ui.jsx'
import { Icon } from '../components/icons.jsx'

// ============================================================
// PLAN STUDIO — complete rethink of the old spreadsheet table.
// IA decision: a programme is a list of training days, each a
// list of exercises — so it's rendered exactly like that:
// day cards with tappable exercise rows. Tap a row → an inline
// editor unfolds (steppers, toggle chips — no table cells).
// Each row with a strength target shows live progress toward
// its target e1RM, computed by the engine's existing
// computeStrength. The stored plan shape is byte-compatible
// with the old table: same array, same five fields per slot.
// ============================================================

const num = (v, d = 0) => { const x = parseFloat(v); return Number.isFinite(x) ? x : d }
const blankEx = () => ({ name: '', compound: false, sets: '', goalWeight: '', goalReps: '' })

export default function GymPlan() {
  const { state, setPlan, planRes, strength } = useStore()
  const [open, setOpen] = useState(null)        // `${di}:${ei}` of the row being edited
  const [addingDay, setAddingDay] = useState(false)
  const [newDayName, setNewDayName] = useState('')

  const strengthByName = Object.fromEntries(strength.exercises.map(e => [e.name, e]))
  const activeIdx = state.plan.map((d, i) => [d, i]).filter(([d]) => d.name)
  const firstBlankDay = state.plan.findIndex(d => !d.name)

  const updateEx = (di, ei, patch) => setPlan(state.plan.map((d, idx) => idx !== di ? d : { ...d, exercises: d.exercises.map((e, j) => j !== ei ? e : { ...e, ...patch }) }))
  const updateName = (di, name) => setPlan(state.plan.map((d, idx) => idx !== di ? d : { ...d, name }))
  const clearEx = (di, ei) => { updateEx(di, ei, blankEx()); setOpen(null) }
  const addEx = (di) => {
    const d = state.plan[di]
    let ei = d.exercises.findIndex(e => !e.name)
    if (ei === -1) {
      ei = d.exercises.length
      setPlan(state.plan.map((dd, idx) => idx !== di ? dd : { ...dd, exercises: [...dd.exercises, blankEx()] }))
    }
    setOpen(`${di}:${ei}`)
  }
  const addDay = () => {
    if (!newDayName.trim() || firstBlankDay === -1) return
    updateName(firstBlankDay, newDayName.trim().toUpperCase())
    setNewDayName(''); setAddingDay(false)
  }

  return (
    <>
      <PageHead eyebrow="Setup" title="Plan" sub="Your programme. Tap an exercise to edit it; set a goal weight × reps to give a lift a strength target." />

      <div className="plan-kpis">
        <div className="plan-kpi"><div className="pk-num">{activeIdx.length}</div><div className="pk-lbl">training days</div></div>
        <div className="plan-kpi"><div className="pk-num">{planRes.plannedSets}</div><div className="pk-lbl">sets / week</div></div>
        <div className="plan-kpi"><div className="pk-num">{strength.key6.filter(e => e.hitTarget).length}<span className="pk-of">/{strength.key6.length || 0}</span></div><div className="pk-lbl">targets hit</div></div>
      </div>

      {activeIdx.length === 0 && (
        <EmptyState icon="calendar" title="Build your split"
          sub="Add your first training day below — PUSH, PULL, LEGS, UPPER, whatever your split is — then stack it with exercises." />
      )}

      {activeIdx.map(([day, di]) => {
        // include a just-added blank slot while it's being edited, so the
        // editor mounts once and the name input keeps focus while typing
        const named = day.exercises.map((e, ei) => [e, ei]).filter(([e, ei]) => e.name || open === `${di}:${ei}`)
        const daySets = named.reduce((a, [e]) => a + num(e.sets), 0)
        return (
          <Card key={di} className="plan-day">
            <div className="plan-day-head">
              <input className="plan-day-name" value={day.name} onChange={e => updateName(di, e.target.value)} aria-label="Day name" />
              <span className="plan-day-sets">{daySets} sets</span>
            </div>

            {named.map(([e, ei]) => {
              const id = `${di}:${ei}`
              const st = strengthByName[e.name]
              const hasTarget = e.goalWeight !== '' && e.goalReps !== '' && e.goalWeight != null && e.goalReps != null
              const pct = st && st.target ? Math.min(1, st.max / st.target) : null
              const editing = open === id
              return (
                <div key={ei} className={`plan-ex ${editing ? 'editing' : ''}`}>
                  <button type="button" className="plan-ex-row" onClick={() => setOpen(editing ? null : id)} aria-expanded={editing}>
                    <span className="plan-ex-main">
                      <span className="plan-ex-name">{e.name || <span className="faint">New exercise…</span>}</span>
                      <span className="plan-ex-meta">
                        {num(e.sets) || '–'} sets · {e.compound ? 'compound' : 'isolation'}
                        {hasTarget ? ` · goal ${e.goalWeight}kg × ${e.goalReps}` : ''}
                      </span>
                      {pct != null && (
                        <span className="plan-ex-prog">
                          <span className="ppr-track"><span className={`ppr-fill ${st.hitTarget ? 'hit' : ''}`} style={{ width: `${Math.round(pct * 100)}%` }} /></span>
                          <span className="ppr-txt">{st.hitTarget ? <>target hit <Icon name="check" /></> : `${Math.round(pct * 100)}% to ${st.target}kg e1RM`}</span>
                        </span>
                      )}
                    </span>
                    <span className={`plan-ex-chev ${editing ? 'open' : ''}`}><Icon name="chevron" /></span>
                  </button>

                  {editing && (
                    <div className="plan-ed">
                      <label className="dl-field"><span className="dl-k">Exercise name</span>
                        <input value={e.name} onChange={ev => updateEx(di, ei, { name: ev.target.value })} />
                      </label>
                      <div className="plan-ed-grid">
                        <Stepper label="Sets" value={e.sets} onChange={v => updateEx(di, ei, { sets: v })} step={1} />
                        <div className="dl-field">
                          <span className="dl-k">Type</span>
                          <div className="seg-pair">
                            <button type="button" className={!e.compound ? 'on' : ''} onClick={() => updateEx(di, ei, { compound: false })}>Isolation</button>
                            <button type="button" className={e.compound ? 'on' : ''} onClick={() => updateEx(di, ei, { compound: true })}>Compound</button>
                          </div>
                        </div>
                      </div>
                      <div className="plan-ed-grid">
                        <Stepper label="Goal weight (kg)" value={e.goalWeight} onChange={v => updateEx(di, ei, { goalWeight: v })} step={2.5} placeholder="optional" />
                        <Stepper label="Reps for goal" value={e.goalReps} onChange={v => updateEx(di, ei, { goalReps: v })} step={1} placeholder="optional" />
                      </div>
                      <div className="btn-row">
                        <button className="btn" onClick={() => setOpen(null)}>Done</button>
                        <button className="btn ghost" style={{ color: 'var(--bad)' }} onClick={() => clearEx(di, ei)}>Remove</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <button type="button" className="plan-add-ex" onClick={() => addEx(di)}>+ Add exercise</button>
          </Card>
        )
      })}

      {firstBlankDay !== -1 && (
        addingDay ? (
          <Card className="plan-day">
            <label className="dl-field"><span className="dl-k">Day name</span>
              <input autoFocus placeholder="e.g. UPPER A" value={newDayName}
                onChange={e => setNewDayName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addDay()} />
            </label>
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={addDay} disabled={!newDayName.trim()}>Add day</button>
              <button className="btn ghost" onClick={() => { setAddingDay(false); setNewDayName('') }}>Cancel</button>
            </div>
          </Card>
        ) : (
          <button type="button" className="plan-add-day" onClick={() => setAddingDay(true)}>+ Add training day</button>
        )
      )}
    </>
  )
}
