// localStorage persistence + JSON export/import.
// CHANGE: structured behind a tiny API so a real DB (Supabase) can replace it later.
const KEY = 'shredsheet.v1'

export function loadState() {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null } catch { return null }
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
