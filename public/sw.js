// 기본 PWA 설치 요건을 충족하기 위한 아주 단순한 Service Worker
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // 네트워크 우선 (기본 동작 유지, PWA 설치 가능 요건 충족용 fetch 핸들러)
});
