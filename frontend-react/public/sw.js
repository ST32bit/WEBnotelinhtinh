const CACHE_NAME = 'noteapp-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg'
];

// Lắng nghe sự kiện cài đặt SW
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Lắng nghe sự kiện kích hoạt SW, dọn dẹp cache cũ
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
    })
  );
  self.clients.claim();
});

// Chặn các request (Bắt sự kiện fetch) để dùng Cache khi Offline
self.addEventListener('fetch', event => {
  // Chỉ cache GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(response => {
      // Nếu có mạng, fetch bình thường và lưu/cập nhật vào cache (Network First)
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      var responseToCache = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, responseToCache);
      });
      return response;
    }).catch(() => {
      // Nếu mất mạng, lấy từ cache (Fallback to Cache)
      return caches.match(event.request);
    })
  );
});
