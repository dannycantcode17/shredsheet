import React, { useRef, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Field, Pill } from '../components/ui.jsx'
import { exportState, importState } from '../lib/storage.js'
import { newStepsToken } from '../lib/health.js'

export default function Settings() {
  const { state, setApiKey, replaceState, reset, setStepsToken, syncSteps } = useStore()
  const fileRef = useRef()
  const [confirmReset, setConfirmReset] = useState(false)
  const [status, setStatus] = useState(null) // { tone: 'good' | 'bad', msg }
  const [showHelp, setShowHelp] = useState(false)
  const postUrl = `${typeof location !== 'undefined' ? location.origin : ''}/api/steps`
  const copy = (text) => { navigator.clipboard?.writeText(text); setStatus({ tone: 'good', msg: 'Copied.' }) }
  const doSync = async () => {
    const n = await syncSteps(state.stepsToken)
    setStatus({ tone: n ? 'good' : 'bad', msg: n ? `Synced ${n} day${n > 1 ? 's' : ''} of steps.` : 'No steps found for this token yet.' })
  }

  const doImport = async (file) => {
    try {
      const next = await importState(file)
      const looksValid = next && typeof next === 'object' && !Array.isArray(next) &&
        ['inputs', 'plan', 'dailyLog', 'workoutLog'].some(k => k in next)
      if (!looksValid) { setStatus({ tone: 'bad', msg: 'That doesn’t look like a Shredsheet backup.' }); return }
      replaceState(next)
      setStatus({ tone: 'good', msg: 'Backup imported.' })
    } catch {
      setStatus({ tone: 'bad', msg: 'Could not read that file.' })
    }
  }

  return (
    <>
      <PageHead eyebrow="System" title="Settings" sub="Your data lives in this browser. Back it up with export; move devices with import." />
      <h2 className="section">AI coach connection</h2>
      <Card>
        <Field label="Anthropic API key (optional)" hint="Only needed for the live preview before you deploy. Once deployed to Cloudflare Pages with a server-side key, you can leave this blank. Stored locally in this browser only.">
          <input type="password" placeholder="sk-ant-..." value={state.apiKey} onChange={e => setApiKey(e.target.value)} />
        </Field>
        {state.apiKey ? <Pill tone="good">Key set — coach will work in this browser</Pill> : <Pill tone="muted">No key — coach uses the deployed server proxy</Pill>}
      </Card>

      <h2 className="section">Apple Health — steps</h2>
      <Card>
        <p className="muted" style={{ marginTop: 0 }}>Auto-fill your daily steps from Apple Health with a Shortcut — generate a token, paste it into the Shortcut, and steps sync in.</p>
        {state.stepsToken ? (
          <>
            <Field label="Your sync token" hint="Paste this into the Shortcut. Anyone with it can read/write your step numbers, so keep it private.">
              <input readOnly value={state.stepsToken} onFocus={e => e.target.select()} />
            </Field>
            <div className="btn-row">
              <button className="btn" onClick={() => copy(state.stepsToken)}>Copy token</button>
              <button className="btn primary" onClick={doSync}>Sync now</button>
              <button className="btn ghost" onClick={() => setShowHelp(v => !v)}>{showHelp ? 'Hide setup' : 'How to set up'}</button>
            </div>
          </>
        ) : (
          <div className="btn-row"><button className="btn primary" onClick={() => setStepsToken(newStepsToken())}>Generate sync token</button></div>
        )}
        {showHelp && (
          <div style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.6 }}>
            <div className="divider" />
            <b>Build the Shortcut (iPhone → Shortcuts app)</b>
            <ol style={{ paddingLeft: 18, margin: '8px 0' }}>
              <li><b>Find Health Samples</b> → type <b>Steps</b>, period <b>Today</b>, Statistic <b>Sum</b>.</li>
              <li><b>Text</b> action containing exactly:<br /><code style={{ wordBreak: 'break-all' }}>{`{"token":"${state.stepsToken}","steps":[Steps]}`}</code><br />(swap <code>[Steps]</code> for the variable from step 1.)</li>
              <li><b>Get Contents of URL</b> → <code style={{ wordBreak: 'break-all' }}>{postUrl}</code>, Method <b>POST</b>, Header <code>Content-Type: application/json</code>, Request Body = the Text.</li>
              <li>Run it (or add a daily Automation), then tap <b>Sync now</b> here.</li>
            </ol>
            <Pill tone="muted">Needs the server's KV configured — if Sync finds nothing, the backend may not be set up yet.</Pill>
          </div>
        )}
      </Card>

      <h2 className="section">Your data</h2>
      <Card>
        <div className="btn-row">
          <button className="btn" onClick={() => exportState(state)}>⬇ Export backup (JSON)</button>
          <button className="btn" onClick={() => fileRef.current.click()}>⬆ Import backup</button>
          {confirmReset ? (
            <>
              <button className="btn" style={{ borderColor: 'var(--bad)', color: 'var(--bad)' }}
                onClick={() => { reset(); setConfirmReset(false); setStatus({ tone: 'good', msg: 'Reset to defaults.' }) }}>Tap again to confirm</button>
              <button className="btn ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn ghost" onClick={() => { setConfirmReset(true); setStatus(null) }}>Reset to defaults</button>
          )}
          <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }}
            onChange={async e => { const f = e.target.files[0]; if (f) await doImport(f); e.target.value = '' }} />
        </div>
        {confirmReset && <div className="hint" style={{ marginTop: 10 }}>This wipes your inputs, plan and logs. Export a backup first if unsure.</div>}
        {status && <div style={{ marginTop: 12 }}><Pill tone={status.tone === 'good' ? 'good' : 'bad'}>{status.msg}</Pill></div>}
      </Card>
    </>
  )
}
