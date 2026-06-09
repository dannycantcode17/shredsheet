// AI coach transport.
// 1) Prefer the serverless proxy /api/coach (key stays server-side on Cloudflare Pages).
// 2) Fallback: user-supplied key from Settings, called direct from the browser
//    (fine for a personal single-user tool; see CHANGES_FROM_EXCEL.md / deploy notes).
export async function askCoach({ messages, context, apiKey, model = 'claude-sonnet-4-6' }) {
  // try serverless proxy first
  try {
    const res = await fetch('/api/coach', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context, model }),
    })
    if (res.ok) { const d = await res.json(); if (d.text) return d.text }
  } catch { /* proxy not deployed (e.g. local single-file preview) — fall through */ }

  if (!apiKey) {
    return '⚠️ No AI connection yet. Either deploy with a server key, or paste your own Anthropic API key in Settings to chat right now.'
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model, max_tokens: 1024, system: context,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })
  if (!res.ok) { const t = await res.text(); throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`) }
  const d = await res.json()
  return d.content?.map(c => c.text).join('') || '(no response)'
}

// Rough meal -> calories + protein estimate. No food database — this leans
// entirely on the model, so treat it as a ballpark, not a measurement.
// Returns { calories, protein } (integers, either may be null if not parsed).
export async function estimateMeal({ description, apiKey, model }) {
  const context =
    'You are a nutrition estimator inside a fitness tracker. The user describes a meal in plain text. ' +
    'Reply with ONLY two whole numbers separated by a comma and nothing else: total calories (kcal), then ' +
    'total protein (grams). Example: 640,38. No words, no units, no thousands separators. If portion sizes ' +
    'are vague, assume a typical adult portion.'
  const text = await askCoach({ messages: [{ role: 'user', content: String(description || '') }], context, apiKey, model })
  const nums = (String(text).match(/\d{1,5}/g) || []).map(n => parseInt(n, 10))
  if (!nums.length) return { calories: null, protein: null }
  return { calories: nums[0] ?? null, protein: nums[1] ?? null }
}
