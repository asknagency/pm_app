const CACHE_NAME = 'nuudesk-v1.6-offline';
const ASSETS_TO_CACHE = [
    './index.html',
    './manifest.json',
    './icon.png',
    './badge.png',
    // External Libraries (Must correspond exactly to HTML imports)
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

// Activate Event: cleanup old caches
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
        }).then(() => clients.claim())
    );
});

// Fetch Event: Stale-While-Revalidate Strategy
self.addEventListener('fetch', (event) => {
    // Ignore GitHub API calls for caching (handled by app logic)
    if (event.request.url.includes('api.github.com')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Update cache if network is successful
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Network failed, nothing to do here as we handle cachedResponse below
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
            tag: 'nuudesk-alert',
            renotify: true,
            data: { dateOfArrival: Date.now() }
        });
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing window
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Or open new
            if (clients.openWindow) {
                return clients.openWindow('./index.html');
            }
        })
    );
});