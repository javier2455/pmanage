# Backend (NestJS) — Cambios para Trial Pro de 15 días y downgrade a Básico

> Documento de contrato para el equipo de backend. El **frontend ya está
> implementado** asumiendo todo lo descrito aquí. Donde el frontend espera un
> campo/endpoint que aún no existe, hay marcadores `TODO(backend):` en el código.
> Relacionado: [comparativa-planes.md](./comparativa-planes.md), [spec-tecnicas.md](./spec-tecnicas.md).

## Contexto

El registro inicial pasa a ser un **trial de 15 días naturales con acceso
completo (alcance Pro)** como gancho de conversión. Al expirar, el usuario debe
elegir **Básico** (1 negocio, sin equipo, sin features Pro) o **Pro** (hasta 3
negocios, equipo, features Pro). Si durante el trial creó varios negocios,
invitó/aceptó trabajadores y usó features Pro, al bajar a Básico queda en exceso
del nuevo plan.

**Principio rector: "conservar y bloquear, nunca borrar".** Los datos del trial
son reales; nada se borra al hacer downgrade. Lo excedente se **archiva** (y se
restaura al volver a Pro). Los datos solo se eliminan por la baja de cuenta ya
existente (con su gracia de 15 días).

---

## 1. Entidades / migraciones

### `Business`
| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `status` | `enum('active','archived')` | `'active'` | `archived` = bloqueado en solo-lectura |
| `archivedAt` | `timestamp \| null` | `null` | Fecha de archivado |
| `archivedReason` | `varchar \| null` | `null` | p.ej. `'plan_downgrade'` |

### `Worker`
| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `suspended` | `boolean` | `false` | Acceso del trabajador pausado |
| `suspendedAt` | `timestamp \| null` | `null` | |

### `Invitation`
| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `canceled` | `boolean` | `false` | Invitación pendiente invalidada (no borrar) |
| `canceledAt` | `timestamp \| null` | `null` | |

> Migraciones con default seguro para filas existentes (`active`/`false`).

---

## 2. Registro → asignación automática de trial Pro

Al crear una cuenta nueva:
- Asignar automáticamente un plan **con alcance Pro** y
  `expireDate = now + 15 días naturales` (`startDate = now`).
- `getMe` ya calcula `expiredPlan` comparando `expireDate` con la fecha actual; no
  hace falta cron. Verificar que `hasNeverHadPlan=false` tras esta asignación.

---

## 3. `POST /plans/select` (nuevo, self-service)

Reemplaza el flujo manual (hoy el FE redirige a WhatsApp) para que el usuario
elija plan al terminar el trial. **Debe ser transaccional.**

### Request
```jsonc
// POST /plans/select   (auth requerido)
{
  "planType": "basic" | "pro",
  "billingPeriod": "monthly" | "yearly",
  "keepBusinessId": "uuid"   // requerido SOLO si planType=basic y hay >1 negocio activo
}
```

### Response
```jsonc
{
  "message": "Plan actualizado",
  "data": {
    "type": "basic" | "premium",   // tipo aplicado
    "name": "Básico",
    "expireDate": "2026-07-23T00:00:00.000Z",
    "paymentUrl": null              // opcional, si el flujo comercial lo requiere
  }
}
```

### Comportamiento

**`planType = 'basic'`:**
1. Si el usuario tiene **>1 negocio activo** y falta `keepBusinessId` → `400`
   con código `KEEP_BUSINESS_REQUIRED`.
2. Validar que `keepBusinessId` pertenece al usuario y está `active`.
3. En una transacción:
   - `keepBusinessId` → `status='active'`.
   - Resto de negocios activos del usuario → `status='archived'`,
     `archivedAt=now`, `archivedReason='plan_downgrade'`.
   - **Todos** los `Worker` del usuario (de todos sus negocios) → `suspended=true`,
     `suspendedAt=now`, e **invalidar sus refresh tokens / sesiones** (Básico no
     tiene gestión de equipo en absoluto).
   - **Invitaciones pendientes** (`used=false`) → `canceled=true`, `canceledAt=now`
     (no borrar). Los enlaces de aceptación deben dejar de funcionar.
   - Asignar/activar el plan Básico (nuevo `expireDate` según `billingPeriod`).

**`planType = 'pro'`:**
1. Asignar/activar plan Pro (nuevo `expireDate` según `billingPeriod`).
2. **Restaurar** automáticamente: negocios con `archivedReason='plan_downgrade'`
   → `status='active'`, `archivedAt=null`, `archivedReason=null`.
3. Reactivar trabajadores del usuario → `suspended=false`, `suspendedAt=null`.
4. Las invitaciones canceladas pueden quedar `canceled` (el dueño las reenvía
   manualmente) — opcional reactivarlas.

> Pago: si hay pasarela, devolver `paymentUrl` y aplicar el cambio al confirmar el
> pago (webhook). Si por ahora se aprueba directo, aplicar en el mismo request.

---

## 4. Enforcement server-side (no confiar en el frontend)

1. **`PlanActiveGuard`**: en todas las mutaciones del dashboard, si el plan está
   vencido (`expiredPlan=true`) → `402`/`403` con código `PLAN_EXPIRED`. (El FE ya
   redirige al paywall, pero el backend es la autoridad.)
2. **Límite de negocios activos por plan** al crear negocio y en `select`:
   - Básico/Free: 1 negocio activo. Pro: 3. Exceder → `403`
     `BUSINESS_LIMIT_REACHED`. (Hoy el límite de 1 es solo client-side en
     `business/create/page.tsx`.)
3. **Gestión de equipo solo Pro**: crear/editar `Worker` e `Invitation` debe
   rechazarse si el plan no es Pro → `403` `PRO_REQUIRED`.
4. **Operaciones sobre negocios `archived`**: permitir solo lectura; rechazar
   escrituras (ventas, productos, gastos, etc.) con `403` `BUSINESS_ARCHIVED`.

---

## 5. `GET /businesses/my-businesses` — cambios

- Incluir en cada negocio los campos `status` y `archivedReason` (el FE separa
  activos vs archivados; los archivados se muestran bloqueados en el selector).
- **Para login de trabajador**: excluir (o marcar) negocios donde el `Worker`
  está `suspended=true`, de modo que un trabajador suspendido no obtenga acceso.

---

## 6. Trabajador suspendido — experiencia de acceso

Cuando el dueño baja a Básico, el trabajador pierde acceso. El backend debe:
- En **login** / `getMe`: si el usuario es trabajador y todos sus accesos están
  suspendidos, devolver un estado claro (recomendado: flag `accessSuspended: true`
  en `getMe`, o `403` con código `ACCESS_SUSPENDED`), para que el FE muestre
  "Tu acceso fue pausado por un cambio de plan del propietario" en lugar de un
  error genérico. (El FE ya tiene copy para esto en `/dashboard/no-access`.)
- El registro `Worker` y la cuenta del trabajador **se conservan**; se reactivan
  cuando el dueño vuelve a Pro.

---

## 7. Invitaciones canceladas / expiradas

- `GET` de información de invitación (`authRoutes.invitationInformation`) y
  `POST` aceptar invitación deben reflejar el estado:
  - Si `canceled=true` → responder con mensaje claro (p.ej. *"El propietario ya no
    tiene un plan con gestión de equipo; esta invitación fue cancelada."*).
  - Mantener el campo `expired` ya existente.
- El FE muestra el `message` del error tal cual en la pantalla de aceptación, así
  que **basta con devolver un `message` legible** en el error (`4xx`).

---

## 8. Flags de `getMe` (ya existen — confirmar)

El FE consume de `GET /auth/me`:
- `expiredPlan: boolean` — usado por el paywall (`PlanGuard` + middleware).
- `hasNeverHadPlan: boolean` — también dispara el paywall.
- `plan.type`, `plan.name`, `plan.startDate`, `plan.expireDate`.

Confirmar que estos campos siguen presentes y correctos tras la asignación de
trial y tras `select`.

---

## Resumen de contratos que el frontend ya consume

| Contrato | Dónde lo usa el FE |
|---|---|
| `POST /plans/select` `{ planType, billingPeriod, keepBusinessId? }` | `src/lib/api/plans.ts` → `selectPlan()` |
| `Business.status` / `archivedReason` | `src/lib/types/business.ts`, switcher, `business-context` |
| `getMe().expiredPlan` / `hasNeverHadPlan` | `src/components/auth/plan-guard.tsx`, `middleware.ts` |
| `accessSuspended` (o `403 ACCESS_SUSPENDED`) | `src/app/dashboard/no-access/page.tsx` |
| Invitación `canceled` + `message` legible | `src/app/(auth)/accept-invitation/page.tsx` |

## Códigos de error sugeridos
`KEEP_BUSINESS_REQUIRED`, `PLAN_EXPIRED`, `BUSINESS_LIMIT_REACHED`,
`PRO_REQUIRED`, `BUSINESS_ARCHIVED`, `ACCESS_SUSPENDED`.
