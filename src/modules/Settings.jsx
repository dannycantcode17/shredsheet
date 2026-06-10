import React, { useRef, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Field, Pill } from '../components/ui.jsx'
import { exportState, importState } from '../lib/storage.js'

export default function Settings() {
  const { state, setApiKey, replaceState, reset } = useStore()
  const fileRef = useRef()
  const [confirmReset, setConfirmReset] = useState(false)
  const [status, setStatus] = useState(null) // { tone: 'good' | 'bad', msg }

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
