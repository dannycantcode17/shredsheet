// Cloudflare Pages Function — /api/steps
// Apple Health steps bridge. An Apple Shortcut POSTs today's step count with the
// user's sync token; the app GETs them and merges into the daily log.
//
// Requires a KV namespace bound as STEPS_KV:
//   Pages project → Settings → Functions → KV namespace bindings (Production AND Preview).
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
const keyFor = (token) => `steps/${token}`
const MAX_DAYS = 90
const todayISO = () => new Date().toISOString().slice(0, 10)
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)

async function read(env, token) {
  try { return JSON.parse(await env.STEPS_KV.get(keyFor(token))) || {} } catch { return {} }
}

// POST { token, steps, date? } — from the Shortcut
export async function onRequestPost(context) {
  const { request, env } = context
  if (!env.STEPS_KV) return json({ error: 'STEPS_KV not bound on the server.' }, 500)
  let body
  try { body = await request.json() } catch { return json({ error: 'Bad JSON' }, 400) }
  const token = String(body.token || '').trim()
  const steps = Math.round(Number(body.steps))
  const date = isDate(body.date) ? body.date : todayISO()
  if (!token) return json({ error: 'Missing token' }, 400)
  if (!Number.isFinite(steps) || steps < 0) return json({ error: 'Missing or invalid steps' }, 400)

  const obj = await read(env, token)
  obj[date] = steps
  // keep only the most recent MAX_DAYS dates
  const dates = Object.keys(obj).sort()
  for (const d of dates.slice(0, Math.max(0, dates.length - MAX_DAYS))) delete obj[d]
  await env.STEPS_KV.put(keyFor(token), JSON.stringify(obj))
  return json({ ok: true, date, steps })
}

// GET ?token=... — read by the app
export async function onRequestGet(context) {
  const { request, env } = context
  if (!env.STEPS_KV) return json({ error: 'STEPS_KV not bound on the server.' }, 500)
  const token = String(new URL(request.url).searchParams.get('token') || '').trim()
  if (!token) return json({ error: 'Missing token' }, 400)
  return json({ steps: await read(env, token) })
}
