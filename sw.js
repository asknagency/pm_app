const CACHE_NAME = 'nuudesk-v1.5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/uuid@8.3.2/dist/umd/uuidv4.min.js',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/element-plus/dist/index.css',
  'https://cdn.jsdelivr.net/npm/element-plus/theme-chalk/dark/css-vars.css',
  'https://unpkg.com/vue@3/dist/vue.global.js',
  'https://cdn.jsdelivr.net/npm/element-plus',
  'https://unpkg.com/@element-plus/icons-vue',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap'
];

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch Event: Network first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Ignore GitHub API calls for caching (we want fresh data)
  if (event.request.url.includes('api.github.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Notification Click Event (Restoring your original feature)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./index.html');
    })
  );
});
