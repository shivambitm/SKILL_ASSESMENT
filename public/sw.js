console.log('🔧 [ServiceWorker] Initializing enhanced service worker...');

const CACHE_NAME = 'skill-assessment-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';
const API_CACHE = 'api-v2';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

const CACHE_STRATEGIES = {
  '/api/': 'networkFirst',
  '/join/': 'networkFirst',
  '/admin/': 'networkFirst',
  '/static/': 'cacheFirst',
  '/recording/': 'networkFirst',
  '/transcription/': 'networkFirst',
  '/summary/': 'networkFirst',
  '/whiteboard/': 'networkFirst'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 [ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ [ServiceWorker] Static assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 [ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
              console.log('🗑️ [ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ [ServiceWorker] Activated and old caches cleaned');
        return self.clients.claim();
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip WebSocket and WebRTC requests
  if (url.protocol === 'ws:' || url.protocol === 'wss:' || 
      request.url.includes('socket.io') || 
      request.url.includes('webrtc')) {
    return;
  }

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Determine cache strategy
    let strategy = 'networkFirst'; // default
    
    for (const [pattern, strategyName] of Object.entries(CACHE_STRATEGIES)) {
      if (pathname.startsWith(pattern)) {
        strategy = strategyName;
        break;
      }
    }
    
    switch (strategy) {
      case 'cacheFirst':
        return await cacheFirst(request);
      case 'networkFirst':
        return await networkFirst(request);
      default:
        return await networkFirst(request);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return await handleOffline(request);
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    updateCache(request);
    return cachedResponse;
  }
  
  return await fetchAndCache(request);
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await updateCache(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

async function fetchAndCache(request) {
  const response = await fetch(request);
  
  if (response.ok) {
    await updateCache(request, response.clone());
  }
  
  return response;
}

async function updateCache(request, response = null) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  if (response) {
    await cache.put(request, response);
  } else {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse);
      }
    } catch (error) {
      console.warn('Background cache update failed:', error);
    }
  }
}

async function handleOffline(request) {
  const url = new URL(request.url);
  
  // Try to serve from cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // For HTML pages, serve offline page
  if (request.headers.get('accept')?.includes('text/html')) {
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // For API requests, return offline response
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'You are offline. Please check your internet connection.',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Default offline response
  return new Response('You are offline', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Background sync for meeting data
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'meeting-data-sync') {
    event.waitUntil(syncMeetingData());
  }
});

async function syncMeetingData() {
  try {
    // Get pending meeting data from IndexedDB
    const pendingData = await getPendingMeetingData();
    
    for (const data of pendingData) {
      try {
        await fetch('/api/meeting/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        // Remove from pending after successful sync
        await removePendingMeetingData(data.id);
      } catch (error) {
        console.error('Failed to sync meeting data:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications for meeting reminders
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  const options = {
    body: 'Your meeting is starting soon',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/join'
    },
    actions: [
      {
        action: 'join',
        title: 'Join Now',
        icon: '/icons/join-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  if (event.data) {
    const payload = event.data.json();
    options.body = payload.body || options.body;
    options.data.url = payload.url || options.data.url;
  }
  
  event.waitUntil(
    self.registration.showNotification('Skill Assessment Portal', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'join') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Helper functions for IndexedDB operations
async function getPendingMeetingData() {
  // Implementation would use IndexedDB to store/retrieve pending data
  return [];
}

async function removePendingMeetingData(id) {
  // Implementation would remove data from IndexedDB
  console.log('Removed pending data:', id);
}