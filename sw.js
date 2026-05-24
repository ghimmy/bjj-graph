// v4 — cache bust, forces fresh load on all clients
const CACHE = 'bjj-graph-v4';
const ASSETS = [
  '/bjj-graph/',
  '/bjj-graph/index.html',
  '/bjj-graph/manifest.json',
  '/bjj-graph/icon-192.png',
  '/bjj-graph/icon-512.png',
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c) { return c.addAll(ASSETS); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        return caches.delete(k); // delete every old cache version
      }));
    }).then(function() {
      return self.clients.claim(); // take control immediately
    })
  );
});

self.addEventListener('fetch', function(e) {
  const url = new URL(e.request.url);

  // Always fetch HTML fresh — never serve cached index
  if (url.pathname === '/bjj-graph/' || url.pathname === '/bjj-graph/index.html') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then(function(res) {
          if (res && res.status === 200) {
            var clone = res.clone();
            caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
          }
          return res;
        })
        .catch(function() {
          return caches.match('/bjj-graph/index.html');
        })
    );
    return;
  }

  // Cache first for icons, manifest etc
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(res) {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        var clone = res.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return res;
      });
    })
  );
});
