# Login con Google — 403 "Origen no especificado" tras la migración a `negora.dveloxsoft.com`

**Fecha:** 2026-07-15
**Autor:** Equipo Frontend (pmanage)
**Dirigido a:** Equipo Backend (psearch-back) y administradores del Gateway DveloxSoft (`ms-auth` / `ms.dveloxsoft.com`)
**Componentes involucrados:** `pmanage` (frontend), `psearch-back` (backend/BFF), Gateway `ms-auth` (externo, `ms.dveloxsoft.com/ms-auth`)

---

## TL;DR (resumen ejecutivo)

- Tras migrar el sistema de gestión de `psearch.dveloxsoft.com` → `https://negora.dveloxsoft.com/manager`, el **login con Google dejó de funcionar**. El login normal (email/contraseña) y el resto de la app **sí funcionan**.
- El popup de Google avanza hasta el 3er paso (seleccionar cuenta → consentir), y al volver del callback se queda **en blanco** con este error en la red:
  ```json
  {"message":"Origen no especificado","error":"Forbidden","statusCode":403}
  ```
- Ese error es una `ForbiddenException` de **NestJS lanzada por el Gateway `ms-auth`** (externo), **no** por `psearch-back` (nuestro backend no contiene ese string).
- **Hipótesis principal:** el Gateway resuelve el **origen permitido** para hacer el `postMessage` de retorno a partir de su **registro interno de la app** (identificada por el `pageId` del `DVELOXSOFT_MS_AUTH_TOKEN`). Ese registro **sigue apuntando al origen viejo** (`psearch.dveloxsoft.com`) y **`https://negora.dveloxsoft.com` no está dado de alta** → "Origen no especificado".
- **Acción principal solicitada:** dar de alta el nuevo origen (`https://negora.dveloxsoft.com`) en el registro de esta app dentro del Gateway `ms-auth`, y confirmarnos **cómo** el gateway determina el origen de retorno (config por `pageId` vs. parámetro en la URL).

---

## 1. Síntoma observado

1. El usuario hace clic en "Continuar con Google".
2. Se abre el popup, permite **seleccionar la cuenta** y **confirmar** el consentimiento (pasos 1 y 2 OK).
3. Al "Continuar" (paso 3), el popup queda **en blanco**. La URL que queda cargada en el popup es el callback de Google hacia el gateway:
   ```
   https://ms.dveloxsoft.com/ms-auth/auth/google/callback?iss=https%3A%2F%2Faccounts.google.com&code=4%2F0AXEQx...&scope=email+profile+...+openid&authuser=0&prompt=consent
   ```
4. En la pestaña **Network** aparece la respuesta:
   ```json
   {"message":"Origen no especificado","error":"Forbidden","statusCode":403}
   ```

**Observaciones sobre esa URL de callback:**
- El gateway se sirve bajo el prefijo **`/ms-auth`** (`https://ms.dveloxsoft.com/ms-auth/...`). Es decir, en el servidor `DVELOXSOFT_MS_BASE_URL` está configurado con ese sufijo `/ms-auth` (el `.env.example` del repo lo tiene sin sufijo: `https://ms.dveloxsoft.com`).
- La URL de callback **no contiene `origin`** — lo cual es esperable, porque es el hop **Google → Gateway** y Google solo reenvía `state`, nunca parámetros propios.
- Tampoco se ve el parámetro **`state`** en esa URL (puede estar truncado en la captura; **conviene que el equipo lo verifique**, ver §8).

---

## 2. Contexto: la migración de dominios

Referencia: `pmanage/docs/despliegue-negora-manager.md`.

| | Antes | Ahora |
|---|---|---|
| Frontend (gestión) | `https://psearch.dveloxsoft.com/` | `https://negora.dveloxsoft.com/manager/` |
| API | `https://psearch.dveloxsoft.com/api/v2` | `https://negora.dveloxsoft.com/api/v2` |

El dominio `psearch.dveloxsoft.com` **ya no resuelve** (DNS caído). El frontend ahora vive bajo `negora.dveloxsoft.com/manager` (export estático de Next con `basePath=/manager`) y consume la API en `https://negora.dveloxsoft.com/api/v2`.

---

## 3. El flujo real del login con Google (paso a paso)

1. **Frontend** abre un popup hacia el endpoint de la API:
   `GET https://negora.dveloxsoft.com/api/v2/auth/google`
   (construido con `authRoutes.google = ${BASIC_ROUTE}/auth/google`).
2. **Backend (`psearch-back`)** — `GET /auth/google` (`src/v2/auth/auth.controller.ts`) **redirige** (302) el popup al Gateway DveloxSoft:
   `res.redirect(`${gatewayUrl}/auth/google?state=${authToken}&rolId=4`)`
   donde:
   - `gatewayUrl = DVELOXSOFT_MS_BASE_URL` (en el servidor, `https://ms.dveloxsoft.com/ms-auth`).
   - `authToken = DVELOXSOFT_MS_AUTH_TOKEN` (JWT **fijo** que identifica la app; codifica `pageId`).
3. **Gateway `ms-auth`** inicia el OAuth con Google. El usuario **selecciona cuenta y consiente**.
4. **Google** redirige de vuelta al gateway:
   `https://ms.dveloxsoft.com/ms-auth/auth/google/callback?code=...&state=...`
5. **Gateway** procesa el `code`, obtiene los tokens y **debe devolverlos a la ventana `opener`** (el frontend) mediante `window.opener.postMessage(tokens, <targetOrigin>)`.
6. **Frontend** (`pmanage/src/app/(auth)/login/page.tsx`, `handleMessage`) escucha el `message`, valida el origen (`event.origin.includes('ms.dveloxsoft.com')`), guarda el token, llama `getMe()` y cierra el popup.

**El fallo ocurre en el paso 5**: el gateway responde `403 "Origen no especificado"` en lugar de hacer el `postMessage`, porque **no tiene un origen válido al que devolver los tokens**.

---

## 4. Diagnóstico

### 4.1 El error lo lanza el Gateway, no nuestro backend
El formato `{"message":"...","error":"Forbidden","statusCode":403}` es el de una `ForbiddenException` de NestJS. **`psearch-back` no contiene el string "Origen no especificado"** (verificado por búsqueda en todo `src/`). Por lo tanto lo lanza el Gateway `ms-auth`.

### 4.2 El origen del frontend nunca llega al Gateway en el flujo OAuth
- El endpoint `/auth/google` del gateway se alcanza por **navegación del navegador** (el `res.redirect` del backend), que **no envía header `Origin`** (las navegaciones GET top-level no lo incluyen).
- La librería `@dveloxsoft/dvs-client-nestjs` inyecta el header `Origin` (desde `DVELOXSOFT_MS_ORIGIN`) **solo en las llamadas HTTP servidor→gateway** (login, register, etc.), **no** en esta redirección de navegador.
- El backend arma la URL del gateway **solo con `state` + `rolId`**, sin origen.

### 4.3 El `state` es fijo → el origen no puede "viajar" por el roundtrip de Google
Google solo reenvía el parámetro `state`. Pero aquí `state = DVELOXSOFT_MS_AUTH_TOKEN`, que es un **token fijo de la app** (el mismo para todas las peticiones, no es per-request). Por lo tanto:

> El gateway **no puede** estar usando `state` para transportar un origen dinámico por-request. Lo más probable es que, en su callback, **resuelva el origen de retorno desde su propia configuración**, asociada al `pageId` que viene dentro de ese token.

### 4.4 Conclusión / causa raíz más probable
Cuando el frontend se movió de `psearch.dveloxsoft.com` → `negora.dveloxsoft.com`, **el registro de esta app en el Gateway `ms-auth` quedó con el origen viejo** (o sin el nuevo). Como el gateway no encuentra un origen válido/registrado para devolver el `postMessage`, responde `403 "Origen no especificado"`.

Esto explica por qué **todo lo demás funciona** (el resto de la API usa Bearer token en el header `Authorization`, que no depende del origen) pero **solo el login con Google se rompe**: es el único flujo que depende del origen registrado en el gateway para el `postMessage`.

---

## 5. Evidencia técnica (referencias de código)

### Frontend — apertura del popup y validación del `postMessage`
`pmanage/src/app/(auth)/login/page.tsx`
```ts
// Abre el popup hacia la API (ver §6 para el cambio con ?origin=)
const popup = window.open(authRoutes.google, 'GoogleLogin', `...popup=yes...`);

const handleMessage = async (event: MessageEvent) => {
  // El postMessage lo emite el Gateway (ms.dveloxsoft.com), NO la API de la app.
  if (!event.origin.includes('ms.dveloxsoft.com')) return;
  if (event.isTrusted) {
    const { accessToken, refreshToken } = event.data;
    sessionStorage.setItem("token", accessToken);
    const user = await getMe();
    // ...cierra popup y enruta
  }
};
```

`pmanage/src/lib/routes/auth.ts`
```ts
google: `${BASIC_ROUTE}/auth/google`,   // BASIC_ROUTE = https://negora.dveloxsoft.com/api/v2
```

### Backend — construcción de la URL del Gateway (ORIGINAL, antes de nuestro cambio)
`psearch-back/src/v2/auth/auth.controller.ts` (y equivalente en `src/v1/auth/auth.controller.ts`)
```ts
async googleAuth(@Res() res: Response) {
  const authToken  = this.configService.get<string>("DVELOXSOFT_MS_AUTH_TOKEN");
  const gatewayUrl = this.configService.get<string>("DVELOXSOFT_MS_BASE_URL", "https://ms.dveloxsoft.com");

  // ⚠️ No incluye ningún origen:
  const oauthUrl = `${gatewayUrl}/auth/google?state=${authToken}&rolId=4`;
  return res.redirect(oauthUrl);
}
```

### Configuración del cliente DveloxSoft
`psearch-back/src/v2/dveloxsoft/dvs-client.module.ts`
```ts
DVSClientModule.forRoot({
  authToken:      process.env.DVELOXSOFT_MS_AUTH_TOKEN,
  baseUrl:        process.env.DVELOXSOFT_MS_BASE_URL,
  defaultOrigin:  process.env.DVELOXSOFT_MS_ORIGIN,   // sólo se usa como header Origin en llamadas HTTP, NO en el redirect OAuth
  defaultReferer: process.env.DVELOXSOFT_MS_REFERER,
})
```

`psearch-back/.env.example` (valores de referencia)
```
DVELOXSOFT_MS_BASE_URL=https://ms.dveloxsoft.com      # en el servidor real termina en /ms-auth
DVELOXSOFT_MS_ORIGIN=http://localhost:3006            # ⚠️ apunta a un origen que NO es el frontend de prod
DVELOXSOFT_MS_REFERER=http://localhost:3006/api
```

---

## 6. Cambios ya aplicados por el frontend (PENDIENTES DE VALIDAR — no desplegar aún)

> Estos cambios asumen la **hipótesis alternativa** de §7 (que el gateway acepte el origen por parámetro). Si la causa real es el whitelist (§4.4, lo más probable), el cambio de backend **sobra** y se revierte. **No desplegar hasta confirmar el mecanismo del gateway (§8).**

**a) Frontend — pasar el origen del navegador al backend**
`pmanage/src/app/(auth)/login/page.tsx`
```ts
const googleAuthUrl = `${authRoutes.google}?origin=${encodeURIComponent(window.location.origin)}`;
const popup = window.open(googleAuthUrl, 'GoogleLogin', `...`);
```

**b) Backend (propuesta) — reenviar ese origen al Gateway**
`psearch-back/src/v2/auth/auth.controller.ts`
```ts
async googleAuth(@Request() req: ExpressRequest, @Res() res: Response) {
  const authToken  = this.configService.get<string>("DVELOXSOFT_MS_AUTH_TOKEN");
  const gatewayUrl = this.configService.get<string>("DVELOXSOFT_MS_BASE_URL", "https://ms.dveloxsoft.com");

  // origen: query `origin` (frontend) → header Origin/Referer → DVELOXSOFT_MS_ORIGIN
  const originFromQuery = typeof req.query.origin === "string" ? req.query.origin : undefined;
  let originFromReferer: string | undefined;
  if (req.headers.referer) {
    try { originFromReferer = new URL(req.headers.referer).origin; } catch { originFromReferer = undefined; }
  }
  const origin =
    originFromQuery ||
    (req.headers.origin as string | undefined) ||
    originFromReferer ||
    this.configService.get<string>("DVELOXSOFT_MS_ORIGIN", "");

  const oauthUrl = `${gatewayUrl}/auth/google?state=${authToken}&rolId=4&origin=${encodeURIComponent(origin)}`;
  return res.redirect(oauthUrl);
}
```

> **Riesgo conocido:** el nombre del parámetro `origin` es una **inferencia** a partir del mensaje "Origen no especificado" y del naming del ecosistema (`DVELOXSOFT_MS_ORIGIN`). No pudimos confirmarlo porque el código del Gateway `ms-auth` **no está en nuestro workspace**. Además, por lo dicho en §4.3, un parámetro suelto podría **no sobrevivir** al roundtrip de Google si el gateway no lo persiste (sesión) o no lo asocia al `state`.

---

## 7. Hipótesis

| # | Hipótesis | Probabilidad | Quién lo arregla |
|---|---|---|---|
| **A** | **Whitelist por `pageId`**: el gateway resuelve el origen de retorno desde su registro interno de la app. El registro tiene el origen viejo (`psearch`) y falta `negora`. | **Alta** (encaja con `state` fijo y con "no especificado") | **Gateway `ms-auth` / DveloxSoft** (config) |
| B | **Parámetro en la URL**: el gateway acepta el origen como query param en `/auth/google` y lo persiste por el roundtrip. | Media | Backend (`psearch-back`) + Frontend (ya preparado, §6) |
| C | **`state` per-request**: el origen debería ir codificado dentro de `state` (hoy es un token fijo). | Baja | Gateway + Backend |

---

## 8. Qué necesitamos del equipo de Backend / Gateway

1. **Confirmar el mecanismo** por el cual el Gateway `ms-auth` determina el `targetOrigin` del `postMessage` de retorno en `/ms-auth/auth/google`:
   - ¿Lo toma de un **registro/whitelist por `pageId`** (hipótesis A)?
   - ¿Acepta un **parámetro** en la URL (`origin`, u otro nombre)? Si es así, **¿cuál es el nombre exacto** y **sobrevive** al roundtrip de Google (lo persiste en sesión o lo mete en `state`)?
2. **Si es whitelist (A):** dar de alta el nuevo origen del frontend para esta app (el `pageId` del `DVELOXSOFT_MS_AUTH_TOKEN`):
   - **Producción:** `https://negora.dveloxsoft.com`
   - (Opcional, para pruebas locales: el `http://localhost:<puerto>` que use el equipo)
   - Revisar/retirar el origen viejo `https://psearch.dveloxsoft.com` si aplica.
3. **Verificar el `state`:** en el callback observado no se ve el parámetro `state`. Confirmar que el gateway **reenvía `state` a Google** y lo **recibe de vuelta** en el callback; si se pierde, el gateway no puede correlacionar la sesión (posible causa adicional del 403).
4. **Revisar `DVELOXSOFT_MS_ORIGIN` en el `.env` del servidor:** hoy el ejemplo apunta a `http://localhost:3006`. En producción debería reflejar el origen real del frontend (`https://negora.dveloxsoft.com`) si el gateway lo usa como fallback.

---

## 9. Cómo reproducir / verificar

1. Abrir `https://negora.dveloxsoft.com/manager/login` (o el frontend en local, ver nota).
2. DevTools → pestaña **Network** → activar **Preserve log**.
3. Clic en "Continuar con Google".
4. Inspeccionar el **primer** request a `…/api/v2/auth/google`: mirar su respuesta 302 y el header **`Location`** → es la URL del gateway (`…/ms-auth/auth/google?state=…&rolId=4[&origin=…]`). Ahí se ve el `state` y si va o no `origin`.
5. Completar el login de Google y observar el request al **callback** del gateway que devuelve el `403 "Origen no especificado"`.

**Nota sobre pruebas en local:** el frontend en local apunta a la API según `NEXT_PUBLIC_API_URL` (`.env.local`). Para ejercitar un cambio del backend hay que **correr `psearch-back` en local** (`pnpm start:dev`, puerto 3000 por defecto — ojo que `next dev` también usa 3000, correr uno en otro puerto) y apuntar `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v2`. Aun así, si el gateway valida por whitelist, **puede rechazar un `localhost` no registrado**; la prueba más fiable es contra `https://negora.dveloxsoft.com` (origen de prod) una vez registrado.

---

## 10. Resumen de acciones

- [ ] **Gateway/DveloxSoft:** confirmar mecanismo de origen (A/B/C) — §8.1.
- [ ] **Gateway/DveloxSoft:** registrar `https://negora.dveloxsoft.com` como origen permitido de la app — §8.2.
- [ ] **Gateway/DveloxSoft:** verificar propagación de `state` a Google y de vuelta — §8.3.
- [ ] **Backend:** revisar `DVELOXSOFT_MS_ORIGIN` del `.env` de producción — §8.4.
- [ ] **Backend + Frontend:** si la respuesta es "parámetro" (B), finalizar/ajustar el cambio de §6 con el nombre exacto. Si es whitelist (A), **revertir** el cambio de backend de §6.
