const CACHE = "urbanflow-v4";
const APP_SHELL = [
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL))
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
  const { request } = event;
  const url = new URL(request.url);

  // Cross-origin (Render API, OSM tiles, Nominatim, OSRM…) → network only
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ detail: "Hors ligne" }), {
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Same-origin API routes → network only
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ detail: "Hors ligne" }), {
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // HTML navigation → network first pour toujours récupérer le bon index.html
  // (évite de servir un index.html périmé pointant vers de vieux hashes d'assets)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match("/index.html").then((r) => r ?? Response.error()))
    );
    return;
  }

  // Assets statiques (JS/CSS avec hash Vite, icons…) → cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
