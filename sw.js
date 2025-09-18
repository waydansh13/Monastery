/**
 * Monastery360 Service Worker
 * Handles caching and offline functionality for the PWA
 */

const CACHE_NAME = 'monastery360-v1.0.0';
const STATIC_CACHE = 'monastery360-static-v1.0.0';
const DYNAMIC_CACHE = 'monastery360-dynamic-v1.0.0';

// Core app files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/data/monasteries.json',
  '/data/events.json'
];

// External resources to cache
const EXTERNAL_ASSETS = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first for static assets
  CACHE_FIRST: 'cache-first',
  // Network first for dynamic content
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate for external resources
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache external assets
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('[SW] Caching external assets...');
        return cache.addAll(EXTERNAL_ASSETS);
      })
    ]).then(() => {
      console.log('[SW] Static assets cached successfully');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Failed to cache static assets:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle different caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Determine caching strategy based on request type
    if (isStaticAsset(request)) {
      return await cacheFirst(request, STATIC_CACHE);
    } else if (isExternalAsset(request)) {
      return await staleWhileRevalidate(request, DYNAMIC_CACHE);
    } else if (isDataRequest(request)) {
      return await networkFirst(request, DYNAMIC_CACHE);
    } else {
      return await networkFirst(request, DYNAMIC_CACHE);
    }
  } catch (error) {
    console.error('[SW] Error handling request:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return await getOfflinePage();
    }
    
    // Return cached version if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a generic error response
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Cache first strategy - for static assets
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Network request failed:', error);
    throw error;
  }
}

// Network first strategy - for dynamic content
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache...');
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale while revalidate strategy - for external resources
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName);
      cache.then((c) => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, return cached version if available
    return cachedResponse;
  });
  
  return cachedResponse || await fetchPromise;
}

// Helper functions to determine request types
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.origin === location.origin && 
         (url.pathname.endsWith('.html') || 
          url.pathname.endsWith('.css') || 
          url.pathname.endsWith('.js') ||
          url.pathname.endsWith('.json') ||
          url.pathname === '/');
}

function isExternalAsset(request) {
  const url = new URL(request.url);
  return url.hostname === 'unpkg.com' || 
         url.hostname === 'cdnjs.cloudflare.com' ||
         url.hostname === 'fonts.googleapis.com';
}

function isDataRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/data/') || 
         url.pathname.startsWith('/api/');
}

// Get offline page
async function getOfflinePage() {
  const cache = await caches.open(STATIC_CACHE);
  const offlinePage = await cache.match('/index.html');
  
  if (offlinePage) {
    return offlinePage;
  }
  
  // Return a basic offline page if index.html is not cached
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Monastery360 - Offline</title>
      <style>
        body {
          font-family: system-ui, sans-serif;
          background: #0a0f0c;
          color: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          text-align: center;
        }
        .offline-container {
          max-width: 400px;
          padding: 2rem;
        }
        h1 { color: #d4af37; margin-bottom: 1rem; }
        p { margin-bottom: 1rem; opacity: 0.8; }
        .retry-btn {
          background: #1a4d3a;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1rem;
        }
        .retry-btn:hover {
          background: #2d6b4f;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <h1>🏛️ Monastery360</h1>
        <p>You're currently offline. Some features may not be available.</p>
        <p>Please check your internet connection and try again.</p>
        <button class="retry-btn" onclick="window.location.reload()">
          Try Again
        </button>
      </div>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html'
    }
  });
}

// Handle background sync (if supported)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'monastery-data-sync') {
    event.waitUntil(syncMonasteryData());
  }
});

async function syncMonasteryData() {
  try {
    // Sync monastery data when back online
    const response = await fetch('/data/monasteries.json');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put('/data/monasteries.json', response);
      console.log('[SW] Monastery data synced');
    }
  } catch (error) {
    console.error('[SW] Failed to sync monastery data:', error);
  }
}

// Handle push notifications (if needed in future)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available for Monastery360',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore Monasteries',
        icon: '/assets/icons/icon-72.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/icons/icon-72.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Monastery360', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/?view=monasteries')
    );
  }
});

// Handle message from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'monastery-data-update') {
    event.waitUntil(updateMonasteryData());
  }
});

async function updateMonasteryData() {
  try {
    // Update monastery data periodically
    const [monasteriesResponse, eventsResponse] = await Promise.all([
      fetch('/data/monasteries.json'),
      fetch('/data/events.json')
    ]);
    
    if (monasteriesResponse.ok && eventsResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await Promise.all([
        cache.put('/data/monasteries.json', monasteriesResponse),
        cache.put('/data/events.json', eventsResponse)
      ]);
      console.log('[SW] Monastery data updated via periodic sync');
    }
  } catch (error) {
    console.error('[SW] Failed to update monastery data:', error);
  }
}

console.log('[SW] Service worker script loaded');