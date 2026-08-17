/* eslint-disable */
/**
 * Service worker de Negora (plan offline, B1).
 *
 * NO se edita el archivo generado: esta es la plantilla. `scripts/generate-sw.mjs`
 * la copia a `out/sw.js` sustituyendo los marcadores con doble guión bajo que
 * aparecen más abajo (lista de precache, versión, prefijos de API y de assets,
 * y base path).
 *
 * Los nombres de esos marcadores NO se escriben en este comentario a propósito:
 * la sustitución es textual y acabarían reemplazados aquí en vez de —o además
 * de— en el código.
 *
 * Por qué escrito a mano y no con un plugin de bundler: un plugin existe para
 * responder "¿qué archivos emitió el build?", y con `output: "export"` esa
 * pregunta ya está respondida —es todo lo que hay en `out/`—, así que el
 * manifiesto se genera recorriendo la carpeta. A cambio, el service worker no
 * toca el bundler y le da igual que Next use Turbopack o webpack.
 */

const VERSION = "__VERSION__";
const CACHE_NAME = `negora-shell-${VERSION}`;
const CACHE_PREFIX = "negora-shell-";

/** Rutas de la API. El service worker NO debe tocarlas (ver más abajo). */
const API_PREFIX = "__API_PREFIX__";
/** Assets de build con hash en el nombre: inmutables. */
const STATIC_PREFIX = "__STATIC_PREFIX__";
/** Página que se sirve si se navega a algo que no está en caché. */
const OFFLINE_FALLBACK = "__BASE_PATH__/dashboard/";

const PRECACHE = __PRECACHE__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Se añaden de una en una en vez de con `addAll`: este falla entero si
      // una sola petición falla, y perder toda la caché por un archivo suelto
      // dejaría la app sin modo offline sin avisar.
      const results = await Promise.allSettled(
        PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" }))),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        console.warn(`[sw] ${failed}/${PRECACHE.length} recursos no se cachearon`);
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Borra las cachés de versiones anteriores. Sin esto, cada despliegue
      // dejaría otros 13 MB en el dispositivo.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") void self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // La API queda FUERA del service worker, a propósito. Cachear respuestas de
  // negocio daría datos viejos sin que nadie lo sepa, y una venta servida
  // desde caché sería indistinguible de una real. Trabajar sin conexión con
  // datos y operaciones es trabajo de la cola local (B4/B6), no de esta capa,
  // que solo se ocupa de que la aplicación ABRA y se pueda navegar.
  if (API_PREFIX && url.pathname.startsWith(API_PREFIX)) return;

  // Assets con hash en el nombre: si el nombre coincide, el contenido es el
  // mismo. Se sirven de caché sin preguntar a la red.
  if (url.pathname.startsWith(STATIC_PREFIX)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      void cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return Response.error();
  }
}

/**
 * Red primero y caché como respaldo.
 *
 * Al revés que en los assets: aquí interesa la versión fresca cuando hay red,
 * y que la app siga abriendo cuando no la hay. Es lo que evita la pantalla de
 * error del navegador al navegar sin conexión.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      void cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Navegación a una ruta que nunca se visitó y que el precache no cubre:
    // se devuelve el panel para no dejar al usuario en la pantalla de error
    // del navegador, desde donde no puede volver a la app.
    if (request.mode === "navigate") {
      const fallback = await caches.match(OFFLINE_FALLBACK);
      if (fallback) return fallback;
    }
    return Response.error();
  }
}
