import React, { useMemo, useState, useRef, useEffect } from 'react'
import { useStore } from '../state/store.jsx'
import { PageHead, Card, Pill, EmptyState } from '../components/ui.jsx'
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
      <PageHead eyebrow="Insights" title="AI Coach" sub="Your live coach reads every number in the sheet. Ask anything, or fire off a full analysis." />
      <div className="row-between" style={{ marginBottom: 14 }}>
        <div className="chips">
          <button className="chip" onClick={() => send('Analyse my data: what is working, what is not, and the single most important change I should make this week?')} disabled={busy}>⚡ Analyse my data</button>
          <button className="chip" onClick={() => send('In two lines, am I on track for my goal? Be blunt.')} disabled={busy}>Am I on track?</button>
          <button className="chip" onClick={() => send('What should I focus on in my next workout?')} disabled={busy}>Next workout?</button>
        </div>
        <button className="btn ghost" onClick={copyPrompt}>Copy full prompt</button>
      </div>
      <Card>
        <div className="chat-log" ref={logRef}>
          {!messages.length && (
            <EmptyState card={false} icon="chat" title="Your coach is ready"
              sub="It already has your full context loaded — every input, log and target. Ask anything, or tap a quick prompt above." />
          )}
          {messages.map((m, i) => <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'ai'}`}>{m.content}</div>)}
          {busy && <div className="msg ai"><span className="typing" aria-label="Coach is thinking"><span /><span /><span /></span></div>}
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
