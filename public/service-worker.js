/* eslint-disable no-undef */
// IMPORTANT: Bump CACHE_VERSION when deploying breaking routing/auth fixes.
// This prevents stale cached index.html/JS bundles from shipping outdated routes (e.g. /auth/signup).
const CACHE_VERSION = 'v4-2025-12-20';
const CACHE_NAME = `dreamcatcher-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `dreamcatcher-runtime-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  OFFLINE_PAGE
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('dreamcatcher-') && name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - apply cache-first for app shell, network-first for APIs, and cache-first+revalidate for images
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const APP_SHELL_REGEX = /\.(?:js|css|woff2)$/i;
  const IMAGE_REGEX = /\.(?:png|jpg|jpeg|svg|gif|webp)$/i;
  const STUBBED_API_PATHS = new Set([
    '/api/auth/session',
    '/api/community/showcase',
    '/api/user/profile',
    '/api/project/publish-domain',
  ]);

  if (url.origin === self.location.origin && STUBBED_API_PATHS.has(url.pathname)) {
    event.respondWith(
      (async () => {
        if (request.method === 'OPTIONS') {
          return new Response(null, {
            status: 204,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            },
          });
        }

        return new Response(JSON.stringify({ ok: true, stub: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        });
      })()
    );
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (url.origin !== self.location.origin && !url.hostname.includes('blink.new')) {
    return;
  }

  if (url.pathname.startsWith('/api') || url.hostname.includes('blink.new')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  if (url.origin === self.location.origin && APP_SHELL_REGEX.test(url.pathname)) {
    event.respondWith(handleAppShellRequest(request, request));
    return;
  }

  if (IMAGE_REGEX.test(url.pathname)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  event.respondWith(handleStaleWhileRevalidate(request));
});

const IMAGE_CACHE = `dreamcatcher-images-${CACHE_VERSION}`;

async function handleAppShellRequest(cacheKey, fetchRequest, { fallbackToOffline = false } = {}) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(cacheKey);

  try {
    const response = await fetch(fetchRequest);
    if (response && response.ok) {
      await cache.put(cacheKey, response.clone());
    }
    return cached || response;
  } catch (error) {
    if (cached) {
      return cached;
    }

    if (fallbackToOffline) {
      const offlineResponse = await cache.match(OFFLINE_PAGE);
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    return new Response('Offline - Please check your connection', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline - Please check your connection', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function handleStaleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function handleNavigationRequest(request) {
  return handleAppShellRequest(
    '/index.html',
    new Request('/index.html', { cache: 'no-store', credentials: 'same-origin' }),
    { fallbackToOffline: true }
  );
}

// Handle background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-dreams') {
    event.waitUntil(syncDreams());
  }
});

// Sync queued dreams when online
async function syncDreams() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/dreams')) {
        try {
          await fetch(request);
          await cache.delete(request);
        } catch (error) {
          console.error('[Service Worker] Sync failed:', error);
        }
      }
    }
  } catch (error) {
    console.error('[Service Worker] Background sync error:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New dream interpretation ready!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification('Dreamcatcher AI', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting message received');
    self.skipWaiting();
  }
});
