// Orçun Dondurma — Service Worker v0.8.0
const VERSION = "v0.8.0";
const CACHE = "orcun-" + VERSION;

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  // skipWaiting() ÇAĞIRMIYORUZ — kullanıcı "Yenile" tıklayınca yapılacak
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Index.html'den gelen "yenile" mesajını dinle
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = req.url;

  // Firebase ve Google API'lar her zaman ağdan
  if (
    url.includes("firestore.googleapis.com") ||
    url.includes("googleapis.com/identitytoolkit") ||
    url.includes("firebaseapp.com") ||
    url.includes("gstatic.com/firebasejs")
  ) {
    return;
  }

  // index.html ve sw.js için: network-first (yeni sürümü hızlı yakala)
  // Diğer kaynaklar için: cache-first (font, ikon vs.)
  const isAppShell = url.endsWith("/index.html") || url.endsWith("/") || url.endsWith("/sw.js");

  if (isAppShell) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(req))
    );
  } else {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        }).catch(() => cached);
      })
    );
  }
});
