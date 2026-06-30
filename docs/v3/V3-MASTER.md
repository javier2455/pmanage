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
8. [Funcionalidades sugeridas](#8-sugeridas)
9. [Bitácora de cambios](#9-changelog)

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
6. **Anota el cambio** en la bitácora (§9) con fecha.

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
| **V3-090** | Portal/registro público de clientes | Sugerida | Enterprise | idea | V3-002 | §8 |
| **V3-091** | Puntos canjeables por cupones | Sugerida | Enterprise | idea | V3-005, V3-012 | §8 |
| **V3-092** | Recomendaciones de reabastecimiento | Sugerida | Pro | idea | — | §8 |
| **V3-093** | Recordatorios de cobro (AR) por WhatsApp | Sugerida | Enterprise | idea | V3-004, V3-034 | §8 |
| **V3-094** | Metas de equipo y ranking (gamificación) | Sugerida | Enterprise | idea | V3-021 | §8 |
| **V3-095** | Costos de envío por zona (MapLibre) | Sugerida | Pro | idea | V3-013 | §8 |
| **V3-096** | Reportes financieros (P&L caja vs devengo) | Sugerida | Enterprise | idea | V3-033 | §8 |

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

<a name="8-sugeridas"></a>
## 8. Funcionalidades sugeridas (candidatas, fuera del alcance comprometido)

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

*Esfuerzo: S = pequeño, M = medio, L = grande (orientativo).*

---

<a name="9-changelog"></a>
## 9. Bitácora de cambios del plan v3

| Fecha | Cambio |
|---|---|
| 2026-06-24 | Creación del documento maestro v3 con las 4 áreas (CRM, Descuentos/Ofertas, Nóminas, Flujo de Caja Pro), tier Enterprise (V3-000), backlog maestro y funcionalidades sugeridas. Estado inicial: áreas `especificada`, sugeridas `idea`. |
| 2026-06-28 | Alta de **V3-039** (resumen mensual de flujo de caja + semáforo de salud, exportable, tier Enterprise). Detalle en §7.9; contrato backend en [docs/v3/backend-flujo-caja-mensual.md](./backend-flujo-caja-mensual.md). |
