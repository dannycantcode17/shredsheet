import React from 'react'
import { useStore } from './state/store.jsx'
import Configurator from './modules/Configurator.jsx'
import Inputs from './modules/Inputs.jsx'
import GymPlan from './modules/GymPlan.jsx'
import DailyLog from './modules/DailyLog.jsx'
import WorkoutLog from './modules/WorkoutLog.jsx'
import BodycompDash from './modules/BodycompDash.jsx'
import GymDash from './modules/GymDash.jsx'
import AICoach from './modules/AICoach.jsx'
import EngineRoom from './modules/EngineRoom.jsx'
import Settings from './modules/Settings.jsx'

const NAV = [
  { group: 'Insights', items: [
    { key: 'bodycomp', ix: '5', label: 'Bodycomp Dash' },
    { key: 'gym', ix: '6', label: 'Gym Dash' },
    { key: 'coach', ix: '7', label: 'AI Coach' },
  ]},
  { group: 'Setup', items: [
    { key: 'inputs', ix: '1', label: 'Inputs' },
    { key: 'plan', ix: '2', label: 'Gym Plan' },
  ]},
  { group: 'Log', items: [
    { key: 'daily', ix: '3', label: 'Daily Log' },
    { key: 'workout', ix: '4', label: 'Workout Log' },
  ]},
]

export default function App() {
  const { state, view, setView } = useStore()
  // First run (or a deliberate reconfigure) drops the athlete into the wizard.
  if (!state.onboarded) return <Configurator />
  const v = view === 'dashboard' ? 'bodycomp' : view
  return (
    <div className="app-root">
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">THE SHRED<span className="dot">·</span>SHEET</div>
          <div className="brand-sub">smarter, not harder</div>
          {NAV.map(g => (
            <div key={g.group}>
              <div className="nav-group-label">{g.group}</div>
              {g.items.map(it => (
                <button key={it.key} className={`nav-item ${v === it.key ? 'active' : ''}`} onClick={() => setView(it.key)}>
                  <span className="ix">{it.ix}</span>{it.label}
                </button>
              ))}
            </div>
          ))}
          <div className="nav-group-label">System</div>
          <button className={`nav-item ${v === 'engine' ? 'active' : ''}`} onClick={() => setView('engine')}>
            <span className="ix">⚙</span>Engine Room
          </button>
          <button className={`nav-item ${v === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
            <span className="ix">⚙</span>Settings
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
          {v === 'engine' && <EngineRoom />}
          {v === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  )
}
