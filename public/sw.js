// FocusPulse Service Worker for Habit Reminders, Aggressive Push & Offline Capabilities
const CACHE_NAME = 'focuspulse-cache-v2';
const OFFLINE_URLS = ['/', '/icon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Handle incoming background push notifications
self.addEventListener('push', (event) => {
  let data = {
    title: 'FocusPulse Habit Alert',
    body: 'Time to check in on your daily habit and keep your streak alive!',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'focuspulse-urgent-alert',
    data: { url: '/' },
    requireInteraction: true,
  };

  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    vibrate: [250, 100, 250, 100, 400],
    data: data.data || { url: '/' },
    tag: data.tag || 'focuspulse-urgent-alert',
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open FocusPulse' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle clicking on notification or actions
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
