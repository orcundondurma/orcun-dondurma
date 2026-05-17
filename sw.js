// Orçun Dondurma — Service Worker v0.5.1
const VERSION = "v0.5.1";
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
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Firebase ve Google Fonts'u her zaman ağdan al
  const url = req.url;
  if (
    url.includes("firestore.googleapis.com") ||
    url.includes("googleapis.com/identitytoolkit") ||
    url.includes("firebaseapp.com") ||
    url.includes("gstatic.com/firebasejs")
  ) {
    return;
  }

  // Diğerleri için: önce cache, sonra network
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
});
