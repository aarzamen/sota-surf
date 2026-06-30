const CACHE_NAME = 'sota-surf-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use cache.addAll with caution - if any asset fails, the whole precache fails.
      // We wrap it to ensure the service worker still installs.
      return Promise.allSettled(
        PRECACHE_ASSETS.map(asset => {
          return cache.add(asset).catch(err => {
            console.warn(`[SW] Failed to precache asset: ${asset}`, err);
          });
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip non-http/https requests (like chrome-extension or dev server websocket)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If the response is valid, clone it and save it to our cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch((err) => {
        // Network request failed. Attempt to serve from Cache Storage.
        console.log(`[SW] Network failed for ${event.request.url}. Serving from cache...`);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Fallback to index.html for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }

          // Standard fallback response
          return new Response(JSON.stringify({
            error: "Offline",
            message: "Tactical data link is down and no cached data is available for this command."
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
  );
});
