// Service Worker for offline functionality
const CACHE_NAME = 'daily-reminder-v2';
const urlsToCache = [
  './',
  './index.html',
  './login.html',
  './register.html',
  './dashboard.html',
  './about.html',
  './contact.html',
  './css/index.css',
  './css/auth.css',
  './css/dashboard.css',
  './css/about.css',
  './css/contact.css',
  './js/theme.js',
  './js/auth.js',
  './js/reminders.js',
  './js/notifications.js',
  './js/notification-popup.js',
  './js/dashboard.js',
  './js/calendar.js',
  './js/dragdrop.js',
  './js/bulk-operations.js',
  './js/sw-register.js',
  './js/contact.js',
  './pwa/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache install failed:', error);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // For navigation requests, try to serve index.html if offline
        if (event.request.mode === 'navigate') {
          return fetch(event.request).catch(() => {
            return caches.match('./index.html');
          });
        }
        
        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Return index.html for failed navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle any offline actions when back online
  console.log('Background sync triggered');
  return Promise.resolve();
}

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'View Reminder'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('./dashboard.html')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    event.notification.close();
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

// Background notification scheduler
let scheduledNotifications = new Map();

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    scheduleBackgroundNotification(event.data.reminder, event.data.triggerTime);
  }
});

function scheduleBackgroundNotification(reminder, triggerTime) {
  const now = Date.now();
  const delay = triggerTime - now;
  
  if (delay > 0) {
    const timeoutId = setTimeout(() => {
      showBackgroundNotification(reminder);
      scheduledNotifications.delete(reminder.id);
    }, delay);
    
    scheduledNotifications.set(reminder.id, timeoutId);
    console.log(`Scheduled background notification for: ${reminder.title}`);
  }
}

function showBackgroundNotification(reminder) {
  const options = {
    body: reminder.description || 'Time for your reminder!',
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" fill="%236366f1"/%3E%3Ctext x="96" y="120" font-size="120" text-anchor="middle" fill="white"%3E🔔%3C/text%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" fill="%236366f1"/%3E%3Ctext x="48" y="60" font-size="60" text-anchor="middle" fill="white"%3E🔔%3C/text%3E%3C/svg%3E',
    vibrate: [500, 200, 500, 200, 500],
    requireInteraction: true,
    silent: false,
    renotify: true,
    tag: 'daily-reminder-' + reminder.id,
    timestamp: Date.now(),
    data: {
      reminderId: reminder.id,
      url: './dashboard.html',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'complete',
        title: '✓ Complete',
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%2310b981" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/%3E%3C/svg%3E'
      },
      {
        action: 'snooze',
        title: '⏰ Snooze 10min',
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23f59e0b" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/%3E%3C/svg%3E'
      }
    ]
  };
  
  self.registration.showNotification(`🔔 ${reminder.title}`, options);
  
  // Play notification sound using Audio API in service worker
  playNotificationSound();
}

function playNotificationSound() {
  // Service worker can't directly play audio, but can trigger client to play
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PLAY_NOTIFICATION_SOUND'
      });
    });
  });
}

// Check for due notifications on service worker activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      checkPendingNotifications()
    ])
  );
  self.clients.claim();
});

function checkPendingNotifications() {
  // This will be called when service worker activates
  return new Promise((resolve) => {
    // Check localStorage for pending notifications
    setTimeout(() => {
      console.log('Checking for pending notifications...');
      resolve();
    }, 1000);
  });
}