import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Pill } from '../components/ui.jsx'
import { estimateMeal } from '../lib/ai.js'

const todayDayNum = (startDate) => Math.floor((Date.parse(new Date().toISOString().slice(0, 10)) - Date.parse(startDate)) / 86400000) + 1
const isoOf = (start, n) => { const dt = new Date(start); dt.setDate(dt.getDate() + (n - 1)); return dt.toISOString().slice(0, 10) }
const ddmm = (iso) => { if (!iso) return ''; const [, m, d] = iso.split('-'); return `${d}/${m}` }

// Food page — log meals (calories + protein). Describe a meal for an AI
// estimate, or enter your own. Meals live in dailyLog[day].meals and their sum
// is written to dailyLog[day].calories/.protein, which the engine already
// reads — so everything logged here feeds the day's numbers (no engine change).
export default function FoodLog() {
  const { state, setDailyLog, planRes } = useStore()
  const days = Math.max(1, parseInt(state.inputs.periodDays) || 1)
  const today = Math.min(days, Math.max(1, todayDayNum(state.inputs.startDate) || 1))
  const [viewDay, setViewDay] = useState(today)
  const d = Math.min(days, Math.max(1, viewDay))
  const log = state.dailyLog[d] || {}
  const meals = log.meals || []
  const iso = isoOf(state.inputs.startDate, d)

  const [desc, setDesc] = useState('')
  const [busy, setBusy] = useState(false)
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [err, setErr] = useState('')

  // meals are the source of truth; keep the day's calorie/protein totals in sync
  const writeMeals = (next) => {
    const calories = Math.round(next.reduce((a, m) => a + (parseFloat(m.calories) || 0), 0))
    const proteinSum = Math.round(next.reduce((a, m) => a + (parseFloat(m.protein) || 0), 0))
    setDailyLog(d, { meals: next, calories, protein: proteinSum })
  }
  const estimate = async () => {
    if (!desc.trim() || busy) return
    setBusy(true); setErr('')
    try {
      const r = await estimateMeal({ description: desc, apiKey: state.apiKey })
      if (r.calories == null && r.protein == null) setErr("Couldn't get an estimate — check the coach connection in Settings.")
      else { setKcal(r.calories != null ? String(r.calories) : ''); setProtein(r.protein != null ? String(r.protein) : '') }
    } catch (e) { setErr('Something went wrong: ' + e.message) } finally { setBusy(false) }
  }
  const addMeal = () => {
    const c = Math.round(parseFloat(kcal) || 0), p = Math.round(parseFloat(protein) || 0)
    if (!c && !p && !desc.trim()) return
    writeMeals([...meals, { desc: desc.trim() || 'Meal', calories: c, protein: p }])
    setDesc(''); setKcal(''); setProtein('')
  }
  const delMeal = (i) => writeMeals(meals.filter((_, j) => j !== i))

  const label = d === today ? 'Today' : d === today - 1 ? 'Yesterday' : `Day ${d}`
  const totalC = Math.round(meals.reduce((a, m) => a + (parseFloat(m.calories) || 0), 0))
  const totalP = Math.round(meals.reduce((a, m) => a + (parseFloat(m.protein) || 0), 0))

  return (
    <>
      <PageHead title="Food" sub="Log meals — describe one and the coach estimates calories + protein, or enter your own." />

      <Card style={{ marginBottom: 14 }}>
        <div className="fd-nav">
          <button className="fd-arrow" onClick={() => setViewDay(v => Math.max(1, v - 1))} disabled={d <= 1} aria-label="Previous day">‹</button>
          <button className="fd-day" onClick={() => setViewDay(today)} title="Jump to today">
            <div className="fd-day-label">{label}</div>
            <div className="faint" style={{ fontSize: 12 }}>Day {d} · {ddmm(iso)}</div>
          </button>
          <button className="fd-arrow" onClick={() => setViewDay(v => Math.min(days, v + 1))} disabled={d >= days} aria-label="Next day">›</button>
        </div>
        <div className="divider" />
        <div className="fd-totals">
          <div><div className="fd-big">{totalC}</div><div className="faint">/ {Math.round(planRes.calorieTarget)} kcal</div></div>
          <div><div className="fd-big">{totalP}g</div><div className="faint">/ {Math.round(planRes.proteinTarget)}g protein</div></div>
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Add a meal</div>
        <textarea rows={2} placeholder="e.g. chicken burrito bowl with rice, beans, guac" value={desc} onChange={e => setDesc(e.target.value)} />
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button className="btn" onClick={estimate} disabled={busy || !desc.trim()}>{busy ? 'Estimating…' : '✨ Estimate with coach'}</button>
        </div>
        {err && <div style={{ marginTop: 12 }}><Pill tone="bad">{err}</Pill></div>}
        <div className="fd-entry">
          <label className="dl-field"><span className="dl-k">Calories</span><input type="number" inputMode="numeric" placeholder="kcal" value={kcal} onChange={e => setKcal(e.target.value)} /></label>
          <label className="dl-field"><span className="dl-k">Protein (g)</span><input type="number" inputMode="numeric" placeholder="g" value={protein} onChange={e => setProtein(e.target.value)} /></label>
          <button className="btn primary fd-addbtn" onClick={addMeal} disabled={!kcal && !protein && !desc.trim()}>Add</button>
        </div>
        <div className="divider" />
        <Pill tone="warn">AI estimate — not exact</Pill>
        <p className="faint" style={{ margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.5 }}>It can't see your exact portions, so treat it as a starting point — tweak the numbers before adding.</p>
      </Card>

      <Card>
        <div className="eyebrow">{label}'s meals</div>
        {!meals.length && <p className="faint" style={{ marginTop: 12, marginBottom: 0 }}>No meals logged for this day yet.</p>}
        {meals.map((m, i) => (
          <div className="fd-meal" key={i}>
            <div style={{ minWidth: 0 }}>
              <div className="fd-meal-name">{m.desc}</div>
              <div className="fd-meal-sub">{m.calories || 0} kcal · {m.protein || 0}g protein</div>
            </div>
            <button className="btn ghost fd-x" onClick={() => delMeal(i)} aria-label="Delete meal">✕</button>
          </div>
        ))}
      </Card>
    </>
  )
}
