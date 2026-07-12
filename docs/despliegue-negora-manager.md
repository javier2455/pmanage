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

**✅ Ya quedó configurado de forma segura para probar YA.** El workflow ahora usa:

```yaml
NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL || 'https://psearch.dveloxsoft.com/apiv1' }}
```

Es decir:

- **Para probar ahora:** sin hacer nada, el frontend `/manager` apunta a la **API
  viva actual** (`psearch…/apiv1`). Así puedes verificar el cambio de URL
  `/manager` de forma aislada, sin depender de que la API ya esté migrada.
- **Cuando la API de negora esté lista:** crea el secret `NEXT_PUBLIC_API_URL`
  (repo `pmanage` → *Settings → Secrets and variables → Actions*) con la nueva URL
  (ej. `https://negora.dveloxsoft.com/apiv1`) y el próximo deploy la tomará
  automáticamente. No hace falta tocar el YAML.

> Recuerda que `NEXT_PUBLIC_*` se hornea en el bundle del cliente (no es secreto
> real); el secret es solo por comodidad de configuración.

---

## 5. ⏳ PENDIENTE — Backend (`psearch-back`)

### 5.1 CORS — variable `CORS_ORIGINS` (bloqueante)

Es **la única variable de entorno relevante** para esta migración. El CORS se
configura en `src/main.ts` leyendo `CORS_ORIGINS` (orígenes separados por comas).

- En el `.env` **del servidor** (no está en git, no lo veo desde aquí) debe
  quedar algo como:
  ```
  CORS_ORIGINS=https://negora.dveloxsoft.com,https://psearch.dveloxsoft.com
  ```
  (mantén los orígenes de dev/psearch que sigas usando).
- ⚠️ **Debe ser el origen exacto:** solo `esquema://host`, **sin** ruta y **sin**
  barra final. `https://negora.dveloxsoft.com` ✅ — NO `https://negora.dveloxsoft.com/`
  ni `https://negora.dveloxsoft.com/manager`.
- Si `CORS_ORIGINS` queda vacío, el backend deja CORS **abierto a todos** (y avisa
  en el log). Funcionaría para probar, pero no es aceptable en producción.

> **Confírmame el valor real de `CORS_ORIGINS` en tu `.env` del servidor**, porque
> ese archivo no está versionado y no puedo verificarlo desde el repo.

### 5.2 ✅ URLs de invitación — YA CORREGIDAS (código aplicado)

El backend armaba a mano los enlaces de **invitación de trabajadores** apuntando
al dominio/ruta VIEJOS. **Ya está aplicado el fix** (v1 y v2):

- **Nuevo helper** `src/common/frontend-url.ts` → `frontendUrl(path)` construye el
  enlace desde la env `FRONTEND_BASE_URL` (default de producción
  `https://negora.dveloxsoft.com/manager`).
- Las 4 URLs hardcodeadas (`v1/v2 business-worker.service.ts`, register +
  accept-invitation) ahora usan `frontendUrl(...)`.
- `FRONTEND_BASE_URL` registrada como **opcional** en `src/config/env.validation.ts`
  (no rompe el arranque si falta) y documentada en `.env.example`.

**Tu única tarea de servidor aquí (opcional):** si quieres dejarlo explícito en el
`.env` del servidor, añade:
```
FRONTEND_BASE_URL=https://negora.dveloxsoft.com/manager
```
Si NO lo pones, el código ya usa ese valor por defecto, así que las invitaciones
saldrán correctas igual. Ponlo solo si en el futuro la URL vuelve a cambiar.

> Nota: esto NO afecta el login. El reset de contraseña sigue usando el
> `urlCallback` del frontend (sección 5.3).

### 5.3 Reset de contraseña (informativo, no requiere acción)

El backend **no** hardcodea la URL de reset: usa el `urlCallback` que le manda el
frontend (`auth.controller.ts` → `urlCallback: body.urlCallback ?? ""`). Como el
frontend ya lo arma con basePath (`…/manager/reset-password`), este flujo queda
correcto sin tocar el backend. ✅

### 5.4 Si el API cambia de dominio

Si el backend pasa a servirse desde `negora.dveloxsoft.com/apiv1` (u otra URL),
asegúrate de:

- Que el API responda en esa nueva ruta (config de servidor / reverse proxy).
- Que la URL que pongas en `NEXT_PUBLIC_API_URL` (sección 4.1) coincida exacto,
  incluyendo el sufijo `/apiv1`.

### 5.5 Autenticación (informativo, no requiere acción)

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

1. [ ] **Backend (TÚ, único bloqueante):** en el `.env` del servidor, poner
       `CORS_ORIGINS` con `https://negora.dveloxsoft.com` (origen exacto, sin
       barra/ruta). Redespliega/reinicia el backend tras el cambio — sección 5.1.
2. [x] **Backend (código):** URLs de invitación → `frontendUrl()` +
       `FRONTEND_BASE_URL`. **Ya aplicado.** (Opcional: poner `FRONTEND_BASE_URL`
       en el `.env` del servidor; si no, usa el default correcto) — sección 5.2.
3. [x] **Repo (código):** `NEXT_PUBLIC_API_URL` con default a la API viva.
       **Ya aplicado.** (Crea el secret cuando la API de negora esté lista) — §4.1.
4. [ ] **Backend (TÚ, opcional):** si migras la API a negora, dejarla sirviendo en
       la nueva URL y crear el secret `NEXT_PUBLIC_API_URL` — secciones 4.1 / 5.4.
5. [ ] **cPanel (TÚ):** confirmar `AllowOverride` activo para `.htaccess` — 6.2.
6. [ ] **Merge/push a `main`** (frontend) → deploy automático a
       `negora.dveloxsoft.com/manager`. Redesplegar el backend con el nuevo
       `.env`.
7. [ ] **Verificar en producción:**
   - [ ] `https://negora.dveloxsoft.com/manager/login` carga bien (estilos, imágenes).
   - [ ] Login funciona (sin errores de CORS en la consola del navegador).
   - [ ] Recargar (F5) una ruta dinámica, ej.
         `…/manager/dashboard/business/workers/{id}`, no da 404.
   - [ ] Un 401 (sesión expirada) redirige a `…/manager/login`, no fuera de `/manager`.
   - [ ] El correo de recuperación lleva a `…/manager/reset-password/{token}`.
   - [ ] El correo de **invitación de trabajador** lleva a
         `…/manager/register` / `…/manager/accept-invitation` (no a psearch).
   - [ ] La **landing** en `https://negora.dveloxsoft.com/` sigue intacta.

---

## 8. Resumen: qué falta para probar

Todo el **código** (frontend + backend) está aplicado. Para lanzar la prueba solo
queda **una** acción tuya de servidor imprescindible:

1. **`CORS_ORIGINS`** en el `.env` del backend debe incluir
   `https://negora.dveloxsoft.com` (origen exacto). Reinicia/redespliega el backend.
2. **Merge/push a `main`** en `pmanage` → deploy automático a `/manager`.
3. Abrir `https://negora.dveloxsoft.com/manager/login` y verificar (checklist §7).

Con eso pruebas el sistema `/manager` contra la API viva actual. La migración de
la API a negora es un paso aparte y opcional (crear el secret `NEXT_PUBLIC_API_URL`
cuando esté lista); no bloquea esta prueba.
