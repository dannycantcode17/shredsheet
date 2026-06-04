// The Shredsheet service worker.
// Build asset filenames are content-hashed, so we cache at runtime rather
// than precaching a fixed manifest:
//  - navigations: network-first, fall back to the cached app shell (offline)
//  - static assets: stale-while-revalidate
//  - /api/* (AI coach): always network, never cached
// The athlete's data lives in localStorage, so the app is fully usable offline.
const CACHE = 'shredsheet-v1'
const SHELL = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    await Promise.allSettled(SHELL.map(u => cache.add(u)))
    self.skipWaiting()
  })())
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return       // let cross-origin (fonts, AI) pass through
  if (url.pathname.startsWith('/api/')) return            // never cache coach calls

  if (request.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(request)
        // Only cache a genuine, successful shell — never a 404/5xx/redirect,
        // which would otherwise poison the offline fallback under key '/'.
        if (fresh && fresh.ok && fresh.type === 'basic') {
          const cache = await caches.open(CACHE)
          cache.put('/', fresh.clone())
        }
        return fresh
      } catch {
        return (await caches.match('/')) || (await caches.match('/index.html')) || Response.error()
      }
    })())
    return
  }

  e.respondWith((async () => {
    const cached = await caches.match(request)
    const network = fetch(request).then(res => {
      if (res && res.status === 200) caches.open(CACHE).then(c => c.put(request, res.clone()))
      return res
    }).catch(() => null)
    return cached || (await network) || Response.error()
  })())
})
