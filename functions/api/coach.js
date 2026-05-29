// Cloudflare Pages Function — POST /api/coach
// Holds the Anthropic key server-side (set ANTHROPIC_API_KEY in the Pages
// dashboard -> Settings -> Environment variables). The browser never sees it.
export async function onRequestPost(context) {
  const { request, env } = context
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'No ANTHROPIC_API_KEY configured on the server.' }, 500)
  }
  let body
  try { body = await request.json() } catch { return json({ error: 'Bad JSON' }, 400) }
  const { messages = [], context: sys = '', model = 'claude-3-5-sonnet-20241022' } = body

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 1024, system: sys, messages: messages.map(m => ({ role: m.role, content: m.content })) }),
  })
  if (!res.ok) return json({ error: `Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}` }, 502)
  const data = await res.json()
  return json({ text: data.content?.map(c => c.text).join('') || '' })
}
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
