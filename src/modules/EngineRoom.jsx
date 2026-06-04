import React from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Explain } from '../components/ui.jsx'
import { CONST } from '../lib/defaults.js'

// Value 3: effortless surface, inspectable depths. Everyday users live on the
// dashboards; the curious open this room and see exactly how their inputs become
// estimates. Nothing is locked — only tidied. No black-box scores.

const Row = ({ k, v, sub, strong }) => (
  <div className={`eng-row ${strong ? 'strong' : ''}`}>
    <div className="eng-k">{k}{sub && <span className="eng-sub">{sub}</span>}</div>
    <div className="eng-v">{v}</div>
  </div>
)

export default function EngineRoom() {
  const { planRes } = useStore()
  const m = planRes.multipliers
  const x = (v, dp = 2) => `×${Number(v).toFixed(dp)}`
  const kcal = (v) => `${Math.round(v)} kcal`

  return (
    <>
      <PageHead eyebrow="System" title="Engine Room"
        sub="Nothing here is hidden. This is exactly how the engine turns your inputs into estimates — open it when you're curious, ignore it when you're not." />

      <h2 className="section">Your muscle-gain multiplier, broken down</h2>
      <Card>
        <div className="eng-table">
          <Row k="Training volume" sub="planned weekly sets ÷ 60 baseline" v={x(m.volMult)} />
          <Row k="Newbie gains" sub="bonus for training age; fades after 45 days" v={x(m.newbie)} />
          <Row k="Bulk / cut" sub="a surplus helps muscle, a deficit limits it" v={x(m.bulkcut)} />
          <Row k="Protein" sub="the plan assumes you hit your target" v={x(m.proteinMult)} />
          <Row k="Sex" sub={`physiology factor (M ${CONST.SEX_MUSCLE_MULT.MALE.toFixed(2)} / F ${CONST.SEX_MUSCLE_MULT.FEMALE.toFixed(2)})`} v={x(m.sexMult)} />
          <Row k="Your muscle modifier" sub="your manual dial — the model bends to you" v={x(m.muscleMod)} />
          <Row k="= Combined multiplier" v={x(m.finalMuscleMod)} strong />
          <Row k="Risk penalty" sub="bites only when 2+ of volume / newbie / bulk / protein fall short; 0 = none" v={Number(m.penalty).toFixed(2)} />
        </div>
        <Explain label="So where does the kg figure come from?">
          Base rate <strong>{CONST.BASE_MUSCLE_GAIN_PER_WEEK} kg/week</strong> × the combined
          multiplier above (with the risk penalty applied if it's biting), spread over your{' '}
          <strong>{planRes.days} day</strong> period → a projected muscle change of{' '}
          <strong>{planRes.muscleChange >= 0 ? '+' : ''}{planRes.muscleChange.toFixed(1)} kg</strong>.
          That's the number you see on the dashboard, shown with its typical range because it's an estimate, not a promise.
        </Explain>
      </Card>

      <h2 className="section">Energy</h2>
      <Card>
        <div className="eng-table">
          <Row k="BMR" sub="resting burn (Mifflin–St Jeor × your metabolism modifier)" v={kcal(planRes.bmr)} />
          <Row k="Estimated maintenance (TDEE)" sub="BMR + steps + cardio + weights" v={kcal(planRes.tdee)} strong />
          <Row k="Daily calorie target" v={kcal(planRes.calorieTarget)} strong />
          <Row k={`Daily ${planRes.dailyDelta >= 0 ? 'surplus' : 'deficit'}`} sub="the gap that drives your projected change" v={kcal(Math.abs(planRes.dailyDelta))} />
          <Row k="Protein target" v={`${Math.round(planRes.proteinTarget)} g`} />
        </div>
      </Card>

      <h2 className="section">The constants</h2>
      <Card>
        <p className="muted" style={{ marginTop: 0 }}>
          The engine's assumptions, in the open. These live in <code>src/lib/defaults.js</code> and are
          the same for everyone; your numbers come from your inputs and the two manual modifiers above.
        </p>
        <div className="eng-grid">
          <div>
            <div className="eyebrow">Muscle engine</div>
            <div className="eng-table">
              <Row k="Base muscle gain" v={`${CONST.BASE_MUSCLE_GAIN_PER_WEEK} kg/wk`} />
              <Row k="Volume baseline" v={`${CONST.VOLUME_BASE_SETS_WK} sets/wk`} />
              <Row k="Sex factor (M / F)" v={`${CONST.SEX_MUSCLE_MULT.MALE} / ${CONST.SEX_MUSCLE_MULT.FEMALE}`} />
              <Row k="Newbie bonus held" v={`${CONST.NEWBIE_DECAY_FLAT_DAYS} days, then decays`} />
            </div>
          </div>
          <div>
            <div className="eyebrow">Energy</div>
            <div className="eng-table">
              <Row k="Fat" v={`${CONST.KCAL_PER_KG_FAT} kcal/kg`} />
              <Row k="Muscle (surplus)" v={`${CONST.KCAL_PER_KG_MUSCLE} kcal/kg`} />
              <Row k="Avg reps / set" v={CONST.AVG_REPS_PER_SET} />
            </div>
          </div>
          <div>
            <div className="eyebrow">Uncertainty band</div>
            <div className="eng-table">
              <Row k="Widest (no data)" v={`±${Math.round(CONST.UNCERTAINTY.REL_BASE * 100)}%`} />
              <Row k="Floor (well-logged)" v={`±${Math.round(CONST.UNCERTAINTY.REL_FLOOR * 100)}%`} />
              <Row k="Narrows over" v={`~${CONST.UNCERTAINTY.REL_TAU} logged days`} />
            </div>
          </div>
          <div>
            <div className="eyebrow">Risk-penalty thresholds</div>
            <div className="eng-table">
              <Row k="Volume / bulk-cut" v={`${CONST.VOLUME_THRESHOLD} / ${CONST.BULKCUT_THRESHOLD}`} />
              <Row k="Protein" v={CONST.PROTEIN_THRESHOLD} />
              <Row k="Caps (nu / int / exp)" v={`${CONST.PENALTY_CAP_NEWBIE} / ${CONST.PENALTY_CAP_INTERMEDIATE} / ${CONST.PENALTY_CAP_EXPERIENCED}`} />
            </div>
          </div>
        </div>
        <Explain label="Can I change these?">
          Your two dials are the <strong>metabolism</strong> and <strong>muscle</strong> modifiers in Inputs —
          they're applied right in the chains above, so when your real results disagree with the model, you bend
          the model to fit (not the other way round). The deeper constants are shared defaults; every change to
          them is logged openly in <code>CHANGES_FROM_EXCEL.md</code>.
        </Explain>
      </Card>
    </>
  )
}
