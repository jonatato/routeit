// Service Worker for push notifications and offline caching
const CACHE_NAME = 'routeit-v2';
const urlsToCache = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigation = request.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  if (isSameOrigin) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request)),
    );
  }
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'RouteIt';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: '/panda-logo.svg',
    badge: '/panda-logo.svg',
    tag: data.tag || 'default',
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/app'),
  );
});
