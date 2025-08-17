/* TaskFlow service worker: cache-first for app shell, network for everything else */
const CACHE = 'taskflow-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k!==CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // App shell: cache first
  if (APP_SHELL.some(path => request.url.endsWith(path.replace('./','')) || request.url.endsWith('/'))) {
    e.respondWith(
      caches.match(request).then(resp => resp || fetch(request))
    );
    return;
  }
  // Others: network first, fallback to cache
  e.respondWith(
    fetch(request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(request, copy));
      return resp;
    }).catch(() => caches.match(request))
  );
});
