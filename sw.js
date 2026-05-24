// v6 — iOS PWA touch event fixes
const CACHE = 'bjj-graph-v6';
const STATIC = [
  '/bjj-graph/manifest.json',
  '/bjj-graph/icon-192.png',
  '/bjj-graph/icon-512.png',
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c) { return c.addAll(STATIC); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // index.html — ALWAYS fetch from network, never serve from cache
  if (url.pathname === '/bjj-graph/' || url.pathname === '/bjj-graph/index.html') {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .catch(function() {
          // Only fall back to cache if truly offline
          return caches.match('/bjj-graph/index.html');
        })
    );
    return;
  }

  // Static assets — cache first
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
