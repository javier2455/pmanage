# Migración de URL: sistema de gestión a `negora.dveloxsoft.com/manager`

Documento de referencia para el cambio de URL base del sistema de gestión
(**pmanage**) en producción (rama `main`).

- **Antes (main):** `https://psearch.dveloxsoft.com/` (raíz)
- **Ahora (main):** `https://negora.dveloxsoft.com/manager/`
  - Login → `https://negora.dveloxsoft.com/manager/login`
  - Dashboard → `https://negora.dveloxsoft.com/manager/dashboard`
  - …y así con todas las vistas.
- **Dev (`develop`):** sin cambios → sigue en `https://psearch.dveloxsoft.com/dev`

La landing ya vive en `https://negora.dveloxsoft.com/` y el sistema de gestión
pasa a colgar de la subruta `/manager` **de ese mismo dominio**.

---

## 1. Cómo funciona el mecanismo (contexto rápido)

`pmanage` es un **export estático de Next.js** (`output: "export"` en
`next.config.ts`). El soporte de subruta se controla con la variable de entorno
**`NEXT_PUBLIC_BASE_PATH`**, que Next aplica como `basePath` + `assetPrefix`.

- `NEXT_PUBLIC_BASE_PATH` **vacío** → app en la raíz (local).
- `NEXT_PUBLIC_BASE_PATH=/dev` → app bajo `/dev` (rama `develop`).
- `NEXT_PUBLIC_BASE_PATH=/manager` → app bajo `/manager` (rama `main`, **nuevo**).

Next prefija `basePath` automáticamente en `<Link>`, `router.push`, `redirect` y
`next/image`. **NO** lo prefija en navegaciones crudas del navegador
(`window.location.href`) ni al construir URLs a mano; esos casos se arreglaron a
mano (ver sección 2).

---

## 2. ✅ Cambios YA APLICADOS en este repositorio (`pmanage`)

No tienes que hacer nada con estos; ya están en el código. Se listan para que
sepas qué se tocó.

| Archivo | Cambio |
|---|---|
| `src/lib/base-path.ts` | **Nuevo.** Helper `withBasePath()` que prefija rutas internas con el basePath. |
| `src/lib/axios.ts` | Los 3 redirect a login (`window.location.href = "/login"`) ahora usan `withBasePath("/login")`. Sin esto, un 401 mandaba al usuario fuera de `/manager`. |
| `src/app/(auth)/forgot-password/page.tsx` | El `urlCallback` del correo de recuperación ahora incluye el basePath (`…/manager/reset-password`). |
| `.github/workflows/deploy-workflow.yml` | Job `main` reconfigurado (ver sección 3). Job `develop` intacto. |

> **Nota (bug latente que también quedó corregido):** los redirect crudos de
> `axios.ts` también estaban mal en `develop` (mandaban a `/login` en vez de
> `/dev/login`). El helper es basePath-aware, así que ahora `dev` también queda
> correcto sin cambiar su URL.

---

## 3. ✅ Qué hace ahora el workflow de despliegue (`main`)

Archivo: `.github/workflows/deploy-workflow.yml`, job `deploy-main`.

1. **Build** con `NEXT_PUBLIC_BASE_PATH: /manager` y `NEXT_PUBLIC_API_URL`.
2. **Regenera `out/.htaccess`** con los destinos de rewrite prefijados a
   `/manager` (ver sección 6 sobre por qué es necesario).
3. **Limpia solo** `~/negora.dveloxsoft.com/manager` (usa `mkdir -p` para crearla
   en el primer deploy y `find -maxdepth 1` para borrar únicamente su contenido).
   **La landing del directorio padre NO se toca.**
4. **Sube** el sitio a `~/negora.dveloxsoft.com/manager/`.

El job `develop` (deploy a `/dev`) quedó exactamente igual que antes.

---

## 4. ⏳ PENDIENTE — Repositorio `pmanage` (decisión + valor que faltan)

### 4.1 URL del API (bloqueante)

El frontend llama al backend. Por defecto (en `src/lib/axios.ts`) apunta a
`https://psearch.dveloxsoft.com/apiv1`, pero dijiste que **el API también se
mueve**. En el workflow quedó como:

```yaml
NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
```

**Debes hacer una de estas dos opciones:**

- **Opción A — Secret de GitHub (lo que está puesto ahora):**
  Repo `pmanage` → *Settings → Secrets and variables → Actions → New repository
  secret* → nombre `NEXT_PUBLIC_API_URL`, valor = la nueva URL del API
  (ej. `https://negora.dveloxsoft.com/apiv1`).
  > ⚠️ Si el secret queda vacío, el build NO falla pero el frontend cae al API
  > viejo (`psearch…/apiv1`). Créalo antes de desplegar a `main`.

- **Opción B — Hardcodear en el workflow (más simple):**
  Como `NEXT_PUBLIC_*` se hornea en el bundle del cliente (no es un secreto real),
  se puede poner la URL directamente en el YAML:
  ```yaml
  NEXT_PUBLIC_API_URL: https://negora.dveloxsoft.com/apiv1
  ```
  Si prefieres esto, dime la URL y lo dejo hardcodeado (no habría que crear
  ningún secret).

**Falta que me confirmes la URL exacta del API y qué opción (A o B) prefieres.**

---

## 5. ⏳ PENDIENTE — Backend (`psearch-back`)

### 5.1 CORS (bloqueante)

El frontend ahora corre en el origen **`https://negora.dveloxsoft.com`**. El
backend debe **permitir ese origen** en su configuración CORS; si no, todas las
peticiones del sistema de gestión fallarán por CORS.

- Busca la whitelist de orígenes / configuración de `enableCors` en el backend
  (NestJS, normalmente en `main.ts` o una variable de entorno tipo
  `CORS_ORIGINS`).
- Añade `https://negora.dveloxsoft.com` (y mantén los orígenes de dev/psearch
  que sigas usando).

### 5.2 Si el API cambia de dominio

Si el backend pasa a servirse desde `negora.dveloxsoft.com/apiv1` (u otra URL),
asegúrate de:

- Que el API responda en esa nueva ruta (config de servidor / reverse proxy).
- Que la URL que pongas en `NEXT_PUBLIC_API_URL` (sección 4.1) coincida exacto,
  incluyendo el sufijo `/apiv1`.

### 5.3 Autenticación (informativo, no requiere acción)

El login usa **Bearer token** guardado en `sessionStorage` y enviado en el header
`Authorization`, no cookies cross-site para el API. Por eso el cambio de dominio
del frontend **no rompe el login** más allá del CORS de la sección 5.1.

---

## 6. ⏳ PENDIENTE — Servidor / cPanel

### 6.1 Subdominio y carpeta

- El subdominio `negora.dveloxsoft.com` **ya existe** (la landing está en línea),
  así que no hay que crear DNS ni docroot nuevo.
- La subcarpeta `~/negora.dveloxsoft.com/manager` la crea el propio workflow
  (`mkdir -p`) en el primer deploy. No tienes que crearla a mano.

### 6.2 `AllowOverride` para el `.htaccess`

Para que funcionen las rutas dinámicas y el fallback SPA bajo `/manager`, Apache
debe permitir `.htaccess` en esa carpeta. En cPanel compartido normalmente ya
está activo (`AllowOverride All`). Si tras el deploy las rutas dinámicas dan 404
al recargar, este es el primer sospechoso.

### 6.3 Por qué se regenera el `.htaccess` (contexto)

El `.htaccess` reescribe rutas dinámicas (ej. `/reset-password/{token}`,
`/dashboard/business/workers/{id}`) y hace fallback SPA a `index.html`. El del
repo (`public/.htaccess`) usa **rutas absolutas desde la raíz** del dominio, que
solo sirven cuando la app está en la raíz. Bajo `/manager` esas rutas apuntarían
a la raíz de `negora` (la landing) y romperían todo.

Por eso el workflow **regenera `out/.htaccess`** en el build de `main` con los
destinos prefijados a `/manager`. No tienes que editar nada en el servidor: el
archivo correcto se sube en cada deploy. (Los **patrones** de match no se
prefijan porque Apache, en un `.htaccess` por-directorio, ya elimina el prefijo
`/manager` de la ruta evaluada.)

---

## 7. Checklist de puesta en producción (orden recomendado)

1. [ ] **Backend:** añadir `https://negora.dveloxsoft.com` al CORS (sección 5.1).
2. [ ] **Backend:** si el API cambia de dominio, dejarlo sirviendo en la nueva URL
       (sección 5.2).
3. [ ] **Repo:** definir `NEXT_PUBLIC_API_URL` — secret o hardcodeado (sección 4.1).
4. [ ] **cPanel:** confirmar `AllowOverride` activo para `.htaccess` (sección 6.2).
5. [ ] **Merge/push a `main`** → dispara el deploy automático a
       `negora.dveloxsoft.com/manager`.
6. [ ] **Verificar en producción:**
   - [ ] `https://negora.dveloxsoft.com/manager/login` carga bien (estilos, imágenes).
   - [ ] Login funciona (sin errores de CORS en la consola del navegador).
   - [ ] Recargar (F5) una ruta dinámica, ej.
         `…/manager/dashboard/business/workers/{id}`, no da 404.
   - [ ] Un 401 (sesión expirada) redirige a `…/manager/login`, no fuera de `/manager`.
   - [ ] El correo de recuperación lleva a `…/manager/reset-password/{token}`.
   - [ ] La **landing** en `https://negora.dveloxsoft.com/` sigue intacta.

---

## 8. Resumen de lo que falta que me digas

- **URL exacta del API** y si la **hardcodeo** en el workflow (opción B) o la
  dejas como **secret** de GitHub (opción A).

Con eso el lado del repositorio queda 100% cerrado; el resto (CORS, cPanel) son
tareas tuyas de servidor listadas arriba.
