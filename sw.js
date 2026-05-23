// v2 — force clears any previously cached broken version
const CACHE = 'bjj-mindmap-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// INSTALL — cache fresh assets, skip waiting immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting()) // activate immediately, don't wait
  );
});

// ACTIVATE — delete ALL old caches including broken ones, claim all clients
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k); // delete everything, including broken v1
        })
      ))
      .then(() => self.clients.claim()) // take control of all open tabs/windows immediately
  );
});

// FETCH — network first for HTML, cache first for assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always fetch index.html fresh from network — never serve cached 404
  if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Everything else — cache first, network fallback
  e.respondWith(
    caches.match(e.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (!res || res.status !== 200 || res.type === 'opaque') return res;
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        });
      })
  );
});
