# Conversión de un proyecto Next.js a sitio estático (SPA en cPanel/Apache)

Guía paso a paso de cómo convertimos este proyecto (Next.js App Router) a un
**export estático** desplegable en hosting compartido (cPanel + Apache), tal y
como está implementado en la rama `main`. Sirve como receta para replicarlo en
otro proyecto.

> **Idea general:** Next.js genera HTML/CSS/JS estático (`output: "export"`).
> No hay servidor Node en producción: Apache sirve los archivos y un `.htaccess`
> se encarga de las rutas dinámicas y del *fallback* tipo SPA. Todos los datos se
> piden desde el cliente (React Query → API externa).

---

## 1. Configurar `next.config.ts` para export estático

Es el cambio central. Activa la exportación estática y los ajustes que la hacen
compatible con Apache.

```ts
// next.config.ts
import type { NextConfig } from "next";

// Permite desplegar en un subdirectorio (ej. /dev) sin tocar el código.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactCompiler: true,        // opcional
  output: "export",           // ← genera la carpeta out/ con HTML estático
  trailingSlash: true,        // ← cada ruta = carpeta/index.html (clave para Apache)
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true }, // ← sin servidor, no hay optimización de imágenes on-demand
};

export default nextConfig;
```

Puntos importantes:

- **`output: "export"`** → al hacer `next build` se crea la carpeta `out/` con
  todo el sitio estático (no se usa `next start`).
- **`trailingSlash: true`** → genera `ruta/index.html` en lugar de `ruta.html`.
  Esto es lo que permite que Apache resuelva URLs limpias sin configuración extra.
- **`images: { unoptimized: true }`** → obligatorio, porque el optimizador de
  imágenes de Next necesita servidor.
- **`basePath` / `assetPrefix`** → opcional. Lo usamos para desplegar la misma
  build en producción (raíz) y en `/dev` cambiando solo una variable de entorno.

---

## 2. Manejar rutas dinámicas con un *placeholder* `__dynamic__`

El export estático **no puede** generar páginas para IDs que no se conocen en
tiempo de build (ej. `/workers/123`, `/reset-password/{token}`). La solución:
generar **una sola** página "comodín" por cada ruta dinámica y leer el valor real
en el cliente.

### 2.1 `generateStaticParams` con el placeholder

En cada `page.tsx` de una ruta dinámica (`[param]`), devolvemos un único
parámetro ficticio `__dynamic__`:

```tsx
// src/app/(auth)/reset-password/[token]/page.tsx
import ResetPasswordClient from "./reset-password-client";

export function generateStaticParams() {
  return [{ token: "__dynamic__" }]; // genera out/reset-password/__dynamic__/index.html
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />; // toda la lógica vive en el componente cliente
}
```

Esto produce **un solo** archivo estático: `.../__dynamic__/index.html`, que
servirá para *cualquier* ID gracias al `.htaccess` (paso 3).

### 2.2 Leer el ID real en el cliente con `useParams`

El componente cliente lee el segmento real desde la URL del navegador (no desde
el HTML estático), y con ese ID pide los datos a la API:

```tsx
// src/app/(auth)/reset-password/[token]/reset-password-client.tsx
"use client";

import { useParams } from "next/navigation";

export default function ResetPasswordClient() {
  const params = useParams();
  const token = (params?.token as string) ?? ""; // ← valor real de la URL
  // ...usar token para la mutación / query
}
```

> **Patrón:** `page.tsx` (servidor, solo `generateStaticParams` + render del
> cliente) + `*-client.tsx` (`"use client"`, `useParams()` + React Query). El
> HTML es siempre el mismo; el cliente "hidrata" con el ID real de la barra de
> direcciones.

---

## 3. `.htaccess`: reescrituras de rutas dinámicas + *fallback* SPA

Va en `public/.htaccess` para que Next lo copie tal cual a `out/`. Hace dos cosas:

1. **Reescribe** cada URL con ID real al archivo `__dynamic__` correspondiente.
2. **Fallback SPA:** cualquier otra ruta inexistente cae en `index.html`.

```apache
Options -MultiViews
RewriteEngine On

# Nunca reescribir rutas que ya contienen el placeholder
RewriteRule __dynamic__ - [L]

# --- Rutas dinámicas ---
# Las condiciones !-f y !-d aseguran que archivos/carpetas reales
# (assets de Next, páginas estáticas como /create) NO se reescriban.

# /dashboard/business/workers/{id}/edit  →  .../workers/__dynamic__/edit/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^dashboard/business/workers/([^/]+)/edit/?$ /dashboard/business/workers/__dynamic__/edit/ [L]

# /dashboard/business/workers/{id}  →  .../workers/__dynamic__/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^dashboard/business/workers/([^/]+)/?$ /dashboard/business/workers/__dynamic__/ [L]

# /reset-password/{token}  →  /reset-password/__dynamic__/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^reset-password/([^/]+)/?$ /reset-password/__dynamic__/ [L]

# ...una regla por cada ruta dinámica del proyecto...

# --- Fallback SPA: cualquier otra ruta inexistente → index.html ---
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ /index.html [L]
```

Cómo funciona en conjunto:

- El usuario entra a `/reset-password/abc123`.
- Apache no encuentra ese archivo → la regla lo reescribe internamente a
  `/reset-password/__dynamic__/index.html` (la URL en el navegador **no cambia**).
- Se sirve ese HTML; en el cliente `useParams().token === "abc123"`.
- Las condiciones `!-f`/`!-d` evitan reescribir assets reales (`/_next/...`,
  imágenes, etc.).

> **Importante:** hay que añadir **una regla de reescritura por cada ruta
> dinámica**, ordenadas de más específica a menos (primero `/{id}/edit`, luego
> `/{id}`). El bloque de *fallback* SPA va siempre al final.

---

## 4. Todo el fetch de datos va al cliente

Como no hay SSR/servidor, no se usan `fetch` en server components ni Route
Handlers para datos. El proyecto usa:

- **React Query** (`@tanstack/react-query`) + **axios** para consumir la API
  externa, dentro de hooks (`useGetExpenseByIdQuery`, etc.).
- Un `QueryProvider` cliente que envuelve la app en el `layout.tsx` raíz.

Esto significa que cada página dinámica funciona así: *HTML estático genérico →
cliente lee el ID → React Query pide los datos a la API → render*.

---

## 5. Despliegue automático a cPanel (GitHub Actions)

El workflow construye el sitio y sube `out/` por SSH/SCP. Usamos el mismo
repositorio para producción (`main` → raíz) y staging (`develop` → `/dev`).

```yaml
# .github/workflows/deploy-workflow.yml
name: Deploy to cPanel

on:
  push:
    branches: [main, develop]

jobs:
  deploy-main:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '24', cache: 'pnpm' }

      - name: Install dependencies
        run: pnpm install
      - name: Build Next.js project
        run: pnpm run build            # genera out/

      # Limpia el remoto preservando .htaccess, api, etc.
      - name: Clean remote folder
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.CPANEL_HOST }}
          username: ${{ secrets.CPANEL_USER }}
          key: ${{ secrets.CPANEL_KEY }}
          passphrase: ${{ secrets.CPANEL_PASSPHRASE }}
          script: |
            TARGET=~/tu-dominio.com
            cd $TARGET || exit 1
            for item in *; do
              if [ "$item" != ".htaccess" ] && [ "$item" != ".well-known" ] \
                 && [ "$item" != "api" ] && [ "$item" != "dev" ]; then
                rm -rf "$item"
              fi
            done

      # Sube el contenido de out/ a la raíz del dominio
      - name: Upload static site (out/)
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.CPANEL_HOST }}
          username: ${{ secrets.CPANEL_USER }}
          key: ${{ secrets.CPANEL_KEY }}
          passphrase: ${{ secrets.CPANEL_PASSPHRASE }}
          source: "out/**"
          target: "~/tu-dominio.com/"
          overwrite: true
          strip_components: 1           # quita el prefijo out/ al subir
```

El job de `develop` es idéntico pero apunta a `~/tu-dominio.com/dev` y solo
limpia esa subcarpeta (despliegue de staging aislado).

Secrets necesarios en el repo: `CPANEL_HOST`, `CPANEL_USER`, `CPANEL_KEY`
(clave SSH privada), `CPANEL_PASSPHRASE`.

---

## Checklist para replicar en otro proyecto

1. [ ] `next.config.ts` con `output: "export"`, `trailingSlash: true`,
       `images.unoptimized: true` (y `basePath`/`assetPrefix` si usas subcarpeta).
2. [ ] Por cada ruta dinámica `[param]`: `generateStaticParams()` que devuelva
       `[{ param: "__dynamic__" }]`.
3. [ ] Mover la lógica a un componente `"use client"` que lea el ID con
       `useParams()`.
4. [ ] Pasar todo el fetch de datos a React Query / cliente (nada de SSR).
5. [ ] `public/.htaccess` con una regla de reescritura `__dynamic__` por ruta
       dinámica + fallback SPA a `index.html`.
6. [ ] `pnpm run build` → verificar que se genera `out/` con los `index.html`
       (incluido `.../__dynamic__/index.html`).
7. [ ] Workflow de GitHub Actions que construya y suba `out/` por SCP a cPanel.
8. [ ] Configurar los secrets SSH del hosting.

### Limitaciones a tener en cuenta

- No hay SSR, ISR, ni Route Handlers (`app/api/...`) en producción: todo es
  estático + cliente.
- Las imágenes no se optimizan (se sirven tal cual).
- El SEO de páginas dinámicas es limitado (el contenido se carga en cliente).
- Cada nueva ruta dinámica requiere **a la vez** su `generateStaticParams` y su
  regla en `.htaccess`; es fácil olvidar una de las dos.
