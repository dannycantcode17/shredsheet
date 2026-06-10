import React from 'react'
import { useStore } from './state/store.jsx'
import Inputs from './modules/Inputs.jsx'
import GymPlan from './modules/GymPlan.jsx'
import DailyLog from './modules/DailyLog.jsx'
import Workout from './modules/Workout.jsx'
import FoodLog from './modules/FoodLog.jsx'
import DataDash from './modules/DataDash.jsx'
import AICoach from './modules/AICoach.jsx'
import Settings from './modules/Settings.jsx'
import Configurator from './modules/Configurator.jsx'
import { Icon } from './components/icons.jsx'

// Desktop sidebar grouping
const NAV = [
  { group: 'Insights', items: [
    { key: 'data', ix: '5', label: 'Data' },
    { key: 'coach', ix: '6', label: 'AI Coach' },
  ]},
  { group: 'Setup', items: [
    { key: 'inputs', ix: '1', label: 'Inputs' },
    { key: 'plan', ix: '2', label: 'Gym Plan' },
    { key: 'configure', ix: '↻', label: 'Reconfigure' },
  ]},
  { group: 'Log', items: [
    { key: 'food', ix: '3', label: 'Food' },
    { key: 'daily', ix: '4', label: 'Daily Log' },
    { key: 'gym', ix: '5', label: 'Workout' },
  ]},
]

// Mobile bottom tab bar — five slots; Log (the daily habit) sits prominent in
// the centre, everything else lives behind "More".
const TABS = [
  { key: 'data', label: 'Data', icon: 'activity' },
  { key: 'food', label: 'Food', icon: 'flame' },
  { key: 'daily', label: 'Log', icon: 'plus', emphasis: true },
  { key: 'gym', label: 'Gym', icon: 'dumbbell' },
  { key: 'more', label: 'More', icon: 'more' },
]
const MORE = [
  { key: 'coach', label: 'AI Coach', icon: 'chat', sub: 'Your live coach reads every number' },
  { key: 'configure', label: 'Reconfigure', icon: 'clipboard', sub: 'Rebuild your setup from scratch' },
  { key: 'inputs', label: 'Inputs', icon: 'sliders', sub: 'Who you are & what you’re chasing' },
  { key: 'plan', label: 'Gym Plan', icon: 'calendar', sub: 'Your training split & strength targets' },
  { key: 'settings', label: 'Settings', icon: 'settings', sub: 'AI key, backup & reset' },
]
const MORE_KEYS = MORE.map(m => m.key)

function MoreMenu({ setView }) {
  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <div className="eyebrow">System</div>
        <h1 className="page">More</h1>
      </div>
      <div className="more-list">
        {MORE.map(m => (
          <button key={m.key} className="more-row" onClick={() => setView(m.key)}>
            <span className="more-ic"><Icon name={m.icon} /></span>
            <span className="more-txt"><span className="more-label">{m.label}</span><span className="more-sub">{m.sub}</span></span>
            <span className="more-chev"><Icon name="chevron" /></span>
          </button>
        ))}
      </div>
    </>
  )
}

export default function App() {
  const { state, view, setView } = useStore()
  const v = view === 'dashboard' ? 'data' : view
  // First run (no data yet) opens the configurator; "Reconfigure" re-enters it.
  const seen = state.onboarded || Object.keys(state.dailyLog || {}).length > 0 || (state.workoutLog || []).length > 0
  if (!seen || v === 'configure') return <div className="app-root"><Configurator /></div>
  const tabActive = MORE_KEYS.includes(v) ? 'more' : v
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
          <button className={`nav-item ${v === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
            <span className="ix">⚙</span>Settings
          </button>
        </aside>
        <main className="main">
          {v === 'inputs' && <Inputs />}
          {v === 'plan' && <GymPlan />}
          {v === 'daily' && <DailyLog />}
          {v === 'food' && <FoodLog />}
          {v === 'data' && <DataDash />}
          {v === 'gym' && <Workout />}
          {v === 'coach' && <AICoach />}
          {v === 'settings' && <Settings />}
          {v === 'more' && <MoreMenu setView={setView} />}
        </main>
      </div>
      <nav className="tabbar" role="tablist" aria-label="Primary">
        {TABS.map(t => (
          <button key={t.key} className={`tab ${t.emphasis ? 'emphasis' : ''} ${tabActive === t.key ? 'active' : ''}`}
            aria-current={tabActive === t.key ? 'page' : undefined} onClick={() => setView(t.key)}>
            <span className="tab-ic"><Icon name={t.icon} /></span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
