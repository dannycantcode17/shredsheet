// PWA glue: service-worker registration + install-prompt plumbing.
let deferredPrompt = null
const listeners = new Set()
const notify = () => listeners.forEach(l => l(!!deferredPrompt))

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()        // stash it so we can trigger install from our own UI
    deferredPrompt = e
    notify()
  })
  window.addEventListener('appinstalled', () => { deferredPrompt = null; notify() })
}

// Subscribe to install availability. Fires immediately with current state.
export function onInstallAvailable(cb) {
  listeners.add(cb)
  cb(!!deferredPrompt)
  return () => listeners.delete(cb)
}

export async function promptInstall() {
  if (!deferredPrompt) return false
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  notify()
  return outcome === 'accepted'
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* offline support unavailable */ })
  })
}
