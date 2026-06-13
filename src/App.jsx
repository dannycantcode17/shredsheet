import React from 'react'
import { useStore } from './state/store.jsx'
import Today from './modules/Today.jsx'
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

// ============================================================
// INFORMATION ARCHITECTURE
// The user journey is built around the daily loop:
//   TODAY (home) → what can I eat, what's due, am I on track
//   TRAIN        → log the session, driven by the plan
//   FOOD         → log meals (the FAB — the most frequent action)
//   PROGRESS     → the three lenses: body / nutrition / strength
// Setup (Plan, Inputs) and system screens sit behind the
// sidebar groups on desktop and "More" on the phone.
// ============================================================

const NAV = [
  { group: 'Daily', items: [
    { key: 'today', ix: 'home', label: 'Today' },
    { key: 'food', ix: 'flame', label: 'Food' },
    { key: 'gym', ix: 'dumbbell', label: 'Train' },
  ]},
  { group: 'Insights', items: [
    { key: 'data', ix: 'trend', label: 'Progress' },
    { key: 'coach', ix: 'chat', label: 'AI Coach' },
  ]},
  { group: 'Setup', items: [
    { key: 'plan', ix: 'calendar', label: 'Plan' },
    { key: 'inputs', ix: 'sliders', label: 'Inputs' },
    { key: 'daily', ix: 'book', label: 'Journal' },
    { key: 'configure', ix: 'refresh', label: 'Reconfigure' },
  ]},
]

// Mobile bottom tab bar — Today first; the FAB is food logging,
// the single most frequent daily action.
const TABS = [
  { key: 'today', label: 'Today', icon: 'home' },
  { key: 'gym', label: 'Train', icon: 'dumbbell' },
  { key: 'food', label: 'Log', icon: 'plus', emphasis: true },
  { key: 'data', label: 'Progress', icon: 'trend' },
  { key: 'more', label: 'More', icon: 'more' },
]
const MORE = [
  { key: 'coach', label: 'AI Coach', icon: 'chat', sub: 'Your live coach reads every number' },
  { key: 'plan', label: 'Plan', icon: 'calendar', sub: 'Your split, exercises & strength targets' },
  { key: 'daily', label: 'Journal', icon: 'book', sub: 'The full day-by-day record' },
  { key: 'inputs', label: 'Inputs', icon: 'sliders', sub: 'Who you are & what you’re chasing' },
  { key: 'configure', label: 'Reconfigure', icon: 'refresh', sub: 'Rebuild your setup from scratch' },
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
  const v = view === 'dashboard' ? 'today' : view
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
                  <span className="ix"><Icon name={it.ix} /></span>{it.label}
                </button>
              ))}
            </div>
          ))}
          <div className="nav-group-label">System</div>
          <button className={`nav-item ${v === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
            <span className="ix"><Icon name="settings" /></span>Settings
          </button>
        </aside>
        <main className="main">
          {/* keyed wrapper re-triggers the ease-in on every view change */}
          <div className="view" key={v}>
            {v === 'today' && <Today />}
            {v === 'inputs' && <Inputs />}
            {v === 'plan' && <GymPlan />}
            {v === 'daily' && <DailyLog />}
            {v === 'food' && <FoodLog />}
            {v === 'data' && <DataDash />}
            {v === 'gym' && <Workout />}
            {v === 'coach' && <AICoach />}
            {v === 'settings' && <Settings />}
            {v === 'more' && <MoreMenu setView={setView} />}
          </div>
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
