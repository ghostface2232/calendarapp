/* DayRail PoC Service Worker */
const CACHE = "dayrail-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sw.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if(req.method !== "GET") return;

  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if(cached) return cached;

    try{
      const fresh = await fetch(req);
      const url = new URL(req.url);
      if(url.origin === location.origin){
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    }catch(e){
      // offline fallback
      const fallback = await caches.match("./index.html");
      return fallback || new Response("offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" }});
    }
  })());
});
