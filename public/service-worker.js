/**
 * Service Worker for Packet Module PWA
 * Strategy: Smart caching
 * - HTML documents: Always fetch fresh (offline fallback only)
 * - API calls: Always fetch fresh (never cache)
 * - Static assets: Network-first with cache fallback
 */

const CACHE_NAME = 'packet-module-v119';
const urlsToCache = [
  '/PACKET_MODULE/',
  '/PACKET_MODULE/public/login.html',
  '/PACKET_MODULE/public/module_progress.html'
];

// Install event - cache initial resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
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

// Fetch event - Smart caching strategy
self.addEventListener('fetch', (event) => {
  const requestURL = new URL(event.request.url);
  
  // NEVER cache HTML documents - always fetch fresh
  const isHTMLDocument = event.request.destination === 'document' || 
                        event.request.headers.get('accept')?.includes('text/html');
  
  // NEVER cache API calls - always fetch fresh
  const isAPICall = requestURL.hostname.includes('script.google.com') ||
                   requestURL.hostname.includes('googleapis.com');
  
  if (isHTMLDocument || isAPICall) {
    // Always fetch fresh, no caching
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Only for HTML, serve cached version as fallback
          if (isHTMLDocument) {
            return caches.match('/PACKET_MODULE/index.html')
              .then((response) => {
                return response || new Response('Offline - content not available', {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: new Headers({'Content-Type': 'text/html'})
                });
              });
          }
          // API calls fail gracefully without cache
          return new Response('Network error', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        })
    );
  } else {
    // For other assets (CSS, JS, images): Network-first with cache fallback
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then((response) => {
              if (response) {
                console.log('[SW] Serving from cache:', event.request.url);
                return response;
              }
              return new Response('Offline - content not available', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({'Content-Type': 'text/plain'})
              });
            });
        })
    );
  }
});
