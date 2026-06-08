import React, { useState } from 'react'
import { useStore } from './state/store.jsx'
import Inputs from './modules/Inputs.jsx'
import GymPlan from './modules/GymPlan.jsx'
import DailyLog from './modules/DailyLog.jsx'
import WorkoutLog from './modules/WorkoutLog.jsx'
import FoodLog from './modules/FoodLog.jsx'
import BodycompDash from './modules/BodycompDash.jsx'
import GymDash from './modules/GymDash.jsx'
import AICoach from './modules/AICoach.jsx'
import Settings from './modules/Settings.jsx'
import Configurator from './modules/Configurator.jsx'

const NAV = [
  { group: 'Insights', items: [
    { key: 'bodycomp', label: 'Bodycomp Dash' },
    { key: 'gym', label: 'Gym Dash' },
    { key: 'coach', label: 'AI Coach' },
  ]},
  { group: 'Setup', items: [
    { key: 'inputs', label: 'Inputs' },
    { key: 'plan', label: 'Gym Plan' },
  ]},
  { group: 'Log', items: [
    { key: 'food', label: 'Food' },
    { key: 'workout', label: 'Workout Log' },
    { key: 'daily', label: 'Daily' },
  ]},
]

export default function App() {
  const { state, view, setView } = useStore()
  const [navOpen, setNavOpen] = useState(false)
  if (!state.onboarded) return <Configurator />
  const v = view === 'dashboard' ? 'bodycomp' : view
  const go = (k) => { setView(k); setNavOpen(false) }
  return (
    <div className="app-root">
      <header className="topbar">
        <div className="brand">shred<span className="accent">sheet</span></div>
        <button className="menu-btn" onClick={() => setNavOpen(o => !o)} aria-label="Menu" aria-expanded={navOpen}>☰</button>
      </header>
      <div className="shell">
        {navOpen && <div className="nav-backdrop" onClick={() => setNavOpen(false)} />}
        <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
          <div className="brand">shred<span className="accent">sheet</span></div>
          <div className="brand-sub">less faff, more gains</div>
          {NAV.map(g => (
            <div key={g.group}>
              <div className="nav-group-label">{g.group}</div>
              {g.items.map(it => (
                <button key={it.key} className={`nav-item ${v === it.key ? 'active' : ''}`} onClick={() => go(it.key)}>
                  {it.label}
                </button>
              ))}
            </div>
          ))}
          <div className="nav-group-label">System</div>
          <button className={`nav-item ${v === 'settings' ? 'active' : ''}`} onClick={() => go('settings')}>
            Settings
          </button>
        </aside>
        <main className="main">
          {v === 'inputs' && <Inputs />}
          {v === 'plan' && <GymPlan />}
          {v === 'food' && <FoodLog />}
          {v === 'daily' && <DailyLog />}
          {v === 'workout' && <WorkoutLog />}
          {v === 'bodycomp' && <BodycompDash />}
          {v === 'gym' && <GymDash />}
          {v === 'coach' && <AICoach />}
          {v === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  )
}
