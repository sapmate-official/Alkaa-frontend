const CACHE_NAME = 'alkaa-cache-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/assets/logo.svg',
  '/assets/logo_icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        
        
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(error => {
              console.warn(`Couldn't cache ${url}: ${error.message}`);
            })
          )
        );
      })
      .then(() => {
        console.log('Initial cache completed');
        return self.skipWaiting();
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        
        if (response) {
          return response;
        }

        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if(!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response because it's a one-time use stream
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              // Add new resources to cache as they're accessed
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(error => {
        console.error('Fetch failed:', error);
        // You could return a custom offline page here
      })
    );
});

// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  try {
    const data = event.data.json();
    const options = {
      body: data.content || 'New notification',
      icon: '/assets/logo_icon.svg', 
      badge: '/assets/logo.svg',
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Alkaa Notification', options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
    // Show a default notification if parsing fails
    event.waitUntil(
      self.registration.showNotification('Alkaa Notification', {
        body: 'You have a new notification',
        icon: '/assets/logo.svg',
        badge: '/assets/logo.svg'
      })
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});