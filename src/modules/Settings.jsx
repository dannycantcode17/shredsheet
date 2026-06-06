import React, { useRef } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Field, Pill } from '../components/ui.jsx'
import { exportState, importState } from '../lib/storage.js'

export default function Settings() {
  const { state, setApiKey, replaceState, reset } = useStore()
  const fileRef = useRef()
  return (
    <>
      <PageHead eyebrow="System" title="Settings" sub="Your data lives in this browser and nowhere else. Export to keep it safe, import to bring it with you. No cloud, no snooping." />
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
          <button className="btn ghost" onClick={() => { if (confirm('Wipe everything back to defaults? No takebacks — export first if you\'re not sure.')) reset() }}>Reset to defaults</button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }}
            onChange={async e => { const f = e.target.files[0]; if (f) { try { replaceState(await importState(f)); alert('Imported — welcome back.') } catch { alert('Hmm, couldn\'t read that file. Sure it\'s a Shredsheet backup?') } } }} />
        </div>
      </Card>
    </>
  )
}
