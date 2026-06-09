import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, StatBox, Pill, fmt } from '../components/ui.jsx'

// The plan's calculated targets — recomputed live from Inputs. Lives in the
// Data tab (moved out of the Inputs page so Inputs stays just editable fields).
export default function Targets({ embedded }) {
  const { planRes } = useStore()
  return (
    <>
      {!embedded && <PageHead title="Targets" sub="What the plan is aiming for — recalculated live from your inputs." />}
      <div className="grid cols-3">
        <StatBox label="Bodyweight change" value={`${fmt(planRes.weightChange, 1, true)} kg`} info="Projected scale change over the whole period at your current plan." />
        <StatBox label="Muscle change" value={`${fmt(planRes.muscleChange, 1, true)} kg`} tone={planRes.muscleChange >= 0 ? 'pos' : 'neg'} />
        <StatBox label="Fat change" value={`${fmt(planRes.fatChange, 1, true)} kg`} tone={planRes.fatChange <= 0 ? 'pos' : 'neg'} />
        <StatBox label="Shred cleanliness" value={`${Math.round(planRes.cleanliness * 100)}%`} tone={planRes.cleanliness >= 0.5 ? 'pos' : 'neg'} info="How clean the planned change is — the share that's the good kind (muscle up, fat down). 50%+ is solid." />
        <StatBox label="Daily calories" value={`${Math.round(planRes.calorieTarget)} kcal`} rows={[{ k: 'Maintenance (TDEE)', v: `${Math.round(planRes.tdee)} kcal` }]} info="Your daily target = maintenance (TDEE) ± the deficit/surplus needed to reach your goal in time." />
        <StatBox label={`Daily ${planRes.dailyDelta >= 0 ? 'surplus' : 'deficit'}`} value={`${fmt(planRes.dailyDelta, 0, true)} kcal`} rows={[{ k: 'Protein target', v: `${Math.round(planRes.proteinTarget)} g` }]} />
      </div>
      {planRes.cleanliness < 0.5 && <div style={{ marginTop: 14 }}><Pill tone="warn">⚠ Cleanliness below 50% — a lot of your planned change is the wrong kind. Tune the plan or modifiers in Inputs.</Pill></div>}
    </>
  )
}
