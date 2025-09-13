const CACHE_NAME = 'daily-reminder-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/dashboard.html',
  '/about.html',
  '/contact.html',
  '/css/index.css',
  '/css/auth.css',
  '/css/dashboard.css',
  '/css/about.css',
  '/css/contact.css',
  '/js/auth.js',
  '/js/reminders.js',
  '/js/notifications.js',
  '/js/theme.js',
  '/js/dashboard.js',
  '/js/calendar.js',
  '/js/notification-popup.js',
  '/js/dragdrop.js',
  '/js/bulk-operations.js',
  '/js/contact.js',
  '/js/mobile-fixes.js',
  '/manifest.json',
  '/assets/default.mp3'
];

// Install - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch(() => {
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Background notification scheduling
let scheduledNotifications = new Map();

// Periodic Background Sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'daily-reminder-sync') {
    event.waitUntil(doPeriodicSync());
  }
});

// Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doPeriodicSync() {
  return checkDueReminders()
    .then(() => {
      console.log('Periodic sync completed');
    })
    .catch(() => {
      console.log('Periodic sync failed');
    });
}

function doBackgroundSync() {
  return fetch('/api/sync')
    .then(response => response.json())
    .then(data => {
      console.log('Background sync completed');
    })
    .catch(() => {
      console.log('Background sync failed');
    });
}

function checkDueReminders() {
  return new Promise((resolve) => {
    const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    const now = Date.now();
    const dueReminders = reminders.filter(r => 
      new Date(r.datetime).getTime() <= now && r.isActive && !r.completed
    );
    
    dueReminders.forEach(reminder => {
      self.registration.showNotification(reminder.title, {
        body: reminder.description || 'Reminder time!',
        icon: '/icon-192.png',
        badge: '/icon-96.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        tag: 'reminder-' + reminder.id
      });
    });
    
    resolve();
  });
}

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" fill="%236366f1" rx="42"/%3E%3Ctext x="96" y="125" font-size="120" text-anchor="middle" fill="white"%3E🔔%3C/text%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" fill="%236366f1" rx="20"/%3E%3Ctext x="48" y="65" font-size="42" text-anchor="middle" fill="white"%3E🔔%3C/text%3E%3C/svg%3E',
    vibrate: [200, 100, 200],
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification('Daily Reminder', options)
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { reminder, triggerTime } = event.data;
    const delay = triggerTime - Date.now();
    
    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        self.registration.showNotification(reminder.title, {
          body: reminder.description || 'Reminder time!',
          icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" fill="%236366f1" rx="42"/%3E%3Ctext x="96" y="125" font-size="120" text-anchor="middle" fill="white"%3E🔔%3C/text%3E%3C/svg%3E',
          badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" fill="%236366f1" rx="20"/%3E%3Ctext x="48" y="65" font-size="42" text-anchor="middle" fill="white"%3E🔔%3C/text%3E%3C/svg%3E',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          tag: 'reminder-' + reminder.id,
          data: { reminderId: reminder.id }
        });
        scheduledNotifications.delete(reminder.id);
      }, delay);
      
      scheduledNotifications.set(reminder.id, timeoutId);
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/dashboard.html')
  );
});