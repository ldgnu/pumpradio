/**
 * PumpRadio — Service Worker
 * Cache-first for assets, network-first for streams
 */
const CACHE_NAME = 'pumpradio-v1'

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
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

  // Static assets — cache first
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
