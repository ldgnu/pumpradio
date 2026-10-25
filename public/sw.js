/**
 * PumpRadio — Service Worker
 * Cache-first for assets, network-first for streams
 */
const CACHE_NAME = 'pumpradio-shell-v2'

// Rutas relativas al scope del SW: en GitHub Pages el sitio vive en /pumpradio/,
// con '/' los addAll fallaban (404) y el SW no se instalaba.
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json'
]

// Precached URLs injected by workbox
self.__WB_MANIFEST

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Stream URLs — never cache, always network
  if (url.hostname.includes('zeno.fm')) {
    return
  }

  // API calls — network first, fallback to cache
  if (url.hostname.includes('api.')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Navegaciones y assets sin hash — network-first (evita servir el sitio viejo).
  // Bundles con content-hash de Vite (index-AbC12345.js) son inmutables → cache-first.
  const isHashedAsset = /-[A-Za-z0-9_]{8,}\.(js|css|woff2?)$/i.test(url.pathname)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request).then(c => c || caches.match('/index.html')))
    )
    return
  }

  if (!isHashedAsset) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Static assets inmutables — cache first.
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        }).catch(() => cached)

        return cached || fetchPromise
      })
  )
})
