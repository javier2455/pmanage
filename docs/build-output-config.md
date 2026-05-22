# Configuración del build: por qué se genera (o no) la carpeta `out/`

Este documento explica en detalle por qué en algún momento `next build` dejó de generar la carpeta `out/` en la rama `develop`, qué significa cada modo de salida de Next.js, qué decisión se tomó y — muy importante — **qué se pierde** al elegir el modo de exportación estática. Léelo completo antes de volver a tocar la configuración de salida del build.

---

## 1. El síntoma

- En la rama `main`, al ejecutar `next build`, se generaba en la raíz del proyecto una carpeta llamada `out/` con todos los archivos HTML, CSS y JS estáticos listos para subir al hosting (cPanel).
- En la rama `develop`, al ejecutar el mismo `next build`, la carpeta `out/` **no aparecía**. En su lugar aparecía contenido dentro de `.next/standalone/`.

No era un bug del proceso de build ni un fallo de instalación: el comando estaba haciendo exactamente lo que se le pedía. La diferencia estaba en el archivo `next.config.ts`, que en cada rama pedía un **tipo de artefacto de salida distinto**.

---

## 2. La causa raíz: el campo `output` de Next.js

Next.js admite varios modos de "salida" del build, controlados por la propiedad `output` en `next.config.ts`. Cada modo produce **un artefacto diferente** y está pensado para **un tipo de despliegue diferente**.

### 2.1. `output: "export"` (modo estático) — el que usa `main`

- Activa el **Static HTML Export** de Next.js.
- Al correr `next build`, Next pre-renderiza todas las rutas a HTML plano y vuelca el resultado en la carpeta `out/`.
- El resultado son archivos puramente estáticos: HTML, CSS, JS, imágenes. **No hay servidor Node ejecutándose en producción**.
- Se sube directamente a cualquier hosting estático: cPanel, S3 + CloudFront, GitHub Pages, Netlify estático, etc.
- Es el modo que estaba configurado originalmente en este proyecto y el que el hosting actual (cPanel) espera.

### 2.2. `output: "standalone"` (modo servidor autocontenido) — el que estaba en `develop`

- Genera una carpeta `.next/standalone/` con un **servidor Node.js mínimo y autocontenido**, incluyendo solo las dependencias estrictamente necesarias para correr la app.
- El despliegue consiste en copiar esa carpeta a un servidor que ejecute `node server.js`.
- Está pensado para entornos donde **sí hay un proceso Node corriendo** en producción: contenedores Docker, VPS, plataformas tipo Railway/Render/Fly.io, etc.
- **Nunca produce la carpeta `out/`**, porque no es su objetivo. Si esperabas `out/` y configuraste `standalone`, no vas a encontrarla por mucho que repitas el build.

### 2.3. `output` ausente o `undefined` (modo por defecto)

- Build clásico de Next.js, con la carpeta `.next/` lista para que `next start` la sirva.
- Tampoco genera `out/`.

---

## 3. Qué tenía cada rama antes del cambio

### `main` (lo que funcionaba para cPanel)

```ts
const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};
```

- `output: "export"` → genera `out/`.
- `trailingSlash: true` → cada ruta queda como `/dashboard/` en vez de `/dashboard`. Esto es importante en hostings estáticos tipo cPanel/Apache, porque sirven `dashboard/index.html` de forma natural cuando la URL termina en `/`. Sin trailing slash, suele requerir reglas de rewrite que en cPanel son tediosas de mantener.
- `images: { unoptimized: true }` → desactiva el optimizador de imágenes de Next. Esto es **obligatorio** en `output: "export"`, porque el optimizador necesita un proceso de servidor que en estático no existe. Si lo dejas activado, el build falla.

### `develop` (lo que rompía la generación de `out/`)

```ts
const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  trailingSlash: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "bucket.dveloxsoft.com" },
    ],
  },
};
```

- `output: "standalone"` → no genera `out/`, sino `.next/standalone/`.
- `trailingSlash: false` → URLs sin barra final. Razonable cuando hay un servidor Node detrás, problemático en cPanel estático.
- `images.remotePatterns` → habilita el optimizador de Next para imágenes alojadas en `bucket.dveloxsoft.com`. Solo tiene sentido si hay servidor Node corriendo, porque el optimizador necesita transformar imágenes al vuelo. En modo `export` esta propiedad no aplica.

---

## 4. Decisión tomada

Se replica la configuración de `main` en `develop`. El archivo [next.config.ts](../next.config.ts) queda así:

```ts
const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};
```

Razón: el destino de despliegue sigue siendo el mismo hosting estático (cPanel), por lo que necesitamos la carpeta `out/`. Mantener `develop` y `main` con configs de salida distintas era una fuente de confusión y de builds que "no producían nada" desde el punto de vista del desplegador.

---

## 5. ⚠️ Ojo: qué se pierde al usar `output: "export"`

Esta es la sección más importante del documento. **El modo de exportación estática es estricto: no hay servidor Node en producción, así que cualquier funcionalidad de Next.js que dependa de un servidor en runtime queda desactivada.** Si en algún momento se introduce una de estas funcionalidades, el build fallará o, peor, compilará pero la funcionalidad no existirá en producción.

Lo que **no funciona** con `output: "export"`:

1. **API Routes / Route Handlers dinámicos.**
   Cualquier `app/api/.../route.ts` que dependa de ejecutar código en runtime (recibir requests, consultar bases de datos, manejar webhooks) **no se exporta**. Necesitan un proceso Node. Si la app tiene endpoints internos servidos por Next, hay que migrarlos a un backend separado (el `BASIC_ROUTE` que ya usa este proyecto, por ejemplo) o reintroducir `output: "standalone"`.

2. **Server-Side Rendering (SSR) por request.**
   No existe `getServerSideProps` ni equivalentes en App Router que rendericen por request. Todo se pre-renderiza una sola vez en build-time. Si necesitas datos frescos por usuario o por request, tiene que pasar por el cliente (fetch desde el navegador).

3. **Incremental Static Regeneration (ISR).**
   No hay `revalidate` en runtime. Lo que se exporta se queda fijo hasta el siguiente build.

4. **Middleware (`middleware.ts`).**
   El middleware se ejecuta en el edge/servidor por cada request entrante. En modo `export` no hay servidor que lo ejecute, así que **no se aplica**. Cualquier lógica de autenticación, redirecciones por cookie, A/B testing, etc., implementada en middleware **deja de existir en producción**.

5. **`next/image` con optimización.**
   El componente `<Image />` sigue funcionando, pero solo en modo "imagen no optimizada" (`images.unoptimized: true`). Pierdes el redimensionado on-demand, los formatos modernos servidos automáticamente (AVIF/WebP), y el lazy loading optimizado del servidor. Las imágenes se sirven tal cual están en el bucket o en `public/`.

6. **`rewrites`, `redirects` y `headers` dinámicos en `next.config.ts`.**
   Estos los aplica el servidor de Next en runtime. En estático no se aplican. Si necesitas redirecciones, hay que hacerlas con `.htaccess` (en cPanel/Apache) o con el componente cliente.

7. **Rutas dinámicas sin `generateStaticParams`.**
   En App Router, cualquier `app/foo/[id]/page.tsx` necesita declarar de antemano (`generateStaticParams`) **todos** los `id` posibles, porque cada uno se convierte en un HTML pre-generado en build-time. Si los `id` se conocen solo en runtime (p. ej., productos creados por usuarios), esa ruta no puede ser estática y romperá el build.

8. **`cookies()`, `headers()`, `draftMode()` y otras APIs server-only de Next.**
   Estas funciones requieren servidor. En `output: "export"` su uso lanza error en build.

9. **`fetch` con `cache: 'no-store'` en Server Components.**
   La idea de "no cachear" implica volver a pedir el dato en cada request. En estático, el `fetch` se ejecuta **una sola vez en build-time** y el resultado se congela en el HTML. La directiva `no-store` no cambia eso.

### Cómo detectar que algo se rompió por esto

- Síntoma típico: `next build` falla con mensajes como *"export encountered errors on following paths"* o *"Page X is missing exported function generateStaticParams"*.
- Otro síntoma: el build compila, pero en producción una funcionalidad simplemente no responde (típicamente middleware o una API route silenciosamente ausente).
- Cuando aparezca cualquiera de estos casos, antes de cambiar la config a `standalone`, revisar si la funcionalidad puede vivir en el backend externo (`BASIC_ROUTE`) o moverse al cliente.

---

## 6. Ajustes adicionales que hubo que hacer en `develop`

Cambiar `next.config.ts` no fue suficiente. Al ejecutar `next build` con `output: "export"`, el build falló con:

```
Error: Page "/reset-password/[token]" is missing "generateStaticParams()" so it cannot be used with "output: export" config.
```

Esto pasa porque, como se explicó en la sección 5, **toda ruta dinámica `[param]` debe declarar en build-time qué valores del parámetro existen**, vía `generateStaticParams()`. Sin servidor Node en producción, Next no puede inventarse las rutas al vuelo: necesita pre-generar HTML para cada combinación posible.

En `develop` había varias rutas dinámicas sin esa función:

- `src/app/(auth)/reset-password/[token]/page.tsx`
- `src/app/dashboard/business/expenses/[expenseId]/edit/page.tsx`
- `src/app/dashboard/business/products/[businessProductId]/edit/page.tsx`
- `src/app/dashboard/business/products/catalog/[productId]/edit/page.tsx`
- `src/app/dashboard/business/workers/[workerId]/page.tsx`
- `src/app/dashboard/business/workers/[workerId]/edit/page.tsx`

### 6.1. El truco: el placeholder `__dynamic__`

`main` resuelve esto con un patrón muy sencillo: cada ruta dinámica exporta `generateStaticParams()` devolviendo **un único valor "ficticio"** llamado `__dynamic__`.

```ts
export function generateStaticParams() {
  return [{ token: "__dynamic__" }];
}
```

Qué consigue esto:

- Next pre-genera **un solo HTML shell** para esa ruta (en `out/reset-password/__dynamic__/index.html`).
- Ese mismo HTML lo sirve cPanel (con la regla adecuada en `.htaccess`) para *cualquier* valor real de `[token]` que entre por URL.
- El componente cliente lee el valor real con `useParams()` en el navegador y hace el `fetch` correspondiente al backend externo (`BASIC_ROUTE`).

Es decir: la "dinamicidad" deja de vivir en el servidor de Next y se mueve al cliente. El parámetro real **no existe en build-time**, sólo en runtime, en el navegador del usuario.

### 6.2. Restricción técnica: `generateStaticParams()` sólo va en server components

Una sutileza importante de App Router: **no puedes exportar `generateStaticParams()` desde un archivo con `"use client"`** en la cabecera. Es una función que Next ejecuta en el build, no en el navegador.

Por eso, en las páginas que ya eran client components (las que usaban `"use client"` y leían `params: Promise<{...}>` con `use(params)`), no bastaba con añadir la función. Hubo que partirlas en dos:

- `page.tsx` → server component, **sólo** exporta `generateStaticParams()` y renderiza el cliente.
- `<algo>-client.tsx` → archivo nuevo con `"use client"` y toda la UI. Lee el parámetro con `useParams()` en lugar de recibirlo por props.

### 6.3. Qué se hizo en cada archivo

| Ruta dinámica | Estado previo en develop | Cambio aplicado |
| --- | --- | --- |
| `(auth)/reset-password/[token]/page.tsx` | Client component con toda la UI | **Split**: `page.tsx` server + `reset-password-client.tsx` nuevo |
| `dashboard/business/expenses/[expenseId]/edit/page.tsx` | Client component leyendo `params` por prop | **Split**: `page.tsx` server + `expense-edit-client.tsx` nuevo (usa `useParams()`) |
| `dashboard/business/workers/[workerId]/edit/page.tsx` | Client component leyendo `params` por prop | **Split**: `page.tsx` server + `worker-edit-client.tsx` nuevo (usa `useParams()`) |
| `dashboard/business/workers/[workerId]/page.tsx` | Server component con `redirect()` | Sólo se añadió `generateStaticParams()` |
| `dashboard/business/products/[businessProductId]/edit/page.tsx` | Server component (la UI vive en `EditProductForm`, que ya usa `useParams()`) | Sólo se añadió `generateStaticParams()` |
| `dashboard/business/products/catalog/[productId]/edit/page.tsx` | Server component (la UI vive en `EditCatalogProductForm`, que ya usa `useParams()`) | Sólo se añadió `generateStaticParams()` |

Tras estos cambios, `next build` termina limpio y genera la carpeta `out/` con sus 41 páginas estáticas, incluidas las rutas dinámicas en su versión `__dynamic__`.

### 6.4. La otra mitad del mecanismo: `public/.htaccess`

El truco del `__dynamic__` deja en `out/` una carpeta por cada ruta dinámica con ese nombre literal (`out/reset-password/__dynamic__/index.html`, etc.). **Pero el usuario nunca visita esa URL.** El usuario entra a `/reset-password/abc123/`, y Apache, al no encontrar la carpeta `abc123/`, devolvería 404.

Para que esto funcione hace falta una **regla de reescritura en Apache** que, cuando llegue `/reset-password/{cualquierToken}/`, sirva internamente el HTML que vive en `/reset-password/__dynamic__/index.html`. Esa regla vive en [public/.htaccess](../public/.htaccess).

Como Next.js copia automáticamente todo lo de `public/` a la raíz de `out/` durante el build, el archivo termina solo en el destino correcto sin pasos manuales.

El contenido (replicado idénticamente de `main`):

```apache
Options -MultiViews
RewriteEngine On

# Nunca reescribir rutas que ya contengan el placeholder
RewriteRule __dynamic__ - [L]

# Por cada ruta dinámica, un par de condiciones + una regla.
# !-f y !-d garantizan que archivos reales (como /_next/static/chunks/*.js)
# NUNCA se reescriben. Esto es lo que evita el "Unexpected token '<'":
# si esta condición no estuviera, un .js que no exista devolvería el index.html.

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^dashboard/business/workers/([^/]+)/edit/?$ /dashboard/business/workers/__dynamic__/edit/ [L]

# ...una regla análoga por cada ruta dinámica...

# Fallback SPA al final: cualquier ruta no resuelta sirve /index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ /index.html [L]
```

#### Por qué este archivo es crítico

Sin `public/.htaccess`:

- Las rutas dinámicas (`/reset-password/{token}/`, `/dashboard/business/workers/{id}/edit/`, etc.) devuelven **404** en cPanel.
- Cualquier ruta limpia sin trailing slash que Apache no resuelva puede caer en un 404 o en un HTML del propio Next, dependiendo de la configuración por defecto del hosting.
- Y, sobre todo, **sin el `!-f / !-d`** en las reglas, cualquier petición a `_next/static/chunks/algo.js` que llegue antes de que esos archivos estén subidos (o con un nombre que ya no existe) se redirige al `index.html`, el navegador la cachea como JS y aparece el clásico `Uncaught SyntaxError: Unexpected token '<'`. **Esa es la causa real del problema que se vio en la primera ronda de despliegue de develop**: faltaba este archivo.

#### Implicación al añadir nuevas rutas dinámicas

Cada vez que se añada una ruta dinámica nueva al proyecto, hay que actualizar **dos** sitios:

1. La página: `generateStaticParams()` (y eventualmente el split server/client de la sección 6.3).
2. [public/.htaccess](../public/.htaccess): añadir el par `RewriteCond !-f / !-d` + `RewriteRule` que mapee `/.../{id}/...` a `/.../__dynamic__/...`.

Si añades el primero pero olvidas el segundo, el build pasa limpio pero la ruta dará 404 en producción.

### 6.5. Implicación práctica al añadir nuevas rutas dinámicas

Cualquier ruta nueva con un segmento `[param]` que se añada a `develop` (o `main`) **romperá el build o el despliegue** si no se sigue este patrón. La regla a recordar:

1. Si la página puede ser un server component, exportar `generateStaticParams()` con `[{ param: "__dynamic__" }]` directamente en `page.tsx`.
2. Si la página necesita ser cliente (hooks, estado, etc.), partirla en dos: `page.tsx` server con `generateStaticParams()` que renderiza `<Algo />`, y `algo-client.tsx` con `"use client"` que lee el parámetro vía `useParams()`.
3. Nunca confiar en `params: Promise<{...}>` por props si la página termina necesitando ser cliente: ese patrón sólo es válido en server components.
4. Añadir la regla correspondiente en [public/.htaccess](../public/.htaccess).

---

## 7. Despliegue en subdirectorio: `basePath` y `assetPrefix`

Este proyecto despliega **las dos ramas al mismo dominio**, pero en paths distintos (ver [.github/workflows/deploy-workflow.yml](../.github/workflows/deploy-workflow.yml)):

| Rama | URL pública | Carpeta en cPanel |
| --- | --- | --- |
| `main` | `https://psearch.dveloxsoft.com/` | `~/psearch.dveloxsoft.com/` (raíz) |
| `develop` | `https://psearch.dveloxsoft.com/dev/` | `~/psearch.dveloxsoft.com/dev/` |

Esto es importante porque **un build estático de Next.js genera URLs absolutas para sus assets**: los HTMLs piden `/_next/static/chunks/X.js`. Si la app vive en la raíz del dominio, esa URL resuelve correctamente. Si vive en `/dev/`, la URL pedida es `https://midominio.com/_next/static/chunks/X.js`, que **no existe** (está en `/dev/_next/...`), y termina cayendo en el fallback SPA del `.htaccess`. El navegador recibe HTML donde esperaba JS y aparece el clásico `Uncaught SyntaxError: Unexpected token '<'`.

### 7.1. La solución: `basePath` + `assetPrefix`

Next.js soporta esto nativamente con dos opciones en `next.config.ts`:

- **`basePath`**: prefijo que Next antepone a todas las rutas internas (links, navegación, fetches).
- **`assetPrefix`**: prefijo que Next antepone a las URLs de assets (`_next/static/...`, imágenes en `public/`, etc.).

Cuando una app va a un subdirectorio, hay que activar ambos.

Ahora bien — `main` se despliega en la raíz y no necesita `basePath`. Si añadiéramos `basePath: "/dev"` siempre, romperíamos main. Y si lo añadiéramos sólo en develop, el `pnpm dev` local de develop correría en `localhost:3000/dev/` en vez de `localhost:3000/`, lo cual es una molestia para desarrollo.

La solución limpia: leer el prefijo de una **variable de entorno**, que el workflow inyecta sólo en el job de develop. Local y main quedan sin prefijo; develop deploy lo recibe.

```ts
// next.config.ts
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
};
```

Y en [.github/workflows/deploy-workflow.yml](../.github/workflows/deploy-workflow.yml), sólo en el job `deploy-dev`:

```yaml
- name: Build Next.js project
  run: pnpm run build
  env:
    NEXT_PUBLIC_BASE_PATH: /dev
```

### 7.2. Ajuste correspondiente en `public/.htaccess`

`basePath` se ocupa del lado del cliente (HTMLs con URLs prefijadas). Pero las reescrituras de rutas dinámicas viven en Apache, y por defecto sus substituciones (`RewriteRule ... /dashboard/...`) son **absolutas**, lo que significa que apuntan a la raíz del dominio.

Si el `.htaccess` está en `~/psearch.dveloxsoft.com/dev/` y una regla dice:

```apache
RewriteRule ^reset-password/([^/]+)/?$ /reset-password/__dynamic__/ [L]
```

El target `/reset-password/__dynamic__/` apunta a `https://psearch.dveloxsoft.com/reset-password/__dynamic__/` — la raíz, no `/dev/`. Apache sirve lo que haya en main (o un 404). El resultado: las rutas dinámicas de develop no resuelven al HTML correcto.

Para corregirlo, en el `.htaccess` de develop **todas las substituciones llevan el prefijo `/dev/`** (incluido el fallback SPA final):

```apache
RewriteRule ^reset-password/([^/]+)/?$ /dev/reset-password/__dynamic__/ [L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ /dev/index.html [L]
```

Esto significa que [public/.htaccess](../public/.htaccess) en `develop` es **distinto** del de `main`. Cuando se merge develop → main, hay que recordar quitar los prefijos `/dev/`. Si esto se vuelve molesto, en una iteración futura conviene generar el `.htaccess` desde una plantilla en el workflow, con `sed` substituyendo el prefijo. Por ahora es un trade-off aceptado: dos `.htaccess` distintos, una vez por rama.

### 7.3. Validación rápida del despliegue

Tras un `pnpm build` con `NEXT_PUBLIC_BASE_PATH=/dev`, inspeccionar `out/index.html` y confirmar que las `<script>` y `<link>` referencian `/dev/_next/static/...` (no `/_next/static/...`). Si siguen sin prefijo, el env var no se aplicó al build.

En producción, abrir DevTools → Network y confirmar que los chunks devuelven `200 OK` con `Content-Type: application/javascript`, no `text/html`.

### 7.4. Resumen de los tres archivos que coordinan el subpath

| Archivo | Rol | Estado en main | Estado en develop |
| --- | --- | --- | --- |
| [next.config.ts](../next.config.ts) | Inyecta `basePath`/`assetPrefix` en HTMLs | Sin env var → builds para raíz | Con env var en CI → builds para `/dev` |
| [.github/workflows/deploy-workflow.yml](../.github/workflows/deploy-workflow.yml) | Pone `NEXT_PUBLIC_BASE_PATH` sólo en el job de develop | No aplica | Inyecta `/dev` en el build step |
| [public/.htaccess](../public/.htaccess) | Resuelve rutas dinámicas y SPA fallback en Apache | Substituciones a `/...` | Substituciones a `/dev/...` |

Si una sola de estas tres piezas está desalineada, develop se rompe. Si añades una nueva ruta dinámica, tienes que tocar la 1 (o la página) y la 3 — y replicar el cambio en ambas ramas con el prefijo que corresponda.

---

## 8. Cuándo sí cambiar de vuelta a `standalone` (o a otro modo)

Replicamos `main` en `develop` porque hoy el despliegue es estático. Pero si en el futuro el proyecto necesita **cualquiera** de las funcionalidades de la sección 5 — middleware real en runtime, API routes propias, ISR, optimización de imágenes en runtime, redirects/headers dinámicos, etc. — la única salida es migrar a `output: "standalone"` (o al modo por defecto). Esta sección detalla cómo hacerlo paso a paso.

### 8.1. Antes de migrar: ¿de verdad lo necesitas?

`standalone` es un cambio grande. Antes de tomarlo, verifica que la funcionalidad nueva no se puede resolver con alguna de estas alternativas, que mantienen el modo estático:

- **¿Es un endpoint?** Muévelo al backend externo (`BASIC_ROUTE`). Hoy toda la API del proyecto vive allí y eso es lo que permite ser estático.
- **¿Es lógica de autenticación o redirección por cookie?** En lugar de `middleware.ts`, puedes resolverlo en el cliente con un *guard* en el layout (`useEffect` + `router.replace`). Menos elegante, pero compatible con estático.
- **¿Necesitas que `<Image />` optimice imágenes externas?** Considera servir las imágenes ya optimizadas desde el bucket (varios tamaños pre-generados), o usar un servicio externo (Cloudflare Images, Imgix, etc.).
- **¿Necesitas datos frescos en cada visita?** Hazlo desde el cliente con `useQuery` (ya usas TanStack Query). El HTML estático es sólo el "cascarón"; los datos los pide el navegador.

Si después de revisar lo anterior sigues necesitando una funcionalidad de servidor, entonces sí, toca migrar.

### 8.2. Migración paso a paso

#### Paso 1 — Cambiar la config

Editar [next.config.ts](../next.config.ts):

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  trailingSlash: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "bucket.dveloxsoft.com" },
      // añadir aquí cualquier otro host de imágenes externo que uses
    ],
  },
};

export default nextConfig;
```

#### Paso 2 — Limpiar el "placeholder dance" de las rutas dinámicas

Con `standalone` ya no hace falta el truco del `__dynamic__`. Puedes:

- Quitar todos los `export function generateStaticParams() { return [{ ... }]; }` que se añadieron en la sección 6.
- Eliminar los archivos `*-client.tsx` creados sólo para sortear la restricción de client components, **siempre que** prefieras volver al patrón original con `params: Promise<{...}>` por props. No es obligatorio: si quieres, puedes dejar el split como está; funciona igual.
- Quitar también las comprobaciones `if (token === "__dynamic__")` que se añadieron como guarda en los clientes.

#### Paso 3 — Reactivar (o construir) lo que estaba apagado

Aquí es donde recuperas las funcionalidades por las que migraste. Según lo que necesites:

- **Middleware**: crear `src/middleware.ts` con la lógica de auth/redirects/etc. Definir `matcher` para limitar qué rutas lo ejecutan.
- **API routes**: crear `src/app/api/<recurso>/route.ts`. Cuidado: si decides duplicar lógica que hoy vive en el backend externo, define bien dónde queda la fuente de verdad.
- **`next/image` optimizado**: ya queda activo al quitar `unoptimized: true`. Verificar que todos los hosts de imágenes externos estén listados en `remotePatterns`.
- **ISR**: añadir `export const revalidate = N` (segundos) en las páginas que lo necesiten.

#### Paso 4 — Probar el build

```bash
npx next build
```

El resultado deja de ser `out/` y pasa a ser `.next/standalone/` con un `server.js`, más una carpeta `.next/static/` y `public/` que hay que copiar al lado.

Para arrancarlo en local y comprobar:

```bash
node .next/standalone/server.js
```

(Por defecto escucha en el puerto 3000.)

#### Paso 5 — Cambiar la infraestructura de despliegue

**Este es el paso que más impacto tiene y el más fácil de subestimar.** cPanel sirviendo HTML estático **no puede correr `standalone`**. Necesitas un entorno que ejecute Node 20+. Opciones típicas, ordenadas de menos a más fricción:

1. **VPS propio (DigitalOcean, Hetzner, Linode, etc.)**. Instalar Node, un gestor de procesos (`pm2` o `systemd`) y un reverse proxy (Nginx o Caddy) que termine HTTPS y reenvíe al puerto del `server.js`. Es lo más parecido a "mover el sitio de cPanel a un servidor de verdad".
2. **Plataforma PaaS (Railway, Render, Fly.io)**. Conectas el repo, defines el comando de build (`next build`) y el de arranque (`node .next/standalone/server.js`), y la plataforma se encarga del resto. Más caro que un VPS, pero cero mantenimiento.
3. **Contenedor Docker en cualquier host**. Imagen base `node:20-alpine`, copiar `.next/standalone/`, `.next/static/` y `public/`, exponer el puerto. Es el camino más portable.
4. **Vercel**. Es el "modo nativo" de Next.js y no requiere ni siquiera `output: "standalone"`: Vercel detecta el proyecto y despliega con todas las funcionalidades. Es la opción más sencilla, pero ata el proyecto a su plataforma y su modelo de precios.

#### Paso 6 — Migrar el dominio y el SSL

Apuntar el DNS al nuevo host, configurar el certificado HTTPS (Let's Encrypt vía Caddy/Nginx, o el que provea la plataforma elegida), y dar de baja el despliegue antiguo de cPanel cuando se haya verificado que todo funciona.

#### Paso 7 — Variables de entorno

Replicar en el nuevo entorno **todas** las variables de entorno que hoy se inyectan en el build estático. Ojo: en `standalone` muchas variables se leen en runtime, no en build-time, así que algunas que antes se "horneaban" en el HTML ahora viven sólo en el servidor — esto puede cambiar el comportamiento de la app si confiabas en que `process.env.X` estuviera disponible en cliente.

### 8.3. Resumen del esfuerzo

| Categoría | Trabajo estimado |
| --- | --- |
| Editar `next.config.ts` | 1 minuto |
| Limpiar `__dynamic__` y reestructurar páginas (opcional) | 1–2 horas |
| Implementar la nueva funcionalidad que motivó la migración | variable |
| Provisionar nuevo hosting + DNS + SSL | medio día a 2 días según opción |
| Pruebas en staging + cutover | medio día |

No es un cambio reversible "de mentira": **una vez en `standalone`, perder el hosting Node significa volver a redibujar la arquitectura**. Tomar la decisión con el equipo y dejarla registrada (con fecha y razón) en este mismo documento.

---

## 9. Resumen rápido

| Aspecto                             | `output: "export"` (actual)        | `output: "standalone"`           |
| ----------------------------------- | ---------------------------------- | -------------------------------- |
| Carpeta generada                    | `out/`                             | `.next/standalone/`              |
| Necesita servidor Node en prod      | No                                 | Sí                               |
| Compatible con cPanel estático      | Sí                                 | No                               |
| API routes en runtime               | No                                 | Sí                               |
| Middleware                          | No                                 | Sí                               |
| Optimización de imágenes en runtime | No                                 | Sí                               |
| ISR / SSR por request               | No                                 | Sí                               |
| Trailing slash recomendado          | `true`                             | `false`                          |
| `images`                            | `{ unoptimized: true }` (obligado) | `remotePatterns` libre           |
| Rutas dinámicas `[param]`           | Requieren `generateStaticParams()` | Funcionan directamente           |

---

## 10. Archivos de referencia

La configuración vigente está distribuida entre:

- [next.config.ts](../next.config.ts)
- [public/.htaccess](../public/.htaccess)
- [.github/workflows/deploy-workflow.yml](../.github/workflows/deploy-workflow.yml)

Si modificas cualquiera de los tres, vuelve a este documento y actualízalo en consecuencia.
