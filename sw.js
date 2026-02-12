const CACHE_NAME = 'nuudesk-v1.7-offline';
const ASSETS_TO_CACHE = [
    './index.html',
    './manifest.json',
    './icon.png',
    './badge.png',
    // External Libraries
    'https://cdn.jsdelivr.net/npm/uuid@8.3.2/dist/umd/uuidv4.min.js',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/element-plus/dist/index.css',
    'https://cdn.jsdelivr.net/npm/element-plus/theme-chalk/dark/css-vars.css',
    'https://unpkg.com/vue@3/dist/vue.global.js',
    'https://cdn.jsdelivr.net/npm/element-plus',
    'https://unpkg.com/@element-plus/icons-vue',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap'
];

// Install Event: Cache critical assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching shell assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event: Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cachedResponse = await cache.match(event.request);
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse.ok) {
                    cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
            }).catch(() => {
                // Network failed
            });
            return cachedResponse || fetchPromise;
        })
    );
});

// Notification Handling
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, icon } = event.data.payload;
        self.registration.showNotification(title, {
            body: body,
            icon: icon,
            badge: './badge.png',
            vibrate: [200, 100, 200],
            tag: 'nuudesk-alert-' + Date.now(), // Unique tag to ensure distinct notifications
            renotify: true,
            data: { dateOfArrival: Date.now() }
        });
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./index.html');
            }
        })
    );
});