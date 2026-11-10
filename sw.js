const CACHE = "little-ear-v5";
const OFFLINE_CACHE = "little-ear-offline";
const APP_SHELL = ["./", "./index.html", "./style.css", "./main.js", "./manifest.webmanifest", "./resources/curricula/shenzhen-hj-2025-grade-2-semester-1/offline-assets.js"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE && key !== OFFLINE_CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (event.request.cache === "reload") {
    event.respondWith(fetch(event.request).then((response) => response.ok ? response : caches.match(event.request)).catch(() => caches.match(event.request).then((cached) => cached || Response.error())));
    return;
  }
  // Always fetch app code, course data and the course's offline manifest first.
  // A changed offline-manifest version then makes the download button offer a
  // refresh; pages and audio remain cache-first until the user accepts it.
  const isFreshCode=event.request.mode === "navigate" || /\/(?:main\.js|style\.css|index\.html)$/.test(url.pathname) || /\/content\/.*\.js$/.test(url.pathname) || /\/resources\/curricula\/[^/]+\/(?:offline-assets\.js|audio\/manifest\.js)$/.test(url.pathname);
  if (isFreshCode) {
    const freshRequest=/\/offline-assets\.js$/.test(url.pathname) ? new Request(event.request,{cache:"no-store"}) : event.request;
    event.respondWith(fetch(freshRequest).then((response) => {
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
