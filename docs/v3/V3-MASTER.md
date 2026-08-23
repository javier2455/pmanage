# V3 — Documento Maestro (Fuente de la Verdad)

> **Versión del plan:** v3.0 (borrador) · **Fecha:** 2026-06-24 · **Rama objetivo:** `develop` → futura `v3`
> **Proyecto:** Negora / pmanage · **Backend base URL:** `https://psearch.dveloxsoft.com/api/v2`
>
> ⭐ **Este archivo es la ÚNICA fuente de la verdad de la versión 3.** Toda nueva
> funcionalidad, cambio o mejora de v3 se registra **primero aquí** y desde aquí
> se reparte a áreas y tareas (frontend / backend). Los futuros documentos por
> área serán una extracción de este maestro; si hay conflicto, **manda este
> documento**.
>
> Documentos de referencia (estado actual): [docs/sdd/sdd-develop.md](../sdd/sdd-develop.md) ·
> [docs/análisis-planes/spec-tecnicas.md](../análisis-planes/spec-tecnicas.md) ·
> [docs/análisis-planes/backend-cambios.md](../análisis-planes/backend-cambios.md) ·
> [docs/flujo-de-caja.md](../flujo-de-caja.md) · [docs/extra/pro-gating.md](../extra/pro-gating.md) ·
> [docs/v3/backend-flujo-caja-mensual.md](./backend-flujo-caja-mensual.md) *(contrato BE de V3-039)*

---

## Tabla de contenidos

0. [Gobernanza — cómo usar este documento](#0-gobernanza)
1. [Visión y valor de negocio](#1-vision)
2. [Backlog maestro](#2-backlog)
3. [Cambios transversales — tier Enterprise](#3-transversales)
4. [Área 1 — Clientes y fidelización (CRM)](#4-crm) · *Enterprise*
5. [Área 2 — Descuentos, ofertas y mensajería](#5-descuentos) · *Pro*
6. [Área 3 — Nóminas y compensación](#6-nominas) · *Enterprise*
7. [Área 4 — Flujo de caja profesional](#7-caja) · *Pro / Enterprise*
8. [Área 5 — Resúmenes automáticos de negocio](#8-resumenes) · *Base (canales SMS/WhatsApp = Pro)*
9. [Funcionalidades sugeridas](#9-sugeridas)
10. [Bitácora de cambios](#10-changelog)
11. [Plan de implementación por fases](#11-plan-implementacion)

---

<a name="0-gobernanza"></a>
## 0. Gobernanza — cómo usar este documento

Este maestro es el registro central de la v3. Reglas de uso:

### Cómo añadir algo nuevo (idea, cambio o mejora)
1. **Regístralo en el backlog maestro (§2)** con un **ID estable** (`V3-001`, `V3-002`, …). El ID nunca se reutiliza ni se renumera.
2. **Asígnalo a un área** (CRM / Descuentos / Nóminas / Caja / Transversal). Si no encaja en ninguna, crea una nueva área (nueva sección §N).
3. **Define su tier** (Pro / Enterprise) y sus **dependencias** (otros IDs que debe esperar).
4. **Desarrolla el detalle** en la sección del área correspondiente (bloques Backend y Frontend).
5. **Mantén el estado** en la columna correspondiente del backlog.
6. **Anota el cambio** en la bitácora (§10) con fecha.

### Estados de una funcionalidad
`idea` → `especificada` → `en implementación` → `hecho`

- **idea:** registrada en el backlog, sin spec.
- **especificada:** tiene contrato FE/BE completo en su área (listo para implementar).
- **en implementación:** hay código en curso (rama abierta).
- **hecho:** mergeada y verificada.

### División futura por áreas
Cuando se vaya a implementar, este maestro se extraerá a archivos por área
(p. ej. `docs/v3/01-clientes-crm/clientes-crm.md` + `backend-clientes-crm.md`),
**manteniendo este archivo como índice y registro**. La extracción no cambia los
IDs ni los contratos: solo los reubica.

### Convención de tareas FE / BE (recordatorio)
- **Frontend** (por dominio): `src/lib/types/<dom>.ts` · `src/lib/routes/<dom>.ts` · `src/lib/api/<dom>.ts` · `src/lib/validations/<dom>.ts` (Zod) · `src/hooks/use-<dom>.ts` (React Query) · `src/components/<dom>/` · páginas en `src/app/dashboard/...`.
- **Backend** (contrato): entidad/migración → endpoints (request/response JSON) → enforcement server-side (gating, validaciones) → códigos de error.

---

<a name="1-vision"></a>
## 1. Visión y valor de negocio

**Negora hoy** ayuda al dueño a **registrar lo que pasa** en su negocio (productos,
ventas, inventario, gastos, caja, equipo, cierres). **La v3 da el salto a ayudarle
a *hacer crecer* el negocio**: captar y retener clientes, mejorar márgenes con
descuentos y ofertas inteligentes, profesionalizar el pago al equipo y elevar el
control financiero al nivel de sistemas contables serios.

| Área | Qué aporta al negocio | KPIs que mejora |
|---|---|---|
| **CRM y fidelización** | Convierte ventas anónimas en relaciones: capta leads, informa de novedades y premia a los recurrentes. | Clientes recurrentes, ticket medio, LTV, tasa de recompra |
| **Descuentos y ofertas** | Incentiva compras grandes y conversión a delivery; liquida stock; sube el ticket. | Ticket medio, unidades por venta, rotación de stock, conversión |
| **Nóminas y compensación** | Paga por resultados y retiene talento con reglas claras y trazables. | Productividad por trabajador, costo laboral / ventas, rotación de personal |
| **Flujo de caja profesional** | Pasa de "foto del saldo" a un flujo de caja real: qué entra/sale, cuándo, proyección y conciliación. | Liquidez, días de caja, exactitud de saldos, cobros a tiempo (AR) |

---

<a name="2-backlog"></a>
## 2. Backlog maestro

Una fila por funcionalidad/cambio. **Toda nueva idea entra aquí.**

| ID | Funcionalidad | Área | Tier | Estado | Depende de | Sección |
|---|---|---|---|---|---|---|
| **V3-000** | Tier **Enterprise** (modelo de plan + gating) | Transversal | — | especificada | — | §3 |
| **V3-001** | CRUD de clientes (`Customer`) + `Sale.customerId` | CRM | Enterprise | especificada | V3-000 | §4 |
| **V3-002** | Lead capture / suscripción a novedades | CRM | Enterprise | especificada | V3-001 | §4 |
| **V3-003** | Segmentos de clientes (auto + etiquetas) | CRM | Enterprise | especificada | V3-001 | §4 |
| **V3-004** | Campañas Email / WhatsApp / in-app | CRM | Enterprise | especificada | V3-001, V3-003 | §4 |
| **V3-005** | Fidelización (puntos / nivel) | CRM | Enterprise | especificada | V3-001, V3-013 | §4 |
| **V3-010** | Descuentos por línea y por venta | Descuentos | Pro | especificada | — | §5 |
| **V3-011** | Promociones (fechas, volumen, X×Y, envío gratis) | Descuentos | Pro | especificada | V3-010 | §5 |
| **V3-012** | Cupones (código, límite, vigencia, segmento) | Descuentos | Pro | especificada | V3-010 | §5 |
| **V3-013** | Mensajería / envío (costo, zonas, envío gratis) | Descuentos | Pro | especificada | — | §5 |
| **V3-014** | `POST /sales/quote` (cálculo previo de totales) | Descuentos | Pro | especificada | V3-010..013 | §5 |
| **V3-020** | Planes de compensación por trabajador | Nóminas | Enterprise | especificada | V3-000 | §6 |
| **V3-021** | Comisiones automáticas (desde ventas/utilidad) | Nóminas | Enterprise | especificada | V3-020 | §6 |
| **V3-022** | Estímulos/bonos y deducciones | Nóminas | Enterprise | especificada | V3-020 | §6 |
| **V3-023** | Corridas de nómina + recibo PDF | Nóminas | Enterprise | especificada | V3-020..022 | §6 |
| **V3-024** | Pago de nómina → movimiento de caja `payroll` | Nóminas | Enterprise | especificada | V3-023, V3-031 | §6 |
| **V3-030** | Libro de movimientos de caja (saldo corriente) | Caja | Pro | especificada | — | §7 |
| **V3-031** | Ajustes manuales (depósito/retiro) | Caja | Pro | especificada | V3-030 | §7 |
| **V3-032** | Transferencias entre monedas | Caja | Pro | especificada | V3-030 | §7 |
| **V3-033** | Flujo por período (base caja) | Caja | Pro | especificada | V3-030 | §7 |
| **V3-034** | Cuentas por cobrar/pagar (AR/AP) | Caja | Enterprise | especificada | V3-030 | §7 |
| **V3-035** | Proyección de cobros/pagos | Caja | Enterprise | especificada | V3-034 | §7 |
| **V3-036** | Conciliación contra extracto | Caja | Enterprise | especificada | V3-030 | §7 |
| **V3-037** | Múltiples cajas/cuentas (caja chica vs banco) | Caja | Enterprise | especificada | V3-030 | §7 |
| **V3-038** | Estado de flujo de caja exportable | Caja | Enterprise | especificada | V3-033 | §7 |
| **V3-039** | Resumen mensual de flujo de caja + salud (semáforo) exportable | Caja | Enterprise | especificada | V3-033, V3-038 | §7 |
| **V3-040** | Cálculo de resúmenes de ingresos semanal/mensual | Resúmenes | — | **hecho** (2026-07-28) | — | §8 |
| **V3-041** | Disparador automático de los resúmenes (cron + idempotencia) | Resúmenes | — | especificada | V3-040 | §8 |
| **V3-042** | Visibilidad de los resúmenes en la UI de notificaciones | Resúmenes | — | especificada | V3-041 | §8 |
| **V3-043** | Toggles de canal para los resúmenes en Ajustes del negocio | Resúmenes | — | especificada | V3-041 | §8 |
| **V3-090** | Portal/registro público de clientes | Sugerida | Enterprise | idea | V3-002 | §9 |
| **V3-091** | Puntos canjeables por cupones | Sugerida | Enterprise | idea | V3-005, V3-012 | §9 |
| **V3-092** | Recomendaciones de reabastecimiento | Sugerida | Pro | idea | — | §9 |
| **V3-093** | Recordatorios de cobro (AR) por WhatsApp | Sugerida | Enterprise | idea | V3-004, V3-034 | §9 |
| **V3-094** | Metas de equipo y ranking (gamificación) | Sugerida | Enterprise | idea | V3-021 | §9 |
| **V3-095** | Costos de envío por zona (MapLibre) | Sugerida | Pro | idea | V3-013 | §9 |
| **V3-096** | Reportes financieros (P&L caja vs devengo) | Sugerida | Enterprise | idea | V3-033 | §9 |
| **V3-097** | PWA / offline-first con cola de operaciones | Transversal | Todos | especificada | V3-107..109 | §11 |
| **V3-098** | Órdenes de compra a proveedores (PO) | Sugerida | Pro | idea | V3-034 | §9 |
| **V3-099** | Modo POS rápido | Sugerida | Pro | idea | — | §9 |
| **V3-100** | Log de actividad / auditoría | Transversal | Pro | especificada | — | §11 |
| **V3-101** | Recibos y facturas compartibles por WhatsApp | Sugerida | Pro | idea | V3-002 | §9 |
| **V3-102** | Presupuestos por categoría de gasto | Sugerida | Pro | idea | — | §9 |
| **V3-103** | 2FA (TOTP) y gestión de sesiones activas | Sugerida | Enterprise | idea | — | §9 |
| **V3-104** | Pronóstico de demanda y reabastecimiento sugerido | Sugerida | Pro | idea | V3-092 | §9 |
| **V3-105** | Resumen narrativo del negocio (informe mensual automático) | Sugerida | Enterprise | idea | V3-039 | §9 |
| **V3-106** | Enforcement server-side de planes + gating de exports | Transversal | — | especificada | — | §11 |
| **V3-107** | Historial de tasas de cambio (append-only) | Caja | — | especificada | — | §11 |
| **V3-108** | Idempotencia de escrituras (`Idempotency-Key`) | Transversal | — | especificada | — | §11 |
| **V3-109** | Numeración de facturas atómica (secuencia por negocio) | Ventas | — | especificada | — | §11 |
| **V3-110** | Compositor de listados de productos por WhatsApp | Mensajería | Pro | en implementación | — | §9 |
| **V3-111** | Tiempo real: SSE + `GET /me/badges` (fin del polling) | Transversal | — | especificada | — | §11 |
| **V3-112** | UI de búsqueda global (feature `globalSearch`) | Transversal | Básico+ | especificada | — | §11 |
| **V3-113** | Completar delivery / pedidos | Sugerida | Pro | idea | V3-013 | §9 |
| **V3-114** | Destinatarios múltiples por negocio (`BusinessContact`) | Mensajería | Pro | idea | V3-110 | §9 |
| **V3-115** | Modo imagen: mosaicos de productos por WhatsApp | Mensajería | Pro | especificada | V3-110 | §9 |

---

<a name="3-transversales"></a>
## 3. Cambios transversales — tier Enterprise (V3-000)

Pre-requisito de varias áreas. **Gating mixto** acordado:

| Área / nivel | Tier |
|---|---|
| Descuentos, ofertas y mensajería | **Pro** |
| Flujo de caja — nivel 1 (movimientos, ajustes, transferencias, flujo por período) | **Pro** |
| Flujo de caja — nivel 2 (AR/AP, proyección, conciliación, multi-caja, estado de flujo) | **Enterprise** |
| Clientes y fidelización (CRM) | **Enterprise** |
| Nóminas y compensación | **Enterprise** |

> **Regla de herencia:** **Enterprise incluye TODO lo de Pro** + sus extras. Cualquier
> chequeo `isProPlan()` debe devolver `true` también para Enterprise.

### Backend
- `Plan.type` admite el valor `'enterprise'` (hoy: `free | basic | pro`). Mapeo comercial: `enterprise` ↔ nombre "Enterprise".
- Límites por plan (configurables): Enterprise ≥ Pro en `maxBusinesses`, `maxProducts`, equipo, etc. Propuesta inicial: `maxBusinesses: 5+`, `maxProducts: ilimitado o alto`.
- `GET /auth/me` → `plan.type` puede ser `'enterprise'`; mantener `expiredPlan`, `hasNeverHadPlan`.
- Enforcement: las features Enterprise rechazan con `403 ENTERPRISE_REQUIRED` si el plan no es Enterprise; las Pro siguen con `403 PRO_REQUIRED` (Enterprise pasa el gate Pro).

### Frontend
- Extender [src/lib/pro-gates.ts](../../src/lib/pro-gates.ts):
  - `isEnterprisePlan(plan): boolean`.
  - `isProPlan(plan)` → `true` para `pro` **y** `enterprise` (herencia).
  - `ENTERPRISE_ROUTES` análogo a `PRO_ROUTES`.
- Componente `<EnterpriseBadge>` análogo a `<ProBadge>` (ver [docs/extra/pro-gating.md](../extra/pro-gating.md)).
- Guard de ruta: las páginas Enterprise usan el mismo patrón que las Pro (`RouteGuard`/`PlanGuard`) verificando `isEnterprisePlan`.

### Referencia (no se ejecuta en v3, solo se anota)
- Landing y [docs/análisis-planes/comparativa-planes.md](../análisis-planes/comparativa-planes.md): añadir columna **Enterprise**.

### Mapa de dependencias entre áreas
- `Sale.customerId` (V3-001) → alimenta segmentación (V3-003), fidelización (V3-005) y "compradores recurrentes".
- Descuentos/ofertas (V3-010..014) → impactan rentabilidad (analytics) y eventos de caja.
- Pago de nómina (V3-024) → genera un movimiento de caja `payroll` (V3-031/§7).
- AR (V3-034) ← se alimenta de `Sale.paymentStatus = pending | partially_paid` (ya existente).

### Orden sugerido cuando se priorice (sin fecha)
**Caja N1 → Descuentos → CRM → Nóminas → Caja N2.** Justificación: caja N1 continúa una Fase 2 ya bosquejada (bajo riesgo, base financiera); descuentos toca el flujo de ventas que ya usan los Pro; CRM y nóminas son Enterprise y dependen de entidades nuevas; caja N2 (AR/AP, conciliación) corona el bloque financiero.

> **Nota (2026-08-17):** el enforcement server-side que este V3-000 exige se materializa
> como ítem propio **V3-106** (Fase 0 del plan de implementación, §11). El orden
> operativo vigente es el de §11, que antepone cimientos de robustez y offline a este
> orden por áreas (el orden relativo entre áreas se mantiene).

---

<a name="4-crm"></a>
## 4. Área 1 — Clientes y fidelización (CRM) · *Enterprise*

> IDs: V3-001..005. Reutiliza el patrón de `Provider`
> ([src/lib/types/provider.ts](../../src/lib/types/provider.ts), `src/components/business-providers/`),
> los canales de `BusinessSettings` ([docs/API.md](../API.md)) y las notificaciones in-app
> ([src/lib/types/notification.ts](../../src/lib/types/notification.ts)).

### 4.1 Valor y funcionalidades
- **Registro de clientes (V3-001):** CRUD con datos de contacto y consentimiento por canal.
- **Lead capture (V3-002):** suscripción a novedades del negocio (origen: venta, manual, portal público — ver V3-090).
- **Segmentos (V3-003):** automáticos (recurrentes, inactivos, alto ticket) y manuales (etiquetas).
- **Campañas (V3-004):** envíos a un segmento por Email, WhatsApp o in-app, con métricas.
- **Fidelización (V3-005):** puntos/nivel por compras; base para cupones dirigidos (Área 2).
- **Vínculo venta↔cliente:** historial de compras, LTV, frecuencia, ticket medio.

### 4.2 Backend — entidades / migraciones

**`Customer`**
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `businessId` | string (FK → Business) | |
| `name` | string (requerido) | |
| `phone` | string \| null | usado para WhatsApp |
| `email` | string \| null | usado para Email |
| `tags` | string[] | etiquetas manuales |
| `optInEmail` | boolean (default false) | consentimiento |
| `optInWhatsapp` | boolean (default false) | consentimiento |
| `optInInApp` | boolean (default true) | |
| `source` | enum(`sale`,`manual`,`portal`) | origen del lead |
| `notes` | string \| null | |
| `createdAt` / `updatedAt` | datetime | |

**`CustomerSegment`** — definición de filtros guardados.
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `businessId` | string (FK) | |
| `name` | string | |
| `type` | enum(`auto`,`manual`) | |
| `rules` | jsonb | p.ej. `{ minPurchases, lastPurchaseBeforeDays, minTotalSpent, tags[] }` |
| `createdAt` | datetime | |

**`Campaign`**
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `businessId` | string (FK) | |
| `channel` | enum(`email`,`whatsapp`,`in_app`) | |
| `segmentId` | string \| null (FK → CustomerSegment) | null = todos |
| `subject` | string \| null | para email |
| `body` | text | soporta variables `{{name}}` |
| `status` | enum(`draft`,`queued`,`sending`,`sent`,`failed`) | |
| `stats` | jsonb | `{ recipients, sent, failed }` |
| `scheduledAt` | datetime \| null | |
| `createdAt` | datetime | |

**`CustomerLoyalty`**
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `customerId` | string (FK → Customer, unique) | |
| `points` | integer (default 0) | |
| `tier` | enum(`bronze`,`silver`,`gold`) | derivado de puntos |
| `updatedAt` | datetime | |

**Modificación a `Sale`:** añadir `customerId: string | null` (FK → Customer, nullable).

### 4.3 Backend — endpoints

**`GET /customers/business/{businessId}`** — lista paginada con filtros.
Query: `?page=1&limit=20&search=&segmentId=&tag=`
```jsonc
{
  "data": [
    {
      "id": "uuid", "businessId": "uuid", "name": "Ana Pérez",
      "phone": "+53...", "email": "ana@x.com", "tags": ["vip"],
      "optInEmail": true, "optInWhatsapp": true, "optInInApp": true,
      "source": "sale",
      "stats": { "totalSpent": 4200.00, "purchaseCount": 12, "avgTicket": 350.00, "lastPurchaseAt": "2026-06-10T00:00:00Z" },
      "loyalty": { "points": 420, "tier": "silver" },
      "createdAt": "ISO", "updatedAt": "ISO"
    }
  ],
  "meta": { "total": 0, "page": 1, "limit": 20, "totalPages": 0 }
}
```

**`POST /customers`** — crear.
```jsonc
// body
{ "businessId": "uuid", "name": "str", "phone": "str?", "email": "str?",
  "tags": ["str"], "optInEmail": false, "optInWhatsapp": false, "source": "manual", "notes": "str?" }
```
`201` → objeto `Customer`. `409` si ya existe (mismo phone/email en el negocio).

**`PUT /customers/{customerId}`** — actualizar (campos opcionales). `200` → objeto.
**`DELETE /customers/{customerId}`** — `200 { "message": "Cliente eliminado" }`. Las ventas conservan `customerId` o se ponen a `null` (no borrar ventas).

**`GET /customers/{customerId}/purchases`** — historial + métricas.
```jsonc
{
  "customer": { "id": "uuid", "name": "str" },
  "stats": { "totalSpent": 4200.00, "purchaseCount": 12, "avgTicket": 350.00, "firstPurchaseAt": "ISO", "lastPurchaseAt": "ISO" },
  "data": [ { "saleId": "uuid", "date": "ISO", "total": 350.00, "currency": "CUP", "itemsCount": 3 } ],
  "meta": { "total": 12, "page": 1, "limit": 20, "totalPages": 1 }
}
```

**Segmentos:** `GET /customer-segments/business/{businessId}`, `POST /customer-segments`, `PUT /customer-segments/{id}`, `DELETE /customer-segments/{id}`.
**`GET /customer-segments/{id}/preview`** → `{ "count": 37, "sample": [ { "id", "name" } ] }` (cuántos clientes caen en el segmento).

**Campañas:** `GET /campaigns/business/{businessId}`, `POST /campaigns`, `PUT /campaigns/{id}` (solo en `draft`), `DELETE /campaigns/{id}`.
**`POST /campaigns/{campaignId}/send`** — encola el envío. **Transaccional + idempotente** (reenvío del mismo request no duplica).
```jsonc
// response 202
{ "message": "Campaña en cola", "data": { "id": "uuid", "status": "queued", "recipients": 37 } }
```
- Email/WhatsApp se entregan vía proveedor externo (contrato de payload: `{ to, channel, subject?, body }`, estados de entrega `queued → sent → failed`). in-app crea una notificación por cliente (reusa `notification.ts`).
- Respetar `optIn*`: excluir destinatarios sin consentimiento del canal.

### 4.4 Backend — enforcement y errores
- Todo el módulo CRM exige plan **Enterprise** → `403 ENTERPRISE_REQUIRED`.
- Validar consentimiento por canal antes de enviar; si un cliente no tiene contacto para el canal, contar como `skipped` (no `failed`).
- Códigos: `ENTERPRISE_REQUIRED`, `CUSTOMER_DUPLICATE`, `SEGMENT_INVALID_RULES`, `CAMPAIGN_NOT_DRAFT`, `CHANNEL_NOT_ALLOWED`.

### 4.5 Frontend
**Tipos** `src/lib/types/customer.ts`
```typescript
export type CustomerSource = "sale" | "manual" | "portal";
export interface CustomerStats {
  totalSpent: number; purchaseCount: number; avgTicket: number;
  firstPurchaseAt?: string; lastPurchaseAt?: string;
}
export interface CustomerLoyalty { points: number; tier: "bronze" | "silver" | "gold"; }
export interface Customer {
  id: string; businessId: string; name: string;
  phone: string | null; email: string | null; tags: string[];
  optInEmail: boolean; optInWhatsapp: boolean; optInInApp: boolean;
  source: CustomerSource; notes: string | null;
  stats?: CustomerStats; loyalty?: CustomerLoyalty;
  createdAt: string; updatedAt: string;
}
export interface CustomerSegment {
  id: string; businessId: string; name: string; type: "auto" | "manual";
  rules: { minPurchases?: number; lastPurchaseBeforeDays?: number; minTotalSpent?: number; tags?: string[] };
  createdAt: string;
}
export type CampaignChannel = "email" | "whatsapp" | "in_app";
export interface Campaign {
  id: string; businessId: string; channel: CampaignChannel;
  segmentId: string | null; subject: string | null; body: string;
  status: "draft" | "queued" | "sending" | "sent" | "failed";
  stats: { recipients: number; sent: number; failed: number };
  scheduledAt: string | null; createdAt: string;
}
```

**Rutas** `src/lib/routes/customers.ts` — `list/create/update/delete`, `purchases`, segmentos, campañas (`send`).
**API** `src/lib/api/customers.ts` + `src/lib/api/campaigns.ts`.
**Validaciones** `src/lib/validations/customers.ts` (Zod): nombre ≥ 2, email válido si presente, al menos un contacto si `optIn` de ese canal.
**Hooks** `src/hooks/use-customers.ts`, `use-customer-segments.ts`, `use-campaigns.ts` (React Query; invalidaciones tras mutaciones).

**Componentes** `src/components/customers/`
- `customers-table.tsx` (patrón de `business-providers`): nombre, contacto, tags, recurrencia, LTV, acciones.
- `customer-form.tsx`: datos + switches de opt-in por canal.
- `customer-details-dialog.tsx`: ficha + historial de compras (`/purchases`) + LTV + tier de fidelidad.
- `segment-builder.tsx`: constructor de reglas con preview de conteo (`/preview`).
- `campaign-composer.tsx`: selector de canal y segmento, editor con variables `{{name}}`, **preview por canal** (email/whatsapp/in-app) y resumen de destinatarios.

**Páginas** `src/app/dashboard/business/customers/` → lista, `create`, `[customerId]`, `campaigns`. Gating Enterprise.
**Integración en ventas:** combobox "Cliente (opcional)" en el formulario de venta para asociar `customerId` (crea cliente al vuelo desde el teléfono si no existe → fuente `sale`).

### 4.6 Criterios de aceptación
- Crear/editar/eliminar clientes; asociar cliente a una venta; ver historial y LTV.
- Crear un segmento automático y ver cuántos clientes caen en él.
- Crear y enviar una campaña por cada canal; los sin opt-in quedan excluidos; estados de envío visibles.
- Todo el módulo bloqueado para planes < Enterprise (FE oculta + BE rechaza).

### 4.7 Contratos que el FE consume (CRM)
| Contrato | Dónde lo usa el FE |
|---|---|
| `GET/POST/PUT/DELETE /customers...` | `src/lib/api/customers.ts` |
| `GET /customers/{id}/purchases` | `customer-details-dialog.tsx` |
| `customer-segments` + `/preview` | `segment-builder.tsx` |
| `campaigns` + `POST /campaigns/{id}/send` | `campaign-composer.tsx` |
| `Sale.customerId` | formulario de venta, `src/lib/types/sales.ts` |

---

<a name="5-descuentos"></a>
## 5. Área 2 — Descuentos, ofertas y mensajería · *Pro*

> IDs: V3-010..014. Extiende el flujo de ventas existente
> (`src/lib/types/sales.ts`, `src/components/sales/`, carrito de venta) y reutiliza
> `saleType`/`deliveryAddress` ya presentes.

### 5.1 Valor y funcionalidades
- **Descuentos (V3-010):** por línea y por venta, en % o monto fijo, con motivo.
- **Promociones (V3-011):** precio rebajado por rango de fechas; descuento por volumen/umbral de monto; "compra X lleva Y"; envío gratis por umbral.
- **Cupones (V3-012):** código, %/fijo, límite de uso, vigencia, dirigibles a un segmento del CRM.
- **Mensajería/envío (V3-013):** método y costo de envío; **envío gratis** automático sobre un umbral.
- **Cálculo previo (V3-014):** `POST /sales/quote` para que FE y BE coincidan en los totales antes de confirmar.

### 5.2 Backend — entidades / campos

**`Promotion`**
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `businessId` | string (FK) | |
| `name` | string | |
| `type` | enum(`percentage`,`fixed`,`volume`,`buy_x_get_y`,`free_shipping_threshold`) | |
| `config` | jsonb | según tipo: `{ percent }` / `{ amount }` / `{ minQty, percent }` / `{ buyQty, getQty, productId }` / `{ minTotal }` |
| `scope` | enum(`product`,`category`,`order`) | a qué aplica |
| `productId` / `category` | string \| null | si scope lo requiere |
| `startsAt` / `endsAt` | datetime \| null | vigencia |
| `active` | boolean (default true) | |

**`Coupon`**
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `businessId` | string (FK) | |
| `code` | string (único por negocio) | |
| `discountType` | enum(`percentage`,`fixed`) | |
| `value` | decimal | |
| `maxUses` | integer \| null | |
| `usedCount` | integer (default 0) | |
| `segmentId` | string \| null (FK → CustomerSegment) | dirigible |
| `startsAt` / `endsAt` | datetime \| null | |
| `active` | boolean | |

**`ShippingRule`**
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `businessId` | string (FK) | |
| `name` | string | p.ej. "Reparto ciudad" |
| `cost` | decimal | |
| `currency` | string | |
| `freeOverAmount` | decimal \| null | envío gratis si subtotal ≥ |
| `zone` | string \| null | base para V3-095 (zonas) |
| `active` | boolean | |

**Campos nuevos en `Sale`:** `discountAmount`, `discountReason`, `shippingCost`, `couponId` (FK\|null), `promotionIds` (string[]).
**Campos nuevos en `SaleItem`:** `discountAmount`, `discountReason`.

### 5.3 Backend — endpoints
- CRUD de `Promotion`, `Coupon`, `ShippingRule` (patrón `GET .../business/{businessId}`, `POST`, `PUT/{id}`, `DELETE/{id}`).
- **`POST /coupons/validate`** → `{ valid, discountType, value, reason? }` (verifica código, vigencia, usos, segmento del cliente).

**`POST /sales/quote`** — calcula totales **sin crear la venta** (autoridad del cálculo).
```jsonc
// body
{
  "businessId": "uuid",
  "currency": "CUP",
  "customerId": "uuid?",
  "items": [ { "businessProductId": "uuid", "quantity": 3, "discount": { "type": "percentage", "value": 10, "reason": "str?" } } ],
  "couponCode": "VERANO10?",
  "shippingRuleId": "uuid?",
  "saleType": "delivery"
}
```
```jsonc
// response 200
{
  "currency": "CUP",
  "lines": [ { "businessProductId": "uuid", "quantity": 3, "unitPrice": 100, "lineSubtotal": 300, "lineDiscount": 30, "lineTotal": 270, "appliedPromotions": ["uuid"] } ],
  "subtotal": 300.00,
  "discountTotal": 30.00,
  "appliedPromotions": [ { "id": "uuid", "name": "10% volumen", "amount": 30.00 } ],
  "coupon": { "id": "uuid", "code": "VERANO10", "amount": 24.00 },
  "shipping": { "ruleId": "uuid", "cost": 0.00, "free": true, "freeReason": "minTotal" },
  "total": 246.00
}
```

**`POST /sales`** (existente) — acepta los mismos campos de descuento/cupón/envío; **recalcula server-side** (no confía en el FE) y persiste `discountAmount`, `shippingCost`, `couponId`, `promotionIds`. Aplica promociones automáticas vigentes. Incrementa `Coupon.usedCount`.

### 5.4 Reglas de cálculo (orden de aplicación)
1. **Descuento por línea** (manual o promo de producto/categoría).
2. **Promociones automáticas de orden** (volumen, X×Y) sobre el subtotal.
3. **Cupón** sobre el subtotal ya descontado.
4. **Envío:** `shippingCost`, puesto a 0 si `subtotal ≥ freeOverAmount` o aplica promo `free_shipping_threshold`.
- Redondeo a 2 decimales por paso; cálculos en la moneda de la venta (multimoneda con `getCurrencyRate`).
- Las ventas con descuento reflejan el efecto en **rentabilidad** (analytics) y generan el **evento de caja** por el total neto.
- Enforcement **Pro** (`403 PRO_REQUIRED`; Enterprise pasa). Cupón inválido → `422 COUPON_INVALID`.

### 5.5 Frontend
**Tipos** — ampliar `src/lib/types/sales.ts` (`Sale`/`SaleItem` con `discountAmount`, `discountReason`, `shippingCost`, `couponId`, `promotionIds`) + nuevos `src/lib/types/promotion.ts`, `coupon.ts`, `shipping-rule.ts`, y `SaleQuoteResponse`.
**Rutas/API/Validaciones** por dominio (`promotions`, `coupons`, `shipping-rules`, `sales` ampliado con `quote`).
**Hooks** `use-promotions.ts`, `use-coupons.ts`, `use-shipping-rules.ts`, y `useSaleQuote()` (mutación que recalcula al cambiar el carrito).
**UI en el carrito de venta** (`src/components/sales/`): campo de descuento por línea y por venta, aplicador de cupón (con feedback de validez), badge de promoción aplicada, y **resumen** `subtotal / descuento / envío / total` alimentado por `/sales/quote`.
**Config** `src/app/dashboard/business/promotions/`, `.../coupons/`, `.../shipping/` (listas + CRUD). Gating Pro.

### 5.6 Criterios de aceptación
- Aplicar descuento por línea y por venta; ver el total recalculado por `/sales/quote` antes de confirmar.
- Crear una promoción por volumen y una de envío gratis por umbral; se aplican solas en la venta.
- Validar y consumir un cupón (respeta vigencia, usos y segmento).
- El backend recalcula y la venta persiste descuentos/envío; la factura PDF los muestra.
- El total del FE coincide siempre con el del backend (misma fuente: `/sales/quote`).

### 5.7 Contratos que el FE consume (Descuentos)
| Contrato | Dónde lo usa el FE |
|---|---|
| `POST /sales/quote` | carrito de venta (`useSaleQuote`) |
| `POST /coupons/validate` | aplicador de cupón |
| CRUD `promotions/coupons/shipping-rules` | secciones de config + `use-*` |
| Campos de descuento/envío en `Sale`/`SaleItem` | `src/lib/types/sales.ts`, `details-dialog`, factura |

---

<a name="6-nominas"></a>
## 6. Área 3 — Nóminas y compensación · *Enterprise*

> IDs: V3-020..024. Extiende `Worker` ([src/lib/types/worker.ts](../../src/lib/types/worker.ts),
> `src/components/workers/`) y reutiliza `WorkerSalesItem` + `/analytics/sales-by-worker/{businessId}`
> como fuente de comisiones. El pago integra con el flujo de caja (§7).

### 6.1 Valor y funcionalidades
- **Compensación por trabajador (V3-020):** salario base + esquema de comisión (% sobre ventas o sobre utilidad) + metas.
- **Comisiones automáticas (V3-021):** calculadas cruzando las ventas del período por trabajador.
- **Estímulos/bonos y deducciones (V3-022):** ajustes manuales por corrida.
- **Corridas de nómina (V3-023):** por período, con recibo/payslip PDF por trabajador y total.
- **Pago (V3-024):** marca la corrida como pagada y **emite un movimiento de caja `payroll`** (§7).

### 6.2 Backend — entidades
**`CompensationPlan`**
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `workerId` | string (FK → Worker, unique activo) | |
| `businessId` | string (FK) | |
| `baseSalary` | decimal (default 0) | por período |
| `currency` | string | |
| `commissionType` | enum(`none`,`pct_sales`,`pct_profit`) | |
| `commissionRate` | decimal (default 0) | % |
| `goal` | decimal \| null | meta de ventas del período |
| `active` | boolean | |

**`PayrollRun`**
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `businessId` | string (FK) | |
| `periodStart` / `periodEnd` | date | |
| `status` | enum(`draft`,`confirmed`,`paid`) | |
| `currency` | string | |
| `totals` | jsonb | `{ base, commission, bonus, deduction, net }` |
| `createdAt` | datetime | |

**`PayrollItem`** (por trabajador en una corrida)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `payrollRunId` | string (FK) | |
| `workerId` | string (FK) | |
| `baseSalary` | decimal | |
| `commission` | decimal | calculada |
| `bonusTotal` | decimal | |
| `deductionTotal` | decimal | |
| `net` | decimal | `base + commission + bonus − deduction` |
| `salesBase` | decimal | ventas/utilidad usadas para la comisión |

**`Bonus`** / **`Deduction`** — `{ id, payrollItemId, concept, amount }`.

### 6.3 Backend — endpoints
- CRUD `CompensationPlan` (`GET .../worker/{workerId}`, `POST`, `PUT/{id}`).
- **`GET /payroll/preview/{businessId}?periodStart=&periodEnd=`** — calcula la corrida **sin persistir**, cruzando ventas no canceladas del período por `createdBy` (reusa la lógica de `sales-by-worker`):
```jsonc
{
  "periodStart": "2026-06-01", "periodEnd": "2026-06-30", "currency": "CUP",
  "items": [ { "workerId": "uuid", "workerName": "str", "baseSalary": 8000, "salesBase": 50000, "commission": 2500, "bonusTotal": 0, "deductionTotal": 0, "net": 10500 } ],
  "totals": { "base": 8000, "commission": 2500, "bonus": 0, "deduction": 0, "net": 10500 }
}
```
- **`POST /payroll/runs`** — confirma una corrida (persiste `PayrollRun` + `PayrollItem` con los bonos/deducciones enviados). Estado `confirmed`.
- **`POST /payroll/runs/{id}/pay`** — marca `paid` y **emite un movimiento de caja** tipo `payroll` (operación `subtract`) por el neto total, en la moneda/cuenta indicada (integra con §7). Transaccional.
- **`GET /payroll/runs/business/{businessId}`** (lista) · **`GET /payroll/runs/{id}`** (detalle) · **`GET /payroll/runs/{id}/payslip/{workerId}`** → PDF (blob), patrón de export de `accounting-close`.

### 6.4 Reglas y enforcement
- Comisión `pct_sales` = `salesBase × rate`; `pct_profit` = `(revenue − cost) × rate` (usar `entryPrice` como en rentabilidad). Excluir ventas canceladas.
- Multimoneda: la corrida fija una `currency`; las ventas en otra moneda se convierten con `getCurrencyRate`.
- Enforcement **Enterprise** (`403 ENTERPRISE_REQUIRED`). No permitir `pay` sobre corrida no `confirmed`. Códigos: `PAYROLL_NOT_CONFIRMED`, `PERIOD_OVERLAP`.

### 6.5 Frontend
**Tipos** `src/lib/types/payroll.ts` (`CompensationPlan`, `PayrollRun`, `PayrollItem`, `Bonus`, `Deduction`, `PayrollPreview`).
**Rutas/API/Validaciones/Hooks:** `use-compensation.ts`, `use-payroll.ts` (`usePayrollPreview`, `useConfirmRun`, `usePayRun`).
**UI:**
- Sección de **compensación** en el detalle del worker (`src/components/workers/`): salario base, tipo/tasa de comisión, meta.
- Página `src/app/dashboard/business/payroll/`: selector de período → previsualización (`/preview`) → ajustar bonos/deducciones por trabajador → **confirmar corrida** → **registrar pago** → ver recibos (PDF) y exportar.
- Gating Enterprise.

### 6.6 Criterios de aceptación
- Configurar compensación de un trabajador; previsualizar la nómina del mes con comisiones reales.
- Añadir un bono y una deducción; el neto se recalcula.
- Confirmar y pagar una corrida; aparece un movimiento de caja `payroll` por el neto (§7).
- Descargar el recibo PDF de un trabajador. Módulo bloqueado para < Enterprise.

### 6.7 Contratos que el FE consume (Nóminas)
| Contrato | Dónde lo usa el FE |
|---|---|
| CRUD `CompensationPlan` | sección de compensación del worker |
| `GET /payroll/preview/{businessId}` | página de nómina (preview) |
| `POST /payroll/runs` + `/pay` | confirmar y pagar corrida |
| `GET /payroll/runs/{id}/payslip/{workerId}` (PDF) | descarga de recibo |
| Movimiento de caja `payroll` | §7 (`CashMovement.type`) |

---

<a name="7-caja"></a>
## 7. Área 4 — Flujo de caja profesional · *Pro (N1) / Enterprise (N2)*

> IDs: V3-030..038. Formaliza y amplía la Fase 2 de [docs/flujo-de-caja.md](../flujo-de-caja.md).
> Reutiliza `consolidateBalances` ([src/lib/cash-flow.ts](../../src/lib/cash-flow.ts)),
> `getCurrencyRate` ([src/lib/currency.ts](../../src/lib/currency.ts)) y el módulo `currency-account`.

### 7.1 Funcionalidades por nivel
**Nivel 1 — Pro**
- **Libro de movimientos (V3-030):** por moneda, con **saldo corriente** (`balanceAfter`). Pestaña "Movimientos" ya reservada en la página de `currency-accounts`.
- **Ajustes manuales (V3-031):** depósito/retiro.
- **Transferencias entre monedas (V3-032).**
- **Flujo por período (V3-033):** entradas vs salidas reales en un rango (base caja).

**Nivel 2 — Enterprise**
- **AR/AP (V3-034):** cuentas por cobrar (de `Sale.paymentStatus = pending/partially_paid`) y por pagar (compras a proveedores).
- **Proyección de cobros/pagos (V3-035).**
- **Conciliación (V3-036):** marcar movimientos como conciliados contra extracto.
- **Múltiples cajas/cuentas (V3-037):** caja chica vs banco.
- **Estado de flujo de caja exportable (V3-038).**
- **Resumen mensual + salud del negocio (V3-039):** serie multi-mes comparable + semáforo de salud (ver §7.9).

### 7.2 Backend — entidades / campos
**`CashMovement`** (registro persistente; hoy el saldo se recalcula por eventos sin listado)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `businessId` | string (FK) | |
| `cashAccountId` | string \| null (FK → CashAccount) | N2; null = cuenta por defecto |
| `currency` | string | |
| `type` | enum(`sale`,`payment`,`expense`,`purchase`,`stock_purchase`,`sale_cancellation`,`adjustment`,`transfer_in`,`transfer_out`,`payroll`) | extiende tabla de eventos de flujo-de-caja.md |
| `operation` | enum(`add`,`subtract`) | |
| `amount` | decimal | |
| `balanceAfter` | decimal | saldo corriente |
| `reference` | string \| null | id/ref del documento origen |
| `reconciled` | boolean (default false) | N2 |
| `createdAt` | datetime | |

**`CashAdjustment`** — `{ id, businessId, cashAccountId?, currency, operation, amount, concept, createdBy, createdAt }`.
**`CashTransfer`** — `{ id, businessId, fromCurrency, toCurrency, fromAmount, toAmount, rate, createdAt }` (genera dos `CashMovement`: `transfer_out` + `transfer_in`).
**`CashAccount`** (N2) — `{ id, businessId, name, kind: enum('cash','bank'), currency?, createdAt }`.
**`Receivable`/`Payable`** (N2) — `{ id, businessId, party, reference, amount, currency, dueDate, status: enum('open','partial','settled') }`.
**`Reconciliation`** (N2) — `{ id, businessId, cashAccountId, statementDate, reconciledMovementIds[], createdAt }`.

### 7.3 Backend — endpoints
**N1**
- **`GET /currency-accounts/movements/{businessId}?currency=&page=&limit=&startDate=&endDate=`** (contrato ya propuesto en flujo-de-caja.md §3.1):
```jsonc
{
  "data": [ { "id": "uuid", "currency": "USD", "type": "sale", "operation": "add", "amount": 100.00, "balanceAfter": 600.00, "reference": "SALE-123", "reconciled": false, "createdAt": "ISO" } ],
  "meta": { "total": 0, "page": 1, "limit": 20, "totalPages": 0 }
}
```
- **`POST /currency-accounts/adjustments`** — depósito/retiro.
- **`POST /currency-accounts/transfers`** — transferencia entre monedas.
- **`GET /currency-accounts/cashflow/{businessId}?from=&to=&currency=`** — flujo por período:
```jsonc
{ "from": "ISO", "to": "ISO", "currency": "CUP",
  "inflow": 5000.00, "outflow": 3200.00, "net": 1800.00,
  "byType": [ { "type": "sale", "operation": "add", "amount": 4200.00 }, { "type": "expense", "operation": "subtract", "amount": 3200.00 } ] }
```

**N2**
- `GET /receivables/business/{businessId}` y `GET /payables/business/{businessId}` (con `status`, `dueDate`).
- `GET /cashflow/projection/{businessId}?days=30` — cobros/pagos esperados.
- `GET /cash-accounts/business/{businessId}` + CRUD (multi-caja).
- `POST /currency-accounts/reconcile` — marca movimientos conciliados.
- `GET /cashflow/statement/{businessId}?from=&to=` + export PDF/Excel (patrón `accounting-close`).

> **Integración clave:** ventas, pagos, gastos, compras, cancelaciones, **ajustes,
> transferencias y nómina (V3-024)** deben generar el `CashMovement` correspondiente.
> Esto extiende la tabla de eventos de [docs/flujo-de-caja.md](../flujo-de-caja.md) §1.

### 7.4 Enforcement y errores
- N1 → **Pro**; N2 → **Enterprise** (`403 PRO_REQUIRED` / `403 ENTERPRISE_REQUIRED`).
- Ajuste/transferencia validan saldo suficiente para retiros/salidas → `422 INSUFFICIENT_BALANCE`.
- Transferencia requiere tasa entre monedas → `422 RATE_REQUIRED`.

### 7.5 Frontend
**Tipos** `src/lib/types/cash.ts` (`CashMovement`, `CashAdjustment`, `CashTransfer`, `CashAccount`, `Receivable`, `Payable`, `CashFlowSummary`, `CashFlowProjection`, `Reconciliation`).
**Rutas/API/Validaciones/Hooks:** `use-cash-movements.ts`, `use-cash-adjustments.ts`, `use-cash-transfers.ts`, `use-receivables.ts`, `use-payables.ts`, `use-cashflow.ts`.
**UI** (en `src/app/dashboard/business/currency-accounts/` y `src/components/currency-account/`):
- **Pestaña "Movimientos"**: tabla con saldo corriente, filtros por moneda/fecha (N1).
- **Dialogs** de ajuste (depósito/retiro) y de transferencia entre monedas (N1).
- **Vista de flujo por período** (entradas/salidas, neto, desglose por tipo) (N1).
- **Tableros AR/AP** y **proyección** (N2, Enterprise).
- **Pantalla de conciliación** y selector de **caja/cuenta** (N2, Enterprise).
Reutiliza `consolidateBalances` y el export de `accounting-close`. Gating por nivel.

### 7.6 Criterios de aceptación
- Ver el libro de movimientos con saldo corriente por moneda; registrar un depósito y un retiro; hacer una transferencia entre monedas.
- Ver el flujo por período (entradas vs salidas, neto) en un rango.
- (N2) Ver AR/AP, proyección a 30 días, conciliar movimientos y exportar el estado de flujo.
- Una venta/gasto/pago/compra/nómina genera el movimiento correcto.
- N1 disponible para Pro; N2 solo Enterprise.

### 7.7 Contratos que el FE consume (Caja)
| Contrato | Dónde lo usa el FE |
|---|---|
| `GET /currency-accounts/movements/{id}` | pestaña "Movimientos" |
| `POST /currency-accounts/adjustments` · `/transfers` | dialogs de ajuste/transferencia |
| `GET /currency-accounts/cashflow/{id}` | vista de flujo por período |
| `receivables` / `payables` / `projection` | tableros AR/AP (N2) |
| `reconcile` · `cash-accounts` · `statement` | conciliación / multi-caja / export (N2) |

### 7.8 Evolución a largo plazo
Este módulo es el primer paso pragmático en **base caja**. Su evolución natural es el
**Núcleo Contable** de partida doble ([docs/extra/CONTABILIDAD_NUCLEO.md](../extra/CONTABILIDAD_NUCLEO.md)):
plan de cuentas, asientos automáticos y estados financieros formales. La v3 **no se
solapa** con ese núcleo; lo prepara.

### 7.9 Resumen mensual + salud del negocio (V3-039) · *Enterprise*

> Extiende `V3-033` (flujo de **un** período) y `V3-038` (export) con una **serie
> multi-mes comparable** y un **veredicto de salud**. Responde la pregunta del dueño:
> *"¿es rentable, está vivo a futuro o va por mal camino?"*. **Contrato backend completo:**
> [docs/v3/backend-flujo-caja-mensual.md](./backend-flujo-caja-mensual.md).

**Qué resuelve.** Una tabla/serie de meses (entradas, salidas, neto, saldo acumulado),
todo en moneda base (CUP), más un bloque de **salud** (semáforo verde/ámbar/rojo) con
tendencia del neto, meses en positivo/negativo, *runway* y margen base-caja. Exportable a
PDF y Excel.

**Backend (resumen).** La materia prima ya existe: el ledger de transacciones financieras
([src/lib/types/financial-transaction.ts](../../src/lib/types/financial-transaction.ts))
clasifica cada evento por tipo y lo convierte a CUP (`convertedAmount`) con `transactionDate`.
Endpoints nuevos:
- `GET /currency-accounts/cashflow/monthly/{businessId}?from=&to=&currency=` → `months[]` + `totals` + `health`.
- `GET .../cashflow/monthly/{businessId}/pdf` y `.../excel` → `Blob` (patrón `accounting-close`).

**Frontend (cuando se priorice).**
- Tipos `MonthlyCashflowResponse` / `MonthlyCashflowRow` / `CashHealth` en `src/lib/types/cash.ts`.
- Ruta/API + hook `useMonthlyCashflow()` en `src/hooks/use-cashflow.ts`.
- Vista en `src/app/dashboard/business/currency-accounts/`: gráfico de barras entrada/salida +
  línea de neto (Recharts, patrón de
  [src/components/analytics/sales-trend-chart.tsx](../../src/components/analytics/sales-trend-chart.tsx)),
  **tarjeta de semáforo** con las señales de `health`, y botones **Export PDF/Excel**
  (reutiliza `downloadBlob` de [src/lib/download.ts](../../src/lib/download.ts)).
- `currentCashBase` del bloque `health` se cruza con `consolidateBalances`
  ([src/lib/cash-flow.ts](../../src/lib/cash-flow.ts)) para el cálculo de *runway*.
- Gating Enterprise.

**Reglas del semáforo** (umbrales exactos en el contrato backend §5):
- 🟢 **Sano:** neto positivo en la mayoría de los últimos meses y tendencia ↑; sin *runway* en riesgo.
- 🟡 **Atención:** neto plano/declinante o meses mixtos; *runway* 3–6 meses.
- 🔴 **Riesgo:** racha de meses con neto negativo y tendencia ↓; *runway* < 3 meses.

#### 7.9.1 Contratos que el FE consume (V3-039)
| Contrato | Dónde lo usa el FE |
|---|---|
| `GET /currency-accounts/cashflow/monthly/{id}` | vista de resumen mensual + tarjeta de salud (`useMonthlyCashflow`) |
| `GET .../cashflow/monthly/{id}/pdf` | botón Export PDF |
| `GET .../cashflow/monthly/{id}/excel` | botón Export Excel |

---

<a name="8-resumenes"></a>
## 8. Área 5 — Resúmenes automáticos de negocio · *Base (canales SMS/WhatsApp = Pro)*

> IDs: V3-040..043. Activa de punta a punta los tipos de notificación
> `weekly_summary` y `monthly_summary`, que hoy están **modelados pero dormidos**.
> Reutiliza el motor de notificaciones existente
> (`psearch-back/src/v2/notifications/`), el cron de cierres
> (`psearch-back/src/v2/cron-closing/`) y la campana del frontend
> ([src/components/notifications/](../../src/components/notifications/)).

### 8.1 Contexto — por qué está dormido

El tipo de notificación existe en el enum del backend (`NotificationType`), en los
tipos del frontend ([src/lib/types/notification.ts](../../src/lib/types/notification.ts))
y en `BusinessSetting` (`weeklySummaryAlert`, `monthlySummaryAlert`), pero **nunca
llega al usuario**. Hay cuatro bloqueos encadenados; el primero ya se resolvió:

| # | Bloqueo | Estado |
|---|---|---|
| 1 | `buildSummary()` devolvía `revenue: 0` fijo (placeholder) | ✅ resuelto 2026-07-28 (V3-040) |
| 2 | Nada llama a `notificationService.create()` con estos tipos → no se inserta fila ni sale email/SMS/WhatsApp | ⬜ V3-041 |
| 3 | `DEFAULT_NOTIFICATION_TYPES` (backend) y `VISIBLE_NOTIFICATION_TYPES` (frontend) excluyen ambos tipos | ⬜ V3-042 |
| 4 | La tarjeta de ajustes no expone los toggles de canal de estos dos tipos | ⬜ V3-043 |

### 8.2 V3-040 — Cálculo de los resúmenes · **hecho (2026-07-28)**

Queda documentado aquí porque es la base de V3-041..043 y **ya está en `main`**.

`NotificationService.buildSummary(type, businessId)` calcula ingresos reales
delegando en `SaleService.getClosingByDateRange`, **la misma fuente que los cierres
contables**, para que resumen y cierre nunca discrepen: excluye ventas canceladas y
consolida las monedas a CUP con la tasa del negocio.

**Criterio de periodos** — se compara el tramo transcurrido contra el **mismo tramo**
del periodo anterior, de modo que el porcentaje sea justo aunque se pida a mitad de
periodo, y equivalga a "semana/mes completo vs anterior completo" si se pide al cierre:

| Tipo | Periodo actual | Comparación |
|---|---|---|
| `weekly_summary` | lunes de la semana en curso → hoy | mismo tramo de la semana anterior |
| `monthly_summary` | día 1 del mes en curso → hoy | mismo tramo del mes anterior (recortado si es más corto) |

Las fechas se delimitan con `APP_TIMEZONE` (`America/Havana`) igual que el cron de
cierres, y la aritmética de fechas va en UTC para que no la afecte el horario de verano.

**Endpoints (solo generan el contenido, no crean la notificación):**
`GET /api/v2/notifications/summaries/weekly?businessId=` y `.../monthly?businessId=`

```jsonc
// response 200
{
  "content": "Resumen semanal: Ingresos $12500.00 (+15.5% vs semana anterior).",
  "revenue": 12500,
  "previousRevenue": 10822.51,
  "revenueChange": 15.5,
  "period":         { "start": "2026-07-27", "end": "2026-07-28" },
  "previousPeriod": { "start": "2026-07-20", "end": "2026-07-21" }
}
```

Sin base de comparación (periodo anterior en 0) se reporta `+100%` si hubo ingresos y
`0%` si tampoco los hubo, para no devolver `Infinity`/`NaN`.

**Archivos:** `psearch-back/src/v2/notifications/summary-period.util.ts` (+ `.spec.ts`,
lógica pura de periodos), `notification.service.ts` (`buildSummary`),
`notifications.module.ts` (importa `SaleModule`), `notification.controller.ts`.

> ⚠️ **Coste a vigilar en V3-041:** `getClosingByDateRange` carga ventas con items y
> productos, gastos y snapshot de tasas, y `buildSummary` lo llama **dos veces**
> (periodo actual + anterior). Es el mismo coste que el endpoint de cierre mensual,
> pero al meterlo en un cron que recorre **todos** los negocios hay que medirlo y, si
> hace falta, añadir un método ligero en `SaleService` que solo agregue `totalIncome`
> sin materializar ventas ni items.

### 8.3 V3-041 — Disparador automático (cron + idempotencia)

Replica el patrón ya probado de `daily_closing` / `monthly_closing`
([cron-closing.service.ts](../../../psearch-back/src/v2/cron-closing/cron-closing.service.ts)).

**Backend — migración sobre `BusinessSetting`** (tabla `business_settings`), análoga a
`lastDailyClosingSentAt` / `lastMonthlyClosingSentAt`:

| Campo | Tipo | Notas |
|---|---|---|
| `lastWeeklySummarySentAt` | datetime \| null | idempotencia semanal |
| `lastMonthlySummarySentAt` | datetime \| null | idempotencia mensual |

**Backend — servicio.** En `BusinessSettingService`, siguiendo los existentes:
- `findBusinessesWithWeeklySummaryAlert()` / `findBusinessesWithMonthlySummaryAlert()` — negocios con el canal configurado.
- `markWeeklySummarySent(settingId, when)` / `markMonthlySummarySent(settingId, when)`.

**Backend — lógica de "toca enviar".** Añadir a
[closing-schedule.util.ts](../../../psearch-back/src/v2/cron-closing/closing-schedule.util.ts)
(funciones puras, con spec, igual que `isDailyClosingDue`):

```ts
isWeeklySummaryDue({ dayOfWeek, minutesOfDay, closeMinutes, weekStr, lastSentWeekStr })
// dispara el ÚLTIMO día de la semana (domingo, dayOfWeek === 0) pasada la hora de
// cierre del negocio, una sola vez por semana ISO.

isMonthlySummaryDue({ isLastDayOfMonth, minutesOfDay, closeMinutes, monthStr, lastSentMonthStr })
// mismo criterio que isMonthlyClosingDue.
```

`getLocalTimeParts` debe devolver además `weekStr` (año-semana ISO, p. ej. `2026-W31`)
para la clave de idempotencia semanal.

**Backend — proceso.** En `CronClosingService`, dos métodos nuevos que reutilizan
`resolveCloseMinutesForToday` y el mismo bloque `processed/skipped/failed/errors`:

```ts
processWeeklySummary(token?)  // → { processed, skipped, failed, errors }
processMonthlySummary(token?)
```

Cada uno llama a `notificationService.buildSummary(...)` y luego:

```ts
await this.notificationService.create({
  businessId,
  type: "weekly_summary",
  metadata: {
    revenue, previousRevenue, revenueChange,
    periodStart: period.start, periodEnd: period.end,
  },
});
```

`create()` ya inserta la fila `in_app` y entrega por los canales configurados en
`weeklySummaryAlert` / `monthlySummaryAlert` (el mapeo `resolveChannels` ya existe).

**Backend — endpoints de cron.** En `CronClosingController`, junto a los actuales, con
el mismo `CRON_CLOSING_TOKEN`:
- `POST /api/v2/cron/weekly-summary`
- `POST /api/v2/cron/monthly-summary`

**Programación recomendada:** cada hora, como los cierres. La combinación de
"último día del periodo + pasada la hora de cierre + no enviado aún" hace que solo
dispare una vez.

> **Decisión pendiente de confirmar:** el mensual de `monthly_summary` (ingresos vs mes
> anterior) y el `monthly_closing` (cierre contable del mes) se dispararían el mismo día
> a la misma hora. Opciones: (a) mantener ambos, son mensajes distintos; (b) fusionar el
> resumen dentro del cierre mensual. Recomendación: **(a)**, porque el cierre es
> contable y el resumen es comparativo, pero conviene validarlo con negocio antes de
> implementar.

### 8.4 V3-042 — Visibilidad en la UI de notificaciones

**Backend.** Añadir ambos tipos a `DEFAULT_NOTIFICATION_TYPES` en
[notification.controller.ts](../../../psearch-back/src/v2/notifications/notification.controller.ts)
para que `GET /notifications` los devuelva sin necesidad de pasar `?type=`.

**Frontend.** Añadir `"weekly_summary"` y `"monthly_summary"` a
`VISIBLE_NOTIFICATION_TYPES` en
[notification-type-meta.ts](../../src/components/notifications/notification-type-meta.ts).
**No hace falta nada más de presentación**: el meta de ambos tipos ya está definido y se
renderizarían con el `NotificationItem` estándar (icono + label + `content` + tiempo
relativo, fondo `bg-primary/5` y punto azul mientras no estén leídas):

| Tipo | Label | Icono | Severidad | Deep-link |
|---|---|---|---|---|
| `weekly_summary` | Resumen semanal | `CalendarRange` | `info` (icono gris) | `/dashboard/analytics` |
| `monthly_summary` | Resumen mensual | `CalendarCheck` | `info` (icono gris) | `/dashboard/accounting-close/monthly` |

**Mejora opcional (a decidir).** Como estas notificaciones son informativas y no
accionables, considerar un contador aparte o excluirlas del badge de "no leídas" para
que no compitan con las alertas de stock, que sí requieren acción.

### 8.5 V3-043 — Toggles de canal en Ajustes del negocio

En [notification-settings-card.tsx](../../src/components/business/notification-settings-card.tsx),
añadir una categoría nueva junto a "Cierres" e "Inventario":

```ts
// NotificationKey
| "weeklySummary" | "monthlySummary"

// FIELD_BY_KEY
weeklySummary:  "weeklySummaryAlert",
monthlySummary: "monthlySummaryAlert",

// CATEGORIES
{
  title: "Resúmenes",
  items: [
    { key: "weeklySummary",  label: "Resumen semanal",
      description: "Ingresos de la semana y variación frente a la anterior." },
    { key: "monthlySummary", label: "Resumen mensual",
      description: "Ingresos del mes y variación frente al anterior." },
  ],
}
```

Hay que añadir las dos claves también a `EMPTY_MATRIX`. El gating **por canal** ya
existe y se hereda solo: correo libre, SMS y WhatsApp con `<ProBadge>` (y WhatsApp
sigue en `comingSoon`). El tipo de alerta en sí no se gatea, igual que los cierres.

### 8.6 Criterios de aceptación

- Un negocio con `weeklySummaryAlert: ["email"]` recibe **una sola** notificación el domingo tras su hora de cierre, con ingresos reales y el % correcto frente a la semana anterior.
- Reejecutar el cron el mismo día **no** genera una segunda notificación (idempotencia por `lastWeeklySummarySentAt`).
- Un negocio sin canales configurados no recibe nada, pero la fila `in_app` sí se crea (comportamiento actual de `create()`).
- El resumen aparece en la campana y en `/dashboard/notifications` con su icono y label, y al pulsarlo navega a analytics / cierre mensual.
- Los toggles de Ajustes guardan y reflejan el estado; SMS/WhatsApp muestran `ProBadge` para planes no Pro.
- Los ingresos del resumen **coinciden** con los del cierre contable del mismo rango.
- Un negocio sin ventas en ninguno de los dos periodos recibe `$0.00 (+0.0%)` sin errores.

### 8.7 Contratos que el FE consume (Resúmenes)

| Contrato | Dónde lo usa el FE |
|---|---|
| `GET /notifications` con `weekly_summary` / `monthly_summary` en los tipos por defecto | campana + `/dashboard/notifications` |
| `weeklySummaryAlert` / `monthlySummaryAlert` en `BusinessSettings` | `notification-settings-card.tsx` |
| `GET /notifications/summaries/weekly\|monthly` | *(no consumido por el FE; queda como endpoint de diagnóstico/preview)* |

---

<a name="9-sugeridas"></a>
## 9. Funcionalidades sugeridas (candidatas, fuera del alcance comprometido)

Ideas que surgen de combinar las 4 áreas. Cada una con valor, esfuerzo aproximado y dependencia. Ya están en el backlog (§2).

| ID | Idea | Valor | Esfuerzo | Depende de |
|---|---|---|---|---|
| **V3-090** | **Portal/registro público de clientes** — el comprador se suscribe a un negocio desde la búsqueda pública (usa `Business.acceptsMessaging`). | Captación de leads sin fricción | M–L | V3-002 |
| **V3-091** | **Puntos canjeables por cupones** — une fidelización (CRM) con cupones (Descuentos). | Retención y recompra | M | V3-005, V3-012 |
| **V3-092** | **Recomendaciones de reabastecimiento** — cruza rotación (ventas) con alertas de stock. | Evita roturas de stock | M | alertas de stock (existente) |
| **V3-093** | **Recordatorios de cobro (AR) por WhatsApp** — avisa a clientes con saldo pendiente. | Acelera cobros, mejora liquidez | S–M | V3-004, V3-034 |
| **V3-094** | **Metas de equipo y ranking (gamificación)** — sobre `sales-by-worker`, conecta con estímulos de nómina. | Motivación del equipo | M | V3-021 |
| **V3-095** | **Costos de envío por zona** — usa el mapa MapLibre ya integrado. | Precio de envío más justo | M | V3-013 |
| **V3-096** | **Reportes financieros exportables** — P&L base caja vs devengo consolidado. | Visión financiera ejecutiva | M–L | V3-033 |
| **V3-098** | **Órdenes de compra a proveedores (PO)** — ciclo *pedido → recepción → entrada de inventario → cuenta por pagar*. | Cierra el círculo financiero por el lado de compras | M–L | V3-034 |
| **V3-099** | **Modo POS rápido** — vista táctil (grilla grande, carrito lateral, cobro en dos toques); reutiliza `product-grid-card.tsx` y `sale-cart-panel.tsx`. | Menos tiempo por venta en mostrador | M | — |
| **V3-101** | **Recibos/facturas por WhatsApp** — link público firmado o share del PDF; el teléfono del recibo alimenta leads (V3-002). | Canal que los clientes ya usan; capta leads | S–M | V3-002 |
| **V3-102** | **Presupuestos por categoría de gasto** — `Budget { businessId, categoryId, month, amount }` + barra de consumo + alerta 80/100 %. | Control preventivo del gasto | M | — |
| **V3-103** | **2FA (TOTP) y sesiones activas** — estándar mínimo si el tier Enterprise custodia nóminas y conciliación. | Seguridad de cuentas serias | M | — |
| **V3-104** | **Pronóstico de demanda** — velocidad de venta y días-hasta-agotarse con media móvil; sugiere cantidad de compra. | Evita roturas sin ML | M | V3-092 |
| **V3-105** | **Resumen narrativo mensual** — informe generado (texto + cifras clave) entregable por email/WhatsApp. | El informe que un dueño no-financiero sí lee | M | V3-039 |
| **V3-110** | **Listados de productos por WhatsApp** — el dueño o un trabajador designado selecciona productos, añade textos de introducción/cierre, ve la previa exacta y recibe el mensaje en su WhatsApp para reenviarlo a su grupo de clientes. El sistema nunca publica en el grupo. Detalle en [listados-productos-whatsapp.md](./listados-productos-whatsapp.md). | Ahorra el mensaje diario a mano y garantiza que el precio publicado es el del sistema | M | — |
| **V3-113** | **Completar delivery / pedidos** — la entidad `BusinessDelivery` (tarifas, zonas, ventanas, tracking) y el evento `sale.delivery_created` existen en el backend sin módulo ni listener; falta el ciclo de pedido visible. | Termina una feature a medio construir | M | V3-013 |
| **V3-115** | **Modo imagen (mosaicos)** — láminas de 6 productos con foto, nombre y precio, enviadas como imagen con caption. 20 productos = 4 mensajes en vez de 20, sin exponer el número compartido. Sustituye a la idea del catálogo PDF, descartada porque en el mercado objetivo no se abren. Detalle en [plan-v2-mosaicos-imagen.md](./plan-v2-mosaicos-imagen.md). | Publica como publica la gente allí: foto y precio en el chat | M | V3-110 |
| **V3-114** | **Destinatarios múltiples por negocio** — hoy todo WhatsApp va a `Business.phone`. Entidad `BusinessContact` (dueño, administrador, vendedor…) con importación de los teléfonos de los trabajadores ya registrados, más selector de destino en el envío. Detalle en [listados-productos-whatsapp.md](./listados-productos-whatsapp.md) §4. | Sin esto, V3-110 solo sirve al dueño, no al trabajador designado | S–M | V3-110 |

*Esfuerzo: S = pequeño, M = medio, L = grande (orientativo).*

---

<a name="10-changelog"></a>
## 10. Bitácora de cambios del plan v3

| Fecha | Cambio |
|---|---|
| 2026-06-24 | Creación del documento maestro v3 con las 4 áreas (CRM, Descuentos/Ofertas, Nóminas, Flujo de Caja Pro), tier Enterprise (V3-000), backlog maestro y funcionalidades sugeridas. Estado inicial: áreas `especificada`, sugeridas `idea`. |
| 2026-06-28 | Alta de **V3-039** (resumen mensual de flujo de caja + semáforo de salud, exportable, tier Enterprise). Detalle en §7.9; contrato backend en [docs/v3/backend-flujo-caja-mensual.md](./backend-flujo-caja-mensual.md). |
| 2026-07-28 | Nueva **Área 5 — Resúmenes automáticos de negocio** (§8) con **V3-040..043**: activar de punta a punta los tipos `weekly_summary` / `monthly_summary`. **V3-040 marcado `hecho`** (cálculo real de ingresos ya en `main`); V3-041 (cron + idempotencia), V3-042 (visibilidad en la UI) y V3-043 (toggles en Ajustes) quedan `especificada` para implementar en v3. Renumeradas §8→§9 (sugeridas) y §9→§10 (bitácora); la columna *Sección* de V3-090..096 pasa de §8 a §9. Los IDs no cambian. |
| 2026-08-17 | Registradas como canónicas las propuestas de [docs/revision-integral-2026-07.md](../revision-integral-2026-07.md) §4.2: **V3-097** (offline, `especificada`, contrato en [docs/offline-plan/plan-offline-negora.md](../offline-plan/plan-offline-negora.md)) y **V3-098..105** (`idea`, detalle en §9). Alta de los cimientos **V3-106..109** y de **V3-111/V3-112** (`especificada`, detalle en §11) y de **V3-113** (delivery, `idea`). V3-110 queda sin asignar. Nueva sección **§11 — Plan de implementación por fases** con la prioridad acordada: **Fase 0 cimientos → Fase 1-2 offline (máxima prioridad) → Fase 3 quick wins → Caja N1 → Descuentos → CRM/Nóminas → Caja N2**. Los IDs y contratos existentes no cambian. |
| 2026-08-21 | Alta de **V3-110** (compositor de listados de productos por WhatsApp) y **V3-114** (destinatarios múltiples por negocio, entidad `BusinessContact` con importación desde los trabajadores registrados), ambos `idea` con contrato propuesto. V3-110 ocupa el ID que quedó sin asignar el 2026-08-17. Detalle completo — estado verificado del canal, contrato FE/BE, catálogo de ideas del canal WhatsApp, 9 acuerdos y 6 decisiones abiertas — en [docs/v3/listados-productos-whatsapp.md](./listados-productos-whatsapp.md). Acuerdo de diseño permanente: **el sistema entrega el mensaje al dueño/trabajador y esa persona lo reenvía; nunca publica en grupos de clientes**. |
| 2026-08-21 | **V3-110 pasa a `especificada`** con el alcance de su v1 cerrado: sección nueva **"Difusión"** en el sidebar, envío manual (el programado queda pendiente por depender de un cron externo en cPanel), llave de plan propia **`productListShare`** concedida solo a Pro/Enterprise/trial —en vez de reutilizar `whatsappNotifications`, que abriría las 13 alertas de WhatsApp al plan Básico—, plantillas guardadas **por criterio** con la lista siempre editable, y destinatario elegido en cada envío entre el número del negocio y los trabajadores registrados. Plan de implementación en [docs/v3/plan-v1-difusion-listados.md](./plan-v1-difusion-listados.md). V3-114 sigue en `idea`. |
| 2026-08-21 | **V3-110 pasa a `en implementación`**: v1 completa en las ramas `feat/product-list-share` (psearch-back) y `feat/difusion-listado-productos` (pmanage). Backend: módulo `product-list-share` (7 endpoints), entidad `product_list_templates`, constructor de mensaje con 23 tests, tipo `product_list` y llave de plan `productListShare` con sus dos migraciones. Frontend: vista `/dashboard/broadcast/product-list` con selector, editor, previa servida por el backend y selector de destinatario. Pendiente manual: correr las migraciones y dar de alta la sección "Difusión" en `/dashboard/admin/menus`. Detalle en [docs/v3/plan-v1-difusion-listados.md](./plan-v1-difusion-listados.md). |
| 2026-08-22 | Alta de **V3-115** (modo imagen para la difusión de listados), `especificada`. Tras confirmar que el gateway acepta media por URL y que el bucket sirve las fotos públicamente, se descarta el catálogo **PDF** —en el mercado objetivo no se abren— y se adopta el **mosaico**: láminas de 6 productos con foto, nombre y precio, enviadas como imagen con caption. 20 productos pasan de 20 mensajes a 4, lo que hace viable el reenvío sin exponer el número compartido de la plataforma. Diez decisiones cerradas (I1-I10) en [docs/v3/plan-v2-mosaicos-imagen.md](./plan-v2-mosaicos-imagen.md). Queda un único pendiente: la ruta exacta de la API de imagen del gateway. |

---

<a name="11-plan-implementacion"></a>
## 11. Plan de implementación por fases — justificación, beneficios y roadmap

> Acordado el 2026-08-17. Orden ejecutivo: **Fase 0 (cimientos) → Fase 1-2 (offline) →
> Fase 3 (quick wins) → Fase 4 (Caja N1) → Fase 5 (Descuentos) → Fase 6 (CRM + Nóminas)
> → Fase 7 (Caja N2)**. Complementa el orden por áreas de §3 (que se mantiene entre
> áreas) anteponiendo robustez de datos y trabajo sin conexión. Las specs de las áreas
> §4-§8 no cambian; esta sección añade el *por qué*, los *beneficios* y el *cómo* de lo
> que se decidió implementar.

### 11.0 Fase 0 — Cimientos de robustez (V3-106..109 + spike offline)

**Por qué.** Tres defectos activos falsean datos hoy mismo (documentados en
[docs/offline-plan/plan-offline-negora.md](../offline-plan/plan-offline-negora.md),
Parte A0): las tasas de cambio viven en una fila única
mutable sin historial, la API no tiene idempotencia (un reintento de red duplica ventas
o pagos), y la numeración de facturas se calcula con `COUNT(*) + 1 + attempt` (colisiona
bajo concurrencia y tras cancelaciones). Además, el gating de planes se anuncia en el
frontend pero el backend no siempre lo exige (los exports del cierre contable no llevan
guard), y **todo** el tier Enterprise (V3-000) depende de que el enforcement
server-side exista de verdad.

**Beneficios.** Datos contables en los que se puede confiar; monetización real de los
planes (lo que se vende Pro, se exige Pro en el servidor); y cada ítem es a la vez
prerrequisito del offline (V3-097), así que nada de este esfuerzo se pierde aunque el
offline se re-priorizara.

**Cómo.**
- **V3-106 — Enforcement + gating de exports.** Aplicar `ProPlanGuard` +
  `@RequiresFeature("exports")` a `GET /sales/closing/range/:businessId/pdf|excel`
  (`psearch-back/src/v2/sale/sale.controller.ts`), espejo del patrón ya usado en los
  exports de inventario (`inventory.controller.ts`). Auditar los 19 feature keys de
  `plan-features.ts` contra los endpoints que los venden y cerrar los huecos que
  aparezcan. El enum `Plan.type` ya admite `enterprise`; V3-000 conserva la spec del
  gating mixto.
- **V3-107 — Historial de tasas.** Tabla nueva append-only `monetary_exchange_history`
  (snapshot de las 10 tasas + quién y cuándo), escrita en la misma transacción de cada
  create/update de `MonetaryExchange`. El ledger `FinancialTransaction` ya congela
  tasas por movimiento; esto cubre el hueco de "¿qué tasa regía el día X?" para
  cierres retroactivos y sincronización offline.
- **V3-108 — Idempotencia.** Header `Idempotency-Key` (UUID del cliente) + tabla de
  claves procesadas con índice único; primero en `POST /sales` y `POST /payments`
  (los reintentos más dañinos), reutilizable después para gastos y entradas de stock.
  Respuesta repetida = misma respuesta almacenada, sin efecto doble. Es el eco del
  ítem #29 del roadmap backend.
- **V3-109 — Numeración de facturas.** Secuencia por negocio en tabla contador con
  incremento transaccional (lock pesimista), en lugar de `COUNT(*)`. Los números
  emitidos nunca se reutilizan aunque haya cancelaciones.
- **Spike offline (2-3 días).** Verificar que TypeORM respeta un `id` UUID provisto por
  el cliente en `@PrimaryGeneratedColumn("uuid")` (bloqueante de la cola offline).
- **Pendiente de decisión (no se ejecuta solo):** reconciliar el historial de
  migraciones (#19 del roadmap backend; ninguna base tiene tabla `migrations` y dev usa
  `synchronize`). Requiere acceso a las bases reales y decisión operativa.

### 11.1 Fase 1 — Offline: núcleo (V3-097, primera mitad)

**Por qué.** Contexto de uso real (Cuba, conectividad intermitente): perder una venta
por falta de red es el peor fallo posible del producto. Es la máxima prioridad
acordada.

**Alternativas evaluadas.**
(a) Ejecutar el plan offline completo de una vez (10 fases, ~15,5 semanas);
(b) **núcleo primero**: fases 2-6 del plan offline — cimientos cliente (Dexie),
PWA/service worker, lecturas offline, sesión offline con PIN y **sincronización de
altas de ventas/pagos** (~7,5 semanas tras la Fase 0);
(c) solo lecturas offline con reintento simple.
**Decisión: (b).** El propio plan declara la sincronización de altas como "el 80 % del
valor: no se pierde una venta"; el núcleo entrega eso en la mitad del tiempo y valida
el modelo de cola/sync antes de invertir en conflictos, integridad retroactiva y APK.
(c) no protege la venta, que es el objetivo; (a) retrasa meses el valor central.

**Beneficios.** El POS sigue vendiendo sin red durante días; el usuario decide cuándo
subir la cola; ninguna venta se pierde ni se duplica (gracias a V3-108).

**Cómo.** Seguir el contrato de
[docs/offline-plan/plan-offline-negora.md](../offline-plan/plan-offline-negora.md):
Parte A1 (módulo `src/v2/sync/` en el backend), Parte B0-B6 (conectividad, PWA,
Dexie, sesión offline, lecturas, cola de altas y UI de sync). Decisiones ya tomadas
que se respetan: un solo dispositivo por negocio, comprobante interno offline (la
factura se emite online), sin gating de plan.

### 11.2 Fase 2 — Offline: completo (V3-097, segunda mitad)

**Por qué/beneficios.** Completa la promesa offline: ediciones acotadas, resolución de
conflictos, integridad contable retroactiva (cierres "marcar y avisar", costo FIFO
aproximado y marcado) y el APK Android con Capacitor para instalación sin tienda.

**Cómo.** Fases 7-10 del plan offline: conflictos (Parte B7), integridad contable
(Parte A3), resto de altas/ediciones (Parte A2/B8) y empaquetado Capacitor (Parte C).

### 11.3 Fase 3 — Quick wins de producto

**V3-041..043 — Resúmenes automáticos** *(spec completa en §8)*. Por qué: el cálculo
(V3-040) ya está hecho y dormido; activarlo es la entrada de menor riesgo del ciclo
v3. Beneficio: el dueño recibe cada semana/mes su resumen sin abrir la app. Cómo: §8.3-§8.5.

**Alertas de stock (bloqueador v2).** Por qué: el frontend
(`pmanage/src/lib/api/stock-alerts.ts`) ya está construido contra endpoints que no
existen. Beneficio: cerrar una feature vendida y visible con esfuerzo pequeño. Cómo:
implementar los endpoints de lectura/config pendientes en el backend según el contrato
del frontend.

**V3-100 — Auditoría / log de actividad.** Por qué: en cuanto existan ajustes manuales
de caja (V3-031), transferencias (V3-032) y pagos de nómina (V3-024), mover dinero sin
rastro de *quién hizo qué* es un riesgo de confianza; **debe aterrizar antes de Caja
N1**. Beneficio: trazabilidad vendible como feature Pro y base de soporte ante
disputas. Cómo: entidad `AuditLog` (businessId, actor, acción, entidad, antes/después
resumido, fecha) alimentada desde los eventos de dominio que ya se emiten post-commit
(`monetary-exchange.updated`, `sale.cancelled`, …) más los que falten (precios,
permisos); endpoint paginado por negocio; UI timeline reutilizando el patrón del
historial de inventario.

**V3-111 — Tiempo real (SSE + `GET /me/badges`).** Por qué: la campana hace polling
cada 60 s (coste y latencia). Beneficio: notificaciones al instante y menos carga.
Cómo: endpoint SSE nativo de NestJS (sin dependencias nuevas) + endpoint combinado de
badges; el frontend sustituye el polling por `EventSource` con fallback al polling
actual.

**V3-112 — Búsqueda global.** Por qué: la feature `globalSearch` se vende en los
planes y no existe en la UI. Beneficio: honestidad comercial + navegación rápida.
Cómo: paleta `cmdk` (`components/ui/command.tsx`, ya instalada y sin uso) con
productos, ventas, páginas y acciones; gating por feature `globalSearch`.

### 11.4 Fases 4-7 — Áreas v3 ya especificadas

| Fase | Área | Por qué ahora | Spec |
|---|---|---|---|
| **4** | **Caja N1** (V3-030..033, Pro) | Base financiera de nóminas y AR/AP; continúa una Fase 2 ya bosquejada. La auditoría (V3-100) ya estará activa para los ajustes manuales. | §7 |
| **5** | **Descuentos** (V3-014 → V3-010..013, Pro) | Toca el flujo de venta que los Pro usan a diario. **`POST /sales/quote` se construye primero**: es la autoridad del cálculo; si no, los totales FE/BE divergen. | §5 |
| **6** | **CRM + Nóminas** (V3-001..005, V3-020..024, Enterprise) | Desbloqueadas porque el enforcement (V3-106) ya existe; dependen de entidades nuevas y del tier Enterprise. | §4 y §6 |
| **7** | **Caja N2** (V3-034..039, Enterprise) | AR/AP, proyección, conciliación y salud mensual coronan el bloque financiero. | §7 |
