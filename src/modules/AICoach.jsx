import React, { useMemo, useState, useRef, useEffect } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Pill } from '../components/ui.jsx'
import { buildCoachContext } from '../lib/engine.js'
import { askCoach } from '../lib/ai.js'
import { getSystem, TRACK_LABELS } from '../lib/systems.js'

export default function AICoach() {
  const { state, planRes, daily, strength, setCoachLog } = useStore()
  const context = useMemo(() => {
    const sys = getSystem(state.system)
    const systemForCoach = sys ? {
      coachDescriptor: sys.coachDescriptor,
      tracking: state.tracking
        ? Object.keys(TRACK_LABELS).filter(k => state.tracking[k]).map(k => TRACK_LABELS[k]).join(', ') || 'minimal'
        : 'all',
      muscleEstimation: state.tracking ? state.tracking.muscleEstimation : true,
    } : null
    return buildCoachContext(state.inputs, state.plan, planRes, daily, strength, systemForCoach)
  }, [state, planRes, daily, strength])
  // The conversation lives in the store, so it survives reloads and tab switches.
  const messages = state.coachLog || []
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const logRef = useRef()
  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight) }, [messages, busy])

  const send = async (text) => {
    const q = (text ?? input).trim()
    if (!q || busy) return
    const next = [...messages, { role: 'user', content: q }]
    setCoachLog(next); setInput(''); setBusy(true)
    try {
      const reply = await askCoach({ messages: next, context, apiKey: state.apiKey })
      setCoachLog([...next, { role: 'assistant', content: reply }])
    } catch (e) {
      setCoachLog([...next, { role: 'assistant', content: '⚠️ ' + e.message }])
    } finally { setBusy(false) }
  }
  const copyPrompt = () => { navigator.clipboard?.writeText(context); }

  return (
    <>
      <PageHead eyebrow="Insights · 7" title="AI Coach" sub="Your live coach reads every number in the sheet. Ask anything, or fire off a full analysis." />
      <div className="row-between" style={{ marginBottom: 14 }}>
        <div className="btn-row">
          <button className="btn primary" onClick={() => send('Analyse my data: what is working, what is not, and the single most important change I should make this week?')} disabled={busy}>⚡ Analyse my data</button>
          <button className="btn" onClick={() => send('In two lines, am I on track for my goal? Be blunt.')} disabled={busy}>Am I on track?</button>
        </div>
        <div className="btn-row">
          {messages.length > 0 && <button className="btn ghost" onClick={() => setCoachLog([])} disabled={busy}>Clear chat</button>}
          <button className="btn ghost" onClick={copyPrompt}>Copy full prompt</button>
        </div>
      </div>
      <Card>
        <div className="chat-log" ref={logRef}>
          {!messages.length && <div className="msg sys">The coach has your full context loaded and remembers this conversation between visits. Try a question, or hit “Analyse my data”.</div>}
          {messages.map((m, i) => <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'ai'}`}>{m.content}</div>)}
          {busy && <div className="msg ai faint">Thinking…</div>}
        </div>
        <div className="divider" />
        <div style={{ display: 'flex', gap: 10 }}>
          <input placeholder="Ask your coach…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          <button className="btn primary" onClick={() => send()} disabled={busy}>Send</button>
        </div>
        {!state.apiKey && <div style={{ marginTop: 10 }}><Pill tone="muted">Tip: for the live preview, paste your Anthropic key in Settings. After deploy, the server key handles it.</Pill></div>}
      </Card>
    </>
  )
}
