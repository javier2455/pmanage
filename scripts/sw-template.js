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

/**
 * Peticiones simultáneas durante el precacheado.
 *
 * Lanzar las ~780 de golpe satura al servidor —un cPanel compartido corta o
 * encola— y muchas fallan, dejando la caché incompleta EN SILENCIO: la app
 * parece protegida y al navegar sin red no encuentra nada. De seis en seis
 * tarda algo más, pero termina.
 */
const PRECACHE_CONCURRENCY = 6;

async function precacheAll(cache) {
  const queue = [...PRECACHE];
  let failed = 0;

  const worker = async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      try {
        // `reload` evita que la caché HTTP del navegador sirva una versión
        // anterior del archivo al precachear una build nueva.
        await cache.add(new Request(url, { cache: "reload" }));
      } catch {
        failed++;
      }
    }
  };

  await Promise.all(
    Array.from({ length: PRECACHE_CONCURRENCY }, () => worker()),
  );
  return failed;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const failed = await precacheAll(cache);
      if (failed > 0) {
        console.warn(
          `[sw] ${failed}/${PRECACHE.length} recursos no se cachearon`,
        );
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

    // Una NAVEGACIÓN nunca debe acabar en `Response.error()`: el navegador
    // pinta entonces su propia pantalla de error ("No se puede acceder a este
    // sitio", ERR_FAILED), desde la que el usuario no puede volver a la
    // aplicación. Se prueban varios respaldos y, si ninguno está en caché
    // —precacheado incompleto—, se devuelve una página propia.
    if (request.mode === "navigate") {
      for (const candidate of [OFFLINE_FALLBACK, BASE_ROOT]) {
        const fallback = await caches.match(candidate);
        if (fallback) return fallback;
      }
      return offlinePage();
    }
    return Response.error();
  }
}

/** Raíz de la aplicación; último respaldo cacheado antes de la página propia. */
const BASE_ROOT = "__BASE_PATH__/";

/**
 * Página de cortesía, incrustada en el propio service worker para no depender
 * de ningún archivo: es el caso en el que justamente no hay nada en caché.
 */
function offlinePage() {
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sin conexión · Negora</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         font-family: system-ui, sans-serif; background:#0b0f19; color:#e5e7eb; padding:24px; }
  main { max-width:22rem; text-align:center; }
  h1 { font-size:1.125rem; margin:0 0 .5rem; }
  p { margin:0 0 1.25rem; color:#9ca3af; font-size:.9rem; line-height:1.5; }
  button { font:inherit; padding:.6rem 1.1rem; border-radius:.5rem; border:0;
           background:#10b77f; color:#04150f; font-weight:600; cursor:pointer; }
</style>
</head>
<body>
  <main>
    <h1>Sin conexión</h1>
    <p>Esta pantalla aún no está guardada en el dispositivo. Vuelve a
       intentarlo cuando tengas señal.</p>
    <button onclick="location.reload()">Reintentar</button>
  </main>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
