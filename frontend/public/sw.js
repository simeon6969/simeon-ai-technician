const CACHE = 'simeon-offline-v1'
const OFFLINE = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('simeon-offline-') && key !== CACHE).map((key) => caches.delete(key)),
  )))
})

// Never cache API responses, account data, photos or submitted forms.
// Always fetch current app code; only show a static fallback if navigation fails.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' ||
      url.origin !== self.location.origin || !['/', '/index.html'].includes(url.pathname)) return
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)))
})
