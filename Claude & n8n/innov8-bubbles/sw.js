// ============================================================
// sw.js — Service Worker for Innov8 Bubbles PWA
// Network-first for app files, cache for offline fallback
// ============================================================

const CACHE_NAME = 'innov8-bubbles-v11';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/config.js',
  '/bubble-engine.js',
  '/data-service.js',
  '/custom-assets.js',
  '/portfolio.js',
  '/auth.js',
  '/ads.js',
  '/manifest.json',
];

// Install — cache static assets, activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — purge ALL old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — NETWORK FIRST for app files, cache as fallback for offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls — always pass through to network (never cache)
  if (url.hostname.includes('coingecko.com') ||
      url.hostname.includes('financialmodelingprep.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('gstatic.com') ||
      url.hostname.includes('stripe.com') ||
      url.hostname.includes('landregistry.data.gov.uk')) {
    return; // Let the browser handle normally
  }

  // App files — network first, cache fallback (ensures updates are always picked up)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for offline use
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline — serve from cache
        return caches.match(event.request);
      })
  );
});
