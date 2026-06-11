import React, { useState } from 'react'
import BodycompDash from './BodycompDash.jsx'
import CaloriesDash from './CaloriesDash.jsx'
import GymDash from './GymDash.jsx'

// ============================================================
// PROGRESS — the insights hub.
// IA decision: the old pop-up view picker hid what's available;
// an iOS-style segmented control shows all three lenses at once
// (Body / Nutrition / Strength) and swaps with one tap. Targets
// stopped being a separate screen — plan numbers now live as
// context rows inside the KPIs they explain.
// ============================================================
const VIEWS = [
  ['body', 'Body', BodycompDash],
  ['nutrition', 'Nutrition', CaloriesDash],
  ['strength', 'Strength', GymDash],
]

export default function DataDash() {
  const [sel, setSel] = useState('body')
  const View = (VIEWS.find(v => v[0] === sel) || VIEWS[0])[2]
  return (
    <>
      <div className="eyebrow">Insights</div>
      <h1 className="page" style={{ marginBottom: 18 }}>Progress</h1>
      <div className="segmented" role="tablist" aria-label="Progress views">
        {VIEWS.map(([k, label]) => (
          <button key={k} className={sel === k ? 'active' : ''} aria-current={sel === k ? 'page' : undefined} onClick={() => setSel(k)}>{label}</button>
        ))}
      </div>
      <View embedded />
    </>
  )
}
