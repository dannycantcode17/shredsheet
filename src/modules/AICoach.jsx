import React, { useMemo, useState, useRef, useEffect } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Pill } from '../components/ui.jsx'
import { buildCoachContext } from '../lib/engine.js'
import { askCoach } from '../lib/ai.js'

export default function AICoach() {
  const { state, planRes, daily, strength } = useStore()
  const context = useMemo(() => buildCoachContext(state.inputs, state.plan, planRes, daily, strength), [state, planRes, daily, strength])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const logRef = useRef()
  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight) }, [messages, busy])

  const send = async (text) => {
    const q = (text ?? input).trim()
    if (!q || busy) return
    const next = [...messages, { role: 'user', content: q }]
    setMessages(next); setInput(''); setBusy(true)
    try {
      const reply = await askCoach({ messages: next, context, apiKey: state.apiKey })
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages([...next, { role: 'assistant', content: '⚠️ ' + e.message }])
    } finally { setBusy(false) }
  }
  const copyPrompt = () => { navigator.clipboard?.writeText(context); }

  return (
    <>
      <PageHead eyebrow="Insights" title="AI Coach" sub="Your coach has already read every number in your sheet, so you can skip the small talk. Ask anything — or unleash the full analysis." />
      <div className="row-between" style={{ marginBottom: 14 }}>
        <div className="btn-row">
          <button className="btn primary" onClick={() => send('Analyse my data: what is working, what is not, and the single most important change I should make this week?')} disabled={busy}>⚡ Analyse everything</button>
          <button className="btn" onClick={() => send('In two lines, am I on track for my goal? Be blunt.')} disabled={busy}>Give it to me straight</button>
        </div>
        <button className="btn ghost" onClick={copyPrompt}>Copy full prompt</button>
      </div>
      <Card>
        <div className="chat-log" ref={logRef}>
          {!messages.length && <div className="msg sys">Your coach already knows the numbers — every last one. Fire away, or smash “Analyse everything”.</div>}
          {messages.map((m, i) => <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'ai'}`}>{m.content}</div>)}
          {busy && <div className="msg ai faint">Crunching your numbers…</div>}
        </div>
        <div className="divider" />
        <div style={{ display: 'flex', gap: 10 }}>
          <input placeholder="Ask your coach…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          <button className="btn primary" onClick={() => send()} disabled={busy}>Send</button>
        </div>
        {!state.apiKey && <div style={{ marginTop: 10 }}><Pill tone="muted">Heads up: for the live preview, drop your Anthropic key in Settings. Once deployed, the server key does the heavy lifting.</Pill></div>}
      </Card>
    </>
  )
}
