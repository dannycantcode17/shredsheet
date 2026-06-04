import React, { useRef, useState, useEffect } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Field, Pill } from '../components/ui.jsx'
import { exportState, importState } from '../lib/storage.js'
import { getSystem, TRACK_LABELS } from '../lib/systems.js'
import { ALL_TRACKING } from '../lib/configurator.js'
import { onInstallAvailable, promptInstall } from '../lib/pwa.js'

export default function Settings() {
  const { state, setApiKey, replaceState, reset, reconfigure, setTracking } = useStore()
  const fileRef = useRef()
  const system = getSystem(state.system)
  const tracking = state.tracking || ALL_TRACKING
  const tracked = Object.keys(TRACK_LABELS).filter(k => tracking[k])
  const [canInstall, setCanInstall] = useState(false)
  useEffect(() => onInstallAvailable(setCanInstall), [])

  // Toggle a metric; muscle estimation is derived (needs the system to estimate
  // muscle at all, plus calorie + bodyweight logging), so recompute it here.
  const toggle = (key) => {
    const next = { ...tracking, [key]: !tracking[key] }
    const muscleEstimation = (system ? system.estimatesMuscle : true) && !!next.calories && !!next.weight
    setTracking({ [key]: next[key], muscleEstimation })
  }
  return (
    <>
      <PageHead eyebrow="System" title="Settings" sub="Your data lives in this browser. Back it up with export; move devices with import." />
      <h2 className="section">Your system</h2>
      <Card>
        {system ? (
          <>
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="stat-value accent" style={{ fontSize: 24 }}>{system.label}</div>
                <div className="muted" style={{ marginTop: 4 }}>{system.tagline}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                  {tracked.map(k => <Pill key={k} tone="good">{TRACK_LABELS[k]}</Pill>)}
                </div>
              </div>
              <button className="btn" onClick={() => { if (confirm('Re-run the configurator? Your logged data is kept — only your system and targets are reset.')) reconfigure() }}>↺ Reconfigure</button>
            </div>
          </>
        ) : (
          <div className="row-between">
            <span className="muted">No system assigned yet.</span>
            <button className="btn" onClick={reconfigure}>Run the configurator</button>
          </div>
        )}
      </Card>
      <h2 className="section">What you track</h2>
      <Card>
        <div className="muted" style={{ marginBottom: 12, fontSize: 14 }}>Switch metrics on or off. Muscle &amp; fat estimation needs both calories and bodyweight{system && !system.estimatesMuscle ? ', and is unavailable on the Foundation system' : ''}.</div>
        <div className="track-toggles">
          {Object.keys(TRACK_LABELS).map(k => (
            <label key={k} className={`track-toggle ${tracking[k] ? 'on' : ''} ${k === 'workouts' ? 'locked' : ''}`}>
              <input type="checkbox" checked={!!tracking[k]} disabled={k === 'workouts'} onChange={() => toggle(k)} />
              <span>{TRACK_LABELS[k]}</span>
            </label>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          {tracking.muscleEstimation
            ? <Pill tone="good">Muscle &amp; fat estimation on</Pill>
            : <Pill tone="muted">Muscle &amp; fat estimation off</Pill>}
        </div>
      </Card>
      {canInstall && (
        <>
          <h2 className="section">Install</h2>
          <Card>
            <div className="row-between">
              <span className="muted">Add The Shredsheet to your home screen for an app-like, offline-capable experience.</span>
              <button className="btn primary" onClick={promptInstall}>⬇ Install app</button>
            </div>
          </Card>
        </>
      )}
      <h2 className="section">AI coach connection</h2>
      <Card>
        <Field label="Anthropic API key (optional)" hint="Only needed for the live preview before you deploy. Once deployed to Cloudflare Pages with a server-side key, you can leave this blank. Stored locally in this browser only.">
          <input type="password" placeholder="sk-ant-..." value={state.apiKey} onChange={e => setApiKey(e.target.value)} />
        </Field>
        {state.apiKey ? <Pill tone="good">Key set — coach will work in this browser</Pill> : <Pill tone="muted">No key — coach uses the deployed server proxy</Pill>}
      </Card>
      <h2 className="section">Your data</h2>
      <Card>
        <div className="btn-row">
          <button className="btn" onClick={() => exportState(state)}>⬇ Export backup (JSON)</button>
          <button className="btn" onClick={() => fileRef.current.click()}>⬆ Import backup</button>
          <button className="btn ghost" onClick={() => { if (confirm('Reset everything to defaults? Export first if unsure.')) reset() }}>Reset to defaults</button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }}
            onChange={async e => {
              const f = e.target.files[0]
              if (f) {
                try { alert(replaceState(await importState(f)) ? 'Imported.' : 'That file isn’t a Shredsheet backup — nothing was changed.') }
                catch { alert('Could not read that file.') }
              }
              e.target.value = '' // allow re-importing the same file
            }} />
        </div>
      </Card>
    </>
  )
}
