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
/** A dónde se vuelve desde la página de cortesía: el panel siempre está en caché. */
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

async function precacheRound(cache, urls) {
  const queue = [...urls];
  const failed = [];

  const worker = async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      try {
        // `reload` evita que la caché HTTP del navegador sirva una versión
        // anterior del archivo al precachear una build nueva.
        await cache.add(new Request(url, { cache: "reload" }));
      } catch {
        failed.push(url);
      }
    }
  };

  await Promise.all(
    Array.from({ length: PRECACHE_CONCURRENCY }, () => worker()),
  );
  return failed;
}

/**
 * Descarga todo el build, con una segunda pasada para los que fallaron.
 *
 * El reintento importa: en una conexión inestable —o contra un alojamiento
 * compartido que corta cuando le llegan muchas peticiones seguidas— unos pocos
 * archivos fallan por azar, y basta con que falte uno para que una pantalla
 * quede inservible sin conexión.
 */
async function precacheAll(cache) {
  const failed = await precacheRound(cache, PRECACHE);
  if (failed.length === 0) return [];
  return precacheRound(cache, failed);
}

/**
 * Generaciones de caché que se conservan.
 *
 * DOS, no una. Los nombres de los archivos de Next llevan un hash del
 * contenido, así que cada despliegue estrena nombres: una página que ya está
 * abierta con la versión anterior sigue pidiendo LOS SUYOS. Si al activarse la
 * versión nueva se borrara la caché vieja, esa pestaña se quedaría sin sus
 * propios archivos y al navegar —o al recargar— acabaría en pantalla en blanco
 * con un `ERR_FAILED` por cada trozo de código que le falta.
 *
 * Con dos generaciones vivas y una búsqueda que mira en todas las cachés, cada
 * página encuentra los archivos de SU build y la transición deja de doler.
 */
const CACHE_GENERATIONS = 2;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const failed = await precacheAll(cache);

      if (failed.length > 0) {
        // Todo o nada. Media aplicación en caché es PEOR que la anterior
        // entera, porque el fallo no aparece ahora sino al navegar sin red,
        // cuando ya no hay vuelta atrás: pantalla en blanco y un `ERR_FAILED`
        // por cada trozo de código que falta.
        //
        // Al lanzar aquí, la instalación fracasa, la versión anterior sigue al
        // mando intacta y el navegador vuelve a intentarlo en la próxima
        // visita. Con una conexión intermitente, tarde y bien es mejor que
        // pronto y roto.
        await caches.delete(CACHE_NAME);
        throw new Error(
          `[sw] Precache incompleto: faltaron ${failed.length} de ` +
            `${PRECACHE.length} recursos (p. ej. ${failed[0]}). ` +
            "Se mantiene la versión anterior.",
        );
      }

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // `caches.keys()` devuelve los nombres en orden de creación: las últimas
      // generaciones son las del final.
      const keys = (await caches.keys()).filter((key) =>
        key.startsWith(CACHE_PREFIX),
      );
      const keep = new Set([...keys.slice(-CACHE_GENERATIONS), CACHE_NAME]);
      await Promise.all(
        keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    void self.skipWaiting();
    return;
  }
  // Permite preguntar desde la aplicación qué versión está sirviendo. Sin esto
  // no hay forma de saber si un problema en producción viene del código nuevo
  // o de una caché vieja que sigue al mando.
  if (event.data === "VERSION" && event.ports?.[0]) {
    event.ports[0].postMessage(VERSION);
    return;
  }

  // Estado del precacheado, para poder ENSEÑARLO dentro de la aplicación.
  //
  // Hasta ahora era invisible: el aviso de "datos guardados" habla solo de los
  // datos, así que alguien podía leer que estaba todo listo cuando la
  // aplicación misma no estaba guardada y no habría llegado ni a abrir sin
  // conexión. Cuando eso falla —y falla en silencio, porque el precacheado es
  // todo o nada— no queda ni un rastro que mirar.
  if (event.data === "STATUS" && event.ports?.[0]) {
    event.waitUntil(
      (async () => {
        let precached = 0;
        try {
          const cache = await caches.open(CACHE_NAME);
          precached = (await cache.keys()).length;
        } catch (error) {
          // Sin acceso a la caché se informa de cero, que es la verdad útil.
        }
        event.ports[0].postMessage({
          version: VERSION,
          precached,
          total: PRECACHE.length,
        });
      })(),
    );
  }
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

/**
 * Busca en la caché de ESTA versión y, solo si no está, en las anteriores.
 *
 * El orden importa mucho más de lo que parece. `caches.match` global recorre
 * las cachés en orden de creación y devuelve la primera coincidencia, es decir,
 * **la más antigua**: sin conexión, una página que existe en las dos
 * generaciones se serviría desde la vieja, y con ella el código viejo. El
 * síntoma es desconcertante —la versión nueva instalada y anunciada, pero la
 * aplicación comportándose como la anterior— y solo aparece sin red, que es
 * cuando menos se puede investigar.
 *
 * El respaldo en generaciones anteriores sigue existiendo por el motivo por el
 * que se conservan: una pestaña abierta con la versión anterior pide archivos
 * con los nombres de SU build, que la caché nueva no tiene.
 */
async function matchInCaches(request, options) {
  const cache = await caches.open(CACHE_NAME);
  const current = await cache.match(request, options);
  if (current) return current;
  return caches.match(request, options);
}

/**
 * ¿El servidor devolvió la página de la aplicación en lugar del archivo?
 *
 * El alojamiento tiene una regla de último recurso que responde `index.html`
 * —con un 200, no con un 404— a cualquier ruta que no exista. Para una
 * navegación es lo correcto; para un trozo de código o un archivo de datos es
 * veneno: se guardaría HTML bajo el nombre de un `.js` o de un `.txt` y sin
 * conexión se serviría con toda confianza, con el síntoma apareciendo muy
 * lejos de donde se produjo —una pantalla que no es la que pide la URL—.
 *
 * La regla del servidor ya está arreglada, pero esto se queda: el service
 * worker no puede fiarse de una configuración que vive en otro repositorio y
 * que un despliegue puede revertir sin que nadie se entere.
 */
function isAppShellInsteadOfAsset(request, response) {
  if (request.mode === "navigate") return false;
  return (response.headers.get("Content-Type") || "").includes("text/html");
}

/**
 * La misma URL en su forma canónica, con barra final.
 *
 * Con `trailingSlash: true` el sitio exportado SOLO tiene `/x/`. Un enlace
 * escrito como `/x` funciona en línea porque el servidor redirige, así que la
 * diferencia es invisible durante meses; sin conexión no hay quien redirija y
 * la petición no encuentra nada. Como las direcciones del menú vienen de la
 * base de datos, no basta con revisar los enlaces del código: se normaliza
 * aquí, que es por donde pasan todas.
 */
function withTrailingSlash(url) {
  const target = new URL(url);
  const last = target.pathname.split("/").pop();
  if (target.pathname.endsWith("/") || last.includes(".")) return null;
  target.pathname += "/";
  return target.toString();
}

/** Todas las formas en que la respuesta puede estar guardada. */
async function findInCaches(request) {
  const candidates = [request, withTrailingSlash(request.url)].filter(Boolean);
  // Sin la cadena de consulta al final: el router de Next pide sus cargas de
  // navegación con un `?_rsc=…` que cambia en cada build, y la URL cacheada y
  // la pedida solo se diferencian en eso.
  for (const options of [undefined, { ignoreSearch: true }]) {
    for (const candidate of candidates) {
      const hit = await matchInCaches(candidate, options);
      if (hit) return hit;
    }
  }
  return undefined;
}

async function cacheFirst(request) {
  const cached = await findInCaches(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok && !isAppShellInsteadOfAsset(request, response)) {
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
    if (response.ok && !isAppShellInsteadOfAsset(request, response)) {
      const cache = await caches.open(CACHE_NAME);
      void cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await findInCaches(request);
    if (cached) return cached;

    // Una NAVEGACIÓN nunca debe acabar en `Response.error()`: el navegador
    // pinta entonces su propia pantalla de error ("No se puede acceder a este
    // sitio", ERR_FAILED), desde la que no se puede volver a la aplicación.
    //
    // Pero tampoco puede servir OTRA página. Antes se devolvía el panel para
    // cualquier navegación no encontrada, y el resultado era peor que un
    // error: la barra de direcciones decía `…/sales/create/` y la pantalla
    // enseñaba el panel, sin nada que explicara la contradicción. Un respaldo
    // que aparenta funcionar convierte un fallo localizable en un misterio.
    if (request.mode === "navigate") return offlinePage();
    return Response.error();
  }
}

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
  .acciones { display:flex; gap:.5rem; justify-content:center; flex-wrap:wrap; }
  button, a { font:inherit; padding:.6rem 1.1rem; border-radius:.5rem; border:0;
              font-weight:600; cursor:pointer; text-decoration:none; }
  button { background:#10b77f; color:#04150f; }
  a { background:#1f2937; color:#e5e7eb; }
</style>
</head>
<body>
  <main>
    <h1>Esta pantalla no está guardada</h1>
    <p>No se descargó al dispositivo mientras había señal, así que sin conexión
       no hay nada que mostrar. Lo que sí está guardado sigue funcionando.</p>
    <div class="acciones">
      <button onclick="location.reload()">Reintentar</button>
      <a href="${OFFLINE_FALLBACK}">Volver al panel</a>
    </div>
  </main>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
