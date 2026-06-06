import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Pill } from '../components/ui.jsx'

// Phone-first training plan: each day is a glass card you scroll through, with
// its lifts as rows rather than a wide spreadsheet grid. Same plan data model
// as before (name + 10 exercise slots per day) — just presented for a phone.
export default function GymPlan() {
  const { state, setPlan, planRes } = useStore()
  const setDay = (di, patch) => setPlan(state.plan.map((d, i) => i !== di ? d : { ...d, ...patch }))
  const setEx = (di, ei, patch) => setPlan(state.plan.map((d, i) => i !== di ? d : { ...d, exercises: d.exercises.map((e, j) => j !== ei ? e : { ...e, ...patch }) }))
  const clearEx = (di, ei) => setEx(di, ei, { name: '', compound: false, sets: '', goalWeight: '', goalReps: '' })

  // render named days, plus the first unnamed day as the "add a day" card
  const dayViews = []
  let addDayShown = false
  state.plan.forEach((d, di) => {
    if (d.name) dayViews.push({ d, di, isNew: false })
    else if (!addDayShown) { dayViews.push({ d, di, isNew: true }); addDayShown = true }
  })

  return (
    <>
      <PageHead eyebrow="Setup" title="Gym Plan" sub="Your training split. Name each day, then add the lifts you'll do and the targets you're working toward." />
      <div style={{ marginBottom: 14 }}><Pill tone="muted">{planRes.plannedSets} sets planned across your week</Pill></div>

      {dayViews.map(({ d, di, isNew }) => {
        const setsForDay = d.exercises.reduce((a, e) => a + (parseInt(e.sets) || 0), 0)
        // exercises with a name, plus the first empty slot for quick-add
        const exViews = []
        let addExShown = false
        d.exercises.forEach((e, ei) => {
          if (e.name) exViews.push({ e, ei })
          else if (!addExShown) { exViews.push({ e, ei }); addExShown = true }
        })
        return (
          <Card key={di} className="gp-day">
            <div className="gp-day-head">
              <input className="gp-day-name" placeholder={isNew ? 'Name a day to add it (e.g. Push)' : 'Day name'}
                value={d.name} onChange={e => setDay(di, { name: e.target.value })} />
              {!isNew && <span className="faint" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{setsForDay} sets</span>}
            </div>
            {d.name && exViews.map(({ e, ei }) => (
              <div className="gp-ex" key={ei}>
                <div className="gp-ex-top">
                  <input className="gp-ex-name" placeholder="Add an exercise…" value={e.name}
                    onChange={ev => setEx(di, ei, { name: ev.target.value })} />
                  {e.name && <button className="gp-x" onClick={() => clearEx(di, ei)} aria-label="Remove exercise">✕</button>}
                </div>
                {e.name && (
                  <div className="gp-ex-fields">
                    <label className="gp-f"><span>Sets</span><input type="number" value={e.sets} onChange={ev => setEx(di, ei, { sets: ev.target.value })} /></label>
                    <label className="gp-f"><span>Goal kg</span><input type="number" value={e.goalWeight} onChange={ev => setEx(di, ei, { goalWeight: ev.target.value })} /></label>
                    <label className="gp-f"><span>Goal reps</span><input type="number" value={e.goalReps} onChange={ev => setEx(di, ei, { goalReps: ev.target.value })} /></label>
                    <button type="button" className={`gp-tag ${e.compound ? 'on' : ''}`} onClick={() => setEx(di, ei, { compound: !e.compound })}>Compound</button>
                  </div>
                )}
              </div>
            ))}
          </Card>
        )
      })}
    </>
  )
}
