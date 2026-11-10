const CACHE = "little-ear-v3";
const OFFLINE_CACHE = "little-ear-offline";
const APP_SHELL = ["./", "./index.html", "./style.css", "./main.js", "./manifest.webmanifest", "./resources/offline-assets.js"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE && key !== OFFLINE_CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (event.request.cache === "reload") {
    event.respondWith(fetch(event.request).then((response) => response.ok ? response : caches.match(event.request)).catch(() => caches.match(event.request).then((cached) => cached || Response.error())));
    return;
  }
  // Always prefer fresh application code so installed clients receive lesson
  // and speech fixes immediately; use the cache only if they are offline.
  if (event.request.mode === "navigate" || /\/(?:main\.js|style\.css|index\.html)$/.test(url.pathname)) {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); }
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || Response.error())));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) {
      const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  })));
});
