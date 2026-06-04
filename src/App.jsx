import React, { useEffect, useState } from 'react'
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

const SYSTEM_ITEMS = [
  { key: 'engine', ix: '⚙', label: 'Engine Room' },
  { key: 'settings', ix: '⚙', label: 'Settings' },
]

// One nav body, shared by the desktop sidebar and the mobile drawer.
function NavContent({ v, go }) {
  return (
    <>
      <div className="brand">THE SHRED<span className="dot">·</span>SHEET</div>
      <div className="brand-sub">smarter, not harder</div>
      {NAV.map(g => (
        <div key={g.group}>
          <div className="nav-group-label">{g.group}</div>
          {g.items.map(it => (
            <button key={it.key} className={`nav-item ${v === it.key ? 'active' : ''}`} onClick={() => go(it.key)}>
              <span className="ix">{it.ix}</span>{it.label}
            </button>
          ))}
        </div>
      ))}
      <div className="nav-group-label">System</div>
      {SYSTEM_ITEMS.map(it => (
        <button key={it.key} className={`nav-item ${v === it.key ? 'active' : ''}`} onClick={() => go(it.key)}>
          <span className="ix">{it.ix}</span>{it.label}
        </button>
      ))}
    </>
  )
}

export default function App() {
  const { state, view, setView } = useStore()
  const [navOpen, setNavOpen] = useState(false)

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [navOpen])

  // First run (or a deliberate reconfigure) drops the athlete into the wizard.
  if (!state.onboarded) return <Configurator />
  const v = view === 'dashboard' ? 'bodycomp' : view
  const go = (key) => { setView(key); setNavOpen(false) }

  const title = [...NAV.flatMap(g => g.items), ...SYSTEM_ITEMS].find(it => it.key === v)?.label || ''

  return (
    <div className="app-root">
      <div className="shell">
        <aside className="sidebar">
          <NavContent v={v} go={go} />
        </aside>

        {/* Mobile-only top bar (≤900px) */}
        <header className="topbar">
          <button className="topbar-burger" aria-label="Open menu" aria-expanded={navOpen} onClick={() => setNavOpen(true)}>
            <span /><span /><span />
          </button>
          <div className="topbar-brand">SHRED<span className="dot">·</span>SHEET</div>
          <div className="topbar-title">{title}</div>
        </header>

        {/* Mobile-only slide-in drawer (≤900px) */}
        <div className={`nav-scrim ${navOpen ? 'open' : ''}`} onClick={() => setNavOpen(false)} />
        <aside className={`nav-drawer ${navOpen ? 'open' : ''}`} aria-hidden={!navOpen}>
          <button className="nav-drawer-close" aria-label="Close menu" onClick={() => setNavOpen(false)}>✕</button>
          <NavContent v={v} go={go} />
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
