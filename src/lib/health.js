// Apple Health steps bridge (client side).
// HealthKit can't be read from the web, so steps arrive via an Apple Shortcut
// that POSTs to /api/steps (see functions/api/steps.js + Settings → Apple Health).

// A capability token that links the phone's Shortcut to this browser.
export function newStepsToken() {
  try { return crypto.randomUUID().replace(/-/g, '') }
  catch { return (Math.random().toString(36) + Math.random().toString(36)).replace(/[^a-z0-9]/g, '').slice(0, 24) }
}

// Fetch the { 'YYYY-MM-DD': steps } map for a token. Never throws into render.
export async function fetchSteps(token) {
  if (!token) return {}
  try {
    const res = await fetch(`/api/steps?token=${encodeURIComponent(token)}`)
    if (!res.ok) return {}
    const d = await res.json()
    return d && d.steps && typeof d.steps === 'object' ? d.steps : {}
  } catch { return {} }
}
