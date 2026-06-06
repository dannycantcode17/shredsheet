import React from 'react'
import { useStore } from './state/store.jsx'
import Inputs from './modules/Inputs.jsx'
import GymPlan from './modules/GymPlan.jsx'
import DailyLog from './modules/DailyLog.jsx'
import WorkoutLog from './modules/WorkoutLog.jsx'
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
    { key: 'daily', label: 'Daily Log' },
    { key: 'workout', label: 'Workout Log' },
  ]},
]

export default function App() {
  const { state, view, setView } = useStore()
  if (!state.onboarded) return <Configurator />
  const v = view === 'dashboard' ? 'bodycomp' : view
  return (
    <div className="app-root">
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">shred<span className="accent">sheet</span></div>
          <div className="brand-sub">less faff, more gains</div>
          {NAV.map(g => (
            <div key={g.group}>
              <div className="nav-group-label">{g.group}</div>
              {g.items.map(it => (
                <button key={it.key} className={`nav-item ${v === it.key ? 'active' : ''}`} onClick={() => setView(it.key)}>
                  {it.label}
                </button>
              ))}
            </div>
          ))}
          <div className="nav-group-label">System</div>
          <button className={`nav-item ${v === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
            Settings
          </button>
        </aside>
        <main className="main">
          {v === 'inputs' && <Inputs />}
          {v === 'plan' && <GymPlan />}
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
