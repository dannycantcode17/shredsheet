// localStorage persistence + JSON export/import.
// CHANGE: structured behind a tiny API so a real DB (Supabase) can replace it later.
const KEY = 'shredsheet.v1'

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v)

// Defensively normalise a loaded/imported blob so a wrong-shaped file can never
// crash the engine or quietly wipe good data (data dignity). Malformed sub-fields
// are dropped, so the store falls back to its seed defaults for them. Returns
// null if the blob isn't a usable state object at all (caller should refuse it).
export function normalizeState(raw) {
  if (!isPlainObject(raw)) return null
  const out = { ...raw }
  const dropIf = (key, ok) => { if (key in out && !ok(out[key])) delete out[key] }
  dropIf('inputs', isPlainObject)
  dropIf('plan', Array.isArray)
  dropIf('dailyLog', isPlainObject)
  dropIf('workoutLog', Array.isArray)
  dropIf('coachLog', Array.isArray)
  dropIf('tracking', (v) => v === null || isPlainObject(v))
  dropIf('apiKey', (v) => typeof v === 'string')
  return out
}

export function loadState() {
  try { const raw = localStorage.getItem(KEY); return raw ? normalizeState(JSON.parse(raw)) : null } catch { return null }
}
export function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) { console.warn('save failed', e) }
}
export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `shredsheet-${new Date().toISOString().slice(0, 10)}.json`
  a.click(); URL.revokeObjectURL(url)
}
export function importState(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => { try { resolve(JSON.parse(r.result)) } catch (e) { reject(e) } }
    r.onerror = reject; r.readAsText(file)
  })
}
