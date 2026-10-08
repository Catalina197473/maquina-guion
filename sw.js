/* Máquina de Guion · service worker
   Guarda la app en el ordenador para que funcione sin internet.
   VERSION la pone construir_pwa.py a partir del contenido: si la app cambia, cambia la versión,
   el navegador instala esta copia nueva en segundo plano y la app avisa («Hay una versión nueva»).
   La nueva solo entra cuando el usuario pulsa Actualizar (mensaje «activar»). */
const VERSION = "0a1f23a1a10b";
const CACHE = "mg-app-" + VERSION;
const FUENTES = "mg-fuentes"; // tipografías de Google, para que se vean igual sin conexión
const APP = ["./", "index.html", "manifest.webmanifest", "icono-192.png", "icono-512.png", "icono-maskable-512.png", "apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP.map((u) => new Request(u, { cache: "reload" })))));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("mg-app-") && k !== CACHE).map((k) => caches.delete(k)))),
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "activar") self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin === self.location.origin) {
    e.respondWith(
      (async () => {
        const c = await caches.open(CACHE);
        const m = (await c.match(r, { ignoreSearch: true })) || (r.mode === "navigate" ? await c.match("./") : null);
        return m || fetch(r);
      })(),
    );
    return;
  }
  if (u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") {
    e.respondWith(
      (async () => {
        const c = await caches.open(FUENTES);
        const m = await c.match(r);
        if (m) return m;
        try {
          const resp = await fetch(r);
          if (resp.ok || resp.type === "opaque") c.put(r, resp.clone());
          return resp;
        } catch (err) {
          return Response.error();
        }
      })(),
    );
  }
});
