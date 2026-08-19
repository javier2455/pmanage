import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";

/**
 * Pruebas del service worker cargando la PLANTILLA REAL.
 *
 * Copiar aquí su lógica no probaría nada: el archivo que se despliega seguiría
 * pudiendo cambiar por su cuenta. Se sustituyen los marcadores igual que hace
 * `scripts/generate-sw.mjs` y se ejecuta el resultado con una caché y una red
 * de mentira.
 *
 * Se prueba solo la vía de respuesta —qué se sirve y qué se guarda—, que es
 * donde han estado todos los fallos: sin conexión no hay forma de mirar qué
 * pasó, y un respaldo equivocado no da error, da la pantalla que no era.
 */

const templatePath = fileURLToPath(
  new URL("../../scripts/sw-template.js", import.meta.url),
);

const BASE = "/manager";
const ORIGIN = "https://negora.test";

interface FakeRequest {
  url: string;
  mode?: string;
  method?: string;
}

/** Caché mínima con la semántica que usa el service worker. */
function makeCaches() {
  const stores = new Map<string, Map<string, Response>>();

  const strip = (url: string) => {
    const target = new URL(url);
    target.search = "";
    return target.toString();
  };

  const find = (
    store: Map<string, Response>,
    key: string | FakeRequest,
    options?: { ignoreSearch?: boolean },
  ) => {
    const url = typeof key === "string" ? new URL(key, ORIGIN).toString() : key.url;
    if (!options?.ignoreSearch) return store.get(url);
    for (const [stored, response] of store) {
      if (strip(stored) === strip(url)) return response;
    }
    return undefined;
  };

  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      match: async (key: string | FakeRequest, options?: { ignoreSearch?: boolean }) =>
        find(store, key, options),
      put: async (key: string | FakeRequest, response: Response) => {
        const url = typeof key === "string" ? new URL(key, ORIGIN).toString() : key.url;
        store.set(url, response);
      },
    };
  };

  return {
    api: {
      open,
      match: async (key: string | FakeRequest, options?: { ignoreSearch?: boolean }) => {
        for (const store of stores.values()) {
          const hit = find(store, key, options);
          if (hit) return hit;
        }
        return undefined;
      },
      keys: async () => [...stores.keys()],
      delete: async (name: string) => stores.delete(name),
    },
    seed(cacheName: string, url: string, body: string, contentType = "text/html") {
      const store = stores.get(cacheName) ?? new Map();
      stores.set(cacheName, store);
      store.set(
        new URL(url, ORIGIN).toString(),
        new Response(body, { headers: { "Content-Type": contentType } }),
      );
    },
    stored: (cacheName: string) => [...(stores.get(cacheName)?.keys() ?? [])],
  };
}

function loadServiceWorker(fetchImpl: (request: FakeRequest) => Promise<Response>) {
  const source = readFileSync(templatePath, "utf8")
    .replaceAll("__VERSION__", "test")
    .replaceAll("__PRECACHE__", "[]")
    .replaceAll("__API_PREFIX__", "/api/v2")
    .replaceAll("__STATIC_PREFIX__", `${BASE}/_next/static`)
    .replaceAll("__BASE_PATH__", BASE);

  const caches = makeCaches();
  const self = {
    location: { origin: ORIGIN },
    addEventListener: () => {},
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
  };

  const factory = new Function(
    "self",
    "caches",
    "fetch",
    `${source}\nreturn { networkFirst, cacheFirst, CACHE_NAME };`,
  );
  const sw = factory(self, caches.api, fetchImpl) as {
    networkFirst: (request: FakeRequest) => Promise<Response>;
    cacheFirst: (request: FakeRequest) => Promise<Response>;
    CACHE_NAME: string;
  };

  return { sw, caches };
}

const navigation = (path: string): FakeRequest => ({
  url: `${ORIGIN}${path}`,
  mode: "navigate",
  method: "GET",
});

const asset = (path: string): FakeRequest => ({
  url: `${ORIGIN}${path}`,
  mode: "cors",
  method: "GET",
});

const offline = () => Promise.reject(new TypeError("Failed to fetch"));

describe("service worker: qué se sirve sin conexión", () => {
  let sw: ReturnType<typeof loadServiceWorker>["sw"];
  let caches: ReturnType<typeof loadServiceWorker>["caches"];

  beforeEach(() => {
    ({ sw, caches } = loadServiceWorker(offline));
    caches.seed(sw.CACHE_NAME, `${BASE}/dashboard/`, "PANEL");
    caches.seed(sw.CACHE_NAME, `${BASE}/dashboard/business/sales/create/`, "CREAR VENTA");
  });

  /**
   * El fallo reportado. Los enlaces del código —y las direcciones del menú,
   * que vienen de la base de datos— se escriben sin barra final; con
   * `trailingSlash: true` el sitio exportado solo tiene la forma CON barra. En
   * línea el servidor redirige y nadie se entera; sin conexión no hay quien
   * redirija.
   */
  it("encuentra la pantalla aunque la URL venga sin barra final", async () => {
    const response = await sw.networkFirst(
      navigation(`${BASE}/dashboard/business/sales/create`),
    );

    expect(await response.text()).toBe("CREAR VENTA");
  });

  /**
   * Servir OTRA pantalla es peor que no servir ninguna: la barra de direcciones
   * decía `…/sales/create/` y aparecía el panel, sin nada que explicara la
   * contradicción.
   */
  it("una pantalla que no está guardada no se sustituye por el panel", async () => {
    const response = await sw.networkFirst(
      navigation(`${BASE}/dashboard/business/providers/`),
    );
    const html = await response.text();

    expect(html).not.toContain("PANEL");
    expect(html).toContain("no está guardada");
    expect(html).toContain(`${BASE}/dashboard/`); // ofrece la vuelta al panel
  });

  it("sigue encontrando las cargas de navegación con `?_rsc=`", async () => {
    const response = await sw.networkFirst(
      asset(`${BASE}/dashboard/business/sales/create/?_rsc=abc123`),
    );

    expect(await response.text()).toBe("CREAR VENTA");
  });
});

describe("service worker: qué se guarda estando en línea", () => {
  /**
   * El servidor responde `index.html` con un 200 —no un 404— a cualquier ruta
   * que no exista. Guardar eso bajo el nombre de un archivo de datos o de un
   * trozo de código envenena la caché: sin conexión se sirve con toda
   * confianza y el síntoma aparece lejos de donde se produjo.
   */
  it("no guarda la página de la aplicación bajo el nombre de un archivo de datos", async () => {
    const appShell = () =>
      Promise.resolve(
        new Response("<!doctype html><html>…</html>", {
          headers: { "Content-Type": "text/html" },
        }),
      );
    const { sw, caches } = loadServiceWorker(appShell);

    await sw.networkFirst(asset(`${BASE}/dashboard/business/sales/create.txt`));

    expect(caches.stored(sw.CACHE_NAME)).toEqual([]);
  });

  it("un trozo de código sustituido por HTML tampoco se guarda", async () => {
    const appShell = () =>
      Promise.resolve(
        new Response("<!doctype html><html>…</html>", {
          headers: { "Content-Type": "text/html" },
        }),
      );
    const { sw, caches } = loadServiceWorker(appShell);

    await sw.cacheFirst(asset(`${BASE}/_next/static/chunks/no-existe.js`));

    expect(caches.stored(sw.CACHE_NAME)).toEqual([]);
  });

  it("una respuesta legítima sí se guarda", async () => {
    const ok = () =>
      Promise.resolve(
        new Response("console.log(1)", {
          headers: { "Content-Type": "application/javascript" },
        }),
      );
    const { sw, caches } = loadServiceWorker(ok);

    await sw.cacheFirst(asset(`${BASE}/_next/static/chunks/real.js`));

    expect(caches.stored(sw.CACHE_NAME)).toHaveLength(1);
  });
});
