# Revisión integral — Negora (pmanage)

> **Fecha:** 2026-07-01 · **Versión revisada:** `2.0.5` (rama `main`)
> Revisión externa del proyecto en tres ejes: código y organización, funcionalidades
> actuales, y propuestas para la versión 3. Cierra con impresiones y consejos.
>
> Documentos de referencia: [estado-proyecto.md](estado-proyecto.md) ·
> [v3/V3-MASTER.md](v3/V3-MASTER.md) · [ROADMAP.md](../ROADMAP.md)

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Código y organización](#2-código-y-organización)
3. [Funcionalidades actuales y huecos](#3-funcionalidades)
4. [Propuestas para la versión 3](#4-version-3)
5. [Impresiones y consejos](#5-impresiones)

---

<a name="1-resumen-ejecutivo"></a>
## 1. Resumen ejecutivo

Negora es un proyecto **muy por encima de la media en disciplina de ingeniería** para
su tamaño (~55.000 líneas en 440 archivos TS/TSX). La arquitectura por capas se cumple
en todos los dominios, el tipado es estricto (cero `any` en `src/`), no hay
`console.log` residuales, los pendientes están etiquetados como `TODO(backend)` con su
contrato documentado, y la documentación interna (`docs/estado-proyecto.md`,
`docs/v3/V3-MASTER.md`) es de una calidad que rara vez se ve incluso en equipos grandes.

Los riesgos del proyecto **no están en la calidad del código**, sino en dos frentes:

1. **La red de seguridad de releases.** Existen suites de lógica pura
   (`src/testing/`), pero cero tests de componentes y cero E2E. Cada release depende
   de un smoke test manual (login → venta multimoneda → cancelación → gating Pro),
   y la superficie funcional ya es demasiado grande para sostener eso.
2. **La dependencia del backend externo.** Hay una lista creciente de bloqueadores
   documentados (bug SQL de `expenseCategoryId`, conversión de pagos con base ≠ CUP,
   contrato de notificaciones in-app, enforcement de planes server-side) que frenan
   features con frontend ya terminado.

La v3 está excepcionalmente bien planificada en [V3-MASTER.md](v3/V3-MASTER.md). Las
propuestas de este documento (§4) son **complementos**, no reemplazos: cosas que el
maestro aún no cubre y que encajan con el contexto real de uso (comercio cubano,
conectividad intermitente, WhatsApp como canal dominante).

---

<a name="2-código-y-organización"></a>
## 2. Código y organización

### 2.1 Fortalezas (mantener tal cual)

| Fortaleza | Evidencia |
|---|---|
| **Patrón de 5 capas por dominio** consistente en todo el repo | `src/lib/types/<dom>.ts` → `src/lib/routes/<dom>.ts` → `src/lib/api/<dom>.ts` → `src/lib/validations/<dom>.ts` → `src/hooks/use-<dom>.ts` → `src/components/<dom>/` |
| **Tipado estricto** | Cero ocurrencias de `: any` / `as any` en `src/` |
| **Higiene de código** | Cero `console.log`; los ~10 TODOs existentes son `TODO(backend)` con contrato enlazado (p. ej. `src/lib/types/business.ts:32`) |
| **Tests de lógica pura** | `src/testing/suites/` (currency, validations, pro-gates, cash-flow, units, navigation-access…) + runner in-app en `/dashboard/admin/test` + `vitest` |
| **Query keys con `businessId`** | Sin riesgo de cache leak entre negocios (deuda ya resuelta según `estado-proyecto.md`) |
| **Gating por plan bien resuelto** | `src/lib/pro-gates.ts` + `middleware.ts` (cookies) + `RouteGuard`/`PlanGuard` cliente como barrera real en build estático |
| **Documentación interna** | `docs/estado-proyecto.md`, `docs/v3/V3-MASTER.md`, contratos backend por feature (`docs/backend-*.md`) |

### 2.2 Mejoras — prioridad ALTA

**1. Red de tests de UI y E2E.** Es el mayor riesgo del proyecto. Hoy `vitest` cubre
solo lógica pura. Recomendación concreta:

- Añadir `@testing-library/react` y cubrir los formularios críticos:
  `src/components/sales/sale-cart-panel.tsx`, `payment-dialog.tsx`,
  `cancel-sale-dialog.tsx`, `src/components/expenses/expense-form.tsx`.
- Añadir **Playwright** con un flujo E2E mínimo contra un backend de staging o mocks
  (MSW): login → crear venta multimoneda → pagar → cancelar parcialmente → cierre
  diario. Es exactamente el smoke test manual del runbook de promoción
  (`estado-proyecto.md` §Promoción), automatizado.
- CI: correr `pnpm test` + `tsc --noEmit` + `next build` en cada PR
  (workflow en `.github/workflows/`). El build estático hace de test de humo barato.

**2. Completar el refresh token silencioso** en `src/lib/axios.ts` y redirigir a login
cuando el refresh falle (pendiente en `ROADMAP.md` §Autenticación). Hoy una sesión
expirada a mitad de operación produce errores en cascada en vez de una salida limpia.

### 2.3 Mejoras — prioridad MEDIA

**3. Trocear los archivos de 400–700 líneas.** No es urgente, pero cada uno mezcla
varias responsabilidades (formulario + dialogs + lógica de submit). Los mayores:

| Archivo | Líneas | Sugerencia |
|---|---|---|
| `src/components/business/business-details-form.tsx` | 702 | Extraer cada tarjeta (datos, horario, notificaciones, danger zone) a su componente; algunas ya existen — usarlas como composición |
| `src/app/dashboard/business/create/page.tsx` | 641 | Extraer los pasos del wizard a componentes por paso |
| `src/components/assign-plans/assign-plan-confirm-dialog.tsx` | 600 | Separar resumen, formulario y confirmación |
| `src/components/inventory/update-stock-form.tsx` | 484 | Extraer el bloque de moneda/costo (ya existe `EntryCostCurrency`, ampliar su uso) |
| `src/components/workers/worker-form.tsx` | 480 | Separar datos personales vs permisos (la sección de permisos ya existe) |
| `src/app/(auth)/login/page.tsx` | 475 | Extraer formulario y modal de tipo de login |
| `src/components/products/table.tsx` | 473 | Separar toolbar/filtros de la tabla |
| `src/components/sales/payment-dialog.tsx` | 462 | Extraer la fila de pago multimoneda como componente |
| `src/components/sales/sale-cart-panel.tsx` | 448 | Extraer resumen de totales y bloque de delivery |

Regla práctica sugerida: **ningún componente nuevo por encima de ~300 líneas**; al
tocar uno de los anteriores, extraer al menos un bloque.

**4. Centralizar la limpieza de sesión.** `src/context/business-context.tsx:101-105`
borra manualmente `token`, `refresh_token`, `user` y `activeBusinessId` de
sessionStorage; esa misma limpieza vive (o debería vivir) en `src/lib/session.ts`.
Una única función `clearSession()` evita que un futuro campo de sesión se quede sin
limpiar en uno de los sitios.

**5. Centralizar las query keys** en un módulo de constantes/fábricas
(`src/lib/query-keys.ts`), como ya señala la deuda técnica de `estado-proyecto.md`.
Con 40+ hooks, renombrar una key hoy es una búsqueda global a mano.

### 2.4 Mejoras — prioridad BAJA (higiene)

| Ítem | Detalle |
|---|---|
| **Dependencia muerta: `zustand`** | Está en `package.json` pero no se importa en ningún archivo de `src/`. Eliminarla (el estado global real es React Query + `business-context`). |
| **Tres librerías de primitivas UI** | Conviven `@base-ui/react`, `radix-ui` (paquete unificado) y `@radix-ui/react-dialog`/`react-slot` sueltos. Consolidar en una (el paquete `radix-ui` unificado cubre los sueltos) reduce bundle y confusión. |
| **README.md** | Es el default de create-next-app. Sustituir por: qué es Negora, stack, cómo correr, estructura de capas, enlaces a `docs/`. |
| **CLAUDE.md vacío** | Contiene solo el texto "CLAUDE.md". Regenerarlo (p. ej. con `/init`) describiendo el patrón de 5 capas, el gating por plan y la convención de docs — es exactamente lo que un agente necesita saber. |
| **CHANGELOG.md congelado** | Última entrada `0.10.0-beta` (2026-03-24) con el proyecto en `2.0.5`. O se retoma la disciplina, o se elimina y se genera desde `git log` (los mensajes de commit ya son buenos). A medias no sirve. |
| **`estado-proyecto.md` desactualizado** | Habla de "promover v2.0.0" cuando `main` ya está en `2.0.5`. Actualizar el snapshot tras cada release (o anotar en el runbook que ese paso es obligatorio). |
| **Typo en ruta pública** | `src/app/dashboard/business/products/asign-to-business/` → `assign-to-business` (afecta URL visible; coordinar con `.htaccess` y enlaces). |
| **Docs duplicados** | `docs/análisis-planes/` y `docs/extra/análisis-planes/` coexisten con archivos homónimos (`analisis-planes.md`, `spec-tecnicas.md`). Dejar una sola copia y un enlace, o se acabará editando la equivocada. |
| **Prettier** | Sin configurar (deuda ya conocida). Añadirlo con config mínima + script `format` y un pase único sobre `src/`. |

---

<a name="3-funcionalidades"></a>
## 3. Funcionalidades actuales y huecos

### 3.1 Mapa de módulos (v2.0.5)

| Módulo | Estado | Plan |
|---|---|---|
| Autenticación (login dual dueño/trabajador, registro, verificación, reset, invitaciones, desactivación con gracia de 15 días) | Completo | — |
| Multi-negocio (hasta 3 en Pro, geolocalización MapLibre, horario de atención, delivery/`acceptsMessaging`, archivado por downgrade) | Completo | Básico/Pro |
| Productos (catálogo global + asignación por negocio, categorías por `BusinessProduct`, historial de precios con comparador) | Completo | Básico+ |
| Inventario (stock con decimales, entradas multimoneda, historial timeline, alertas de stock bajo con umbral por producto) | Completo (emisión de alertas: falta backend de lectura) | Básico+ |
| Ventas (carrito, multimoneda con tasa congelada, pagos parciales, factura PDF, tipos in_store/delivery/pickup, cancelación con devolución parcial y merma) | Completo | Básico+ |
| Gastos (CRUD, categorías, multimoneda, consolidado multi-negocio Pro) | Frontend completo (bug backend `expenseCategoryId` y `currency`) | Básico+ |
| Proveedores (CRUD, productos por proveedor, autocompletar costo) | Completo | Básico+ |
| Equipo/Trabajadores (invitación por email, permisos granulares por sección/menú) | Completo | Pro |
| Cierre contable diario/mensual (multimoneda desde 2.0.5, export PDF/Excel) | Completo | Básico+ / Pro |
| Caja / cuentas en divisa (saldos por moneda, consolidado CUP, widget dashboard) | Fase 1 visual; libro de movimientos y ajustes → v3 (V3-030..033) | Básico+ |
| Transacciones financieras (ledger paginado con filtros) | Completo | — |
| Flujo de caja mensual + semáforo de salud (V3-039) | Implementado en 2.0.3 | Enterprise |
| Analytics (KPIs, tendencias, top productos, ventas por trabajador) | Completo | Básico+ |
| Tipos de cambio (8 divisas + `CUP_TRANSFERENCIA` con recargo %) | Completo | Básico+ |
| Planes self-service (trial Pro 15 días, paywall, reconciliación de negocios) | Frontend completo (enforcement backend pendiente) | — |
| Soporte (tickets tipo chat, asignación de admins, notificaciones) | Completo | — |
| Notificaciones (campana con polling, ajustes multi-canal por negocio) | Bandeja general a la espera de contrato in-app backend | — |
| Admin (asignar planes, gestión de menús/navegación, soporte, test runner) | Completo | Admin |
| Búsqueda global | Completo | Básico+ |

Es un alcance funcional **muy completo para un equipo pequeño**. La cobertura del ciclo
operativo (comprar → almacenar → vender → cobrar → cerrar) ya está entera; lo que falta
son capas de crecimiento (v3) y pulido.

### 3.2 Huecos a cerrar ANTES de empezar la v3

Todo esto ya está identificado en [ROADMAP.md](../ROADMAP.md); se lista aquí como
recordatorio de prioridad, porque es trabajo pequeño que mejora la percepción de
producto terminado:

1. **Fase 1 del ROADMAP (restos):** perfil de usuario funcional; cards de resumen
   comentadas en `daily/page.tsx` y `monthly/page.tsx`; tab "Nuevo producto" en
   entrada de inventario; `console.log` residual en `exchange-rate/page.tsx`.
2. **Página `/dashboard/settings`** (tema, moneda por defecto, preferencias de
   alertas) — el ítem ya existe oculto en `nav-user.tsx`.
3. **Ventas: filtros por fecha/estado + export CSV** — reusar `DateFilter` de
   accounting-close; persistir filtros en query params.
4. **Gráficas del dashboard** (ventas 7 días, balance 30 días, top 5 del mes) —
   Recharts ya está y Analytics ya tiene los patrones (`sales-trend-chart.tsx`).
5. **Bloqueadores backend** (la lista completa vive en `estado-proyecto.md`
   §Siguiente acción): bug SQL `expenseCategoryId`, conversión de pagos base ≠ CUP,
   `currency` en gastos, contrato in-app, enforcement de planes, endpoints de
   alertas de stock. **Ninguna feature v3 de caja/nóminas tiene sentido si el
   enforcement de planes server-side no llega antes** (todo el gating Enterprise
   depende de él).

---

<a name="4-version-3"></a>
## 4. Propuestas para la versión 3

### 4.1 Sobre lo ya planificado (validación)

[V3-MASTER.md](v3/V3-MASTER.md) ya especifica con contratos completos: tier
Enterprise (V3-000), CRM (V3-001..005), descuentos/cupones/envío (V3-010..014),
nóminas (V3-020..024) y flujo de caja profesional (V3-030..039). **El orden sugerido
en el maestro (Caja N1 → Descuentos → CRM → Nóminas → Caja N2) es correcto** y esta
revisión lo respalda por tres razones:

- Caja N1 (libro de movimientos, ajustes, transferencias) completa una Fase 2 ya
  bosquejada y es la base de datos que nóminas (V3-024) y AR/AP (V3-034) necesitan.
- Descuentos toca el flujo de venta que los usuarios Pro ya ejercitan a diario:
  retorno inmediato.
- CRM y Nóminas dependen del tier Enterprise y de enforcement backend que aún no
  existe; empezar por ellas sería acumular más frontend bloqueado.

Única advertencia: **V3-014 (`POST /sales/quote`) debería tratarse como el corazón del
área de descuentos**, no como su última pieza. Si el backend no es la autoridad del
cálculo desde el primer día, los totales FE/BE divergirán y habrá que rehacer la UI del
carrito.

### 4.2 Propuestas nuevas (candidatas a registrar en el backlog maestro §2)

IDs sugeridos a partir de `V3-097` (libres en el maestro). Registrar allí las que se
acepten, siguiendo la gobernanza de §0.

| ID sugerido | Propuesta | Área | Tier sugerido | Valor | Esfuerzo |
|---|---|---|---|---|---|
| **V3-097** | **PWA / offline-first con cola de operaciones** | Transversal | Todos | El contexto de uso (Cuba, conectividad intermitente) hace que perder una venta por falta de red sea el peor fallo posible. Fase A: `next-pwa` + manifest + caché de lecturas (ya insinuado en ROADMAP). Fase B: cola local de mutaciones (ventas/gastos) con reintento y resolución de conflictos simple (last-write-wins + aviso). El build ya es estático (`output: export`), lo que facilita el service worker. | L |
| **V3-098** | **Órdenes de compra a proveedores (PO)** | Inventario/Caja | Pro | Hoy existe el maestro de proveedores y la entrada de stock, pero no el ciclo formal *pedido → recepción → cuenta por pagar*. Una entidad `PurchaseOrder` (borrador → enviada → recibida parcial/total) que al recibir genere la entrada de inventario y alimente AP (V3-034) cierra el círculo financiero por el lado de compras, igual que las ventas lo cierran por cobros. | M–L |
| **V3-099** | **Modo POS rápido** | Ventas | Pro | La creación de venta actual (`sales/create`) es un formulario completo. Un modo pantalla-táctil (grilla de productos grandes, carrito lateral, cobro en dos toques, optimizado a móvil/tablet) reduce el tiempo por venta en mostrador. Reutiliza `product-grid-card.tsx` y `sale-cart-panel.tsx`; es sobre todo una vista nueva, no un dominio nuevo. | M |
| **V3-100** | **Log de actividad / auditoría** como transversal de v3 | Transversal | Pro (lectura) | Ya está en ROADMAP Fase 4, pero debería **subir a v3 como pre-requisito**: en cuanto existan ajustes manuales de caja (V3-031), transferencias (V3-032) y pagos de nómina (V3-024), operar dinero sin rastro de *quién hizo qué* es un riesgo de confianza del producto. El backend puede emitirlo desde los mismos eventos que generan `CashMovement`. | M |
| **V3-101** | **Recibos y facturas compartibles por WhatsApp** | Ventas/CRM | Pro | La factura PDF ya existe; falta el "enviar al cliente": link público firmado (o share nativo del PDF) + botón WhatsApp. Encaja con `acceptsMessaging`, alimenta la captación de clientes del CRM (el teléfono del recibo se convierte en lead, V3-002) y es el canal que los clientes finales ya usan. | S–M |
| **V3-102** | **Presupuestos por categoría de gasto** | Gastos/Caja | Pro | Ya identificado como "Variante B" en `estado-proyecto.md` sin spec. Definirlo apoyado en lo que ya existe: categorías de gasto + ledger financiero. `Budget { businessId, categoryId, month, amount }` + barra de consumo en la página de gastos + alerta al 80/100 %. Complementa el semáforo de salud (V3-039) con control *preventivo*. | M |
| **V3-103** | **2FA (TOTP) y gestión de sesiones activas** | Transversal/Auth | Enterprise | Si la v3 vende nóminas y conciliación bancaria a negocios serios, la cuenta del dueño pasa a custodiar datos sensibles. 2FA opcional + lista de sesiones con revocación es el estándar mínimo del tier Enterprise. Depende del backend de auth. | M |
| **V3-104** | **Pronóstico de demanda y reabastecimiento sugerido** | Inventario | Pro | Extiende V3-092 (idea ya registrada): con el historial de ventas por producto ya capturado, calcular velocidad de venta y días-hasta-agotarse, y sugerir cantidad de compra (conectando con V3-098). Empezar con media móvil simple — no hace falta ML para dar valor. | M |
| **V3-105** | **Resumen narrativo del negocio (informe mensual automático)** | Analytics | Enterprise | Extiende V3-039: además del semáforo, un informe mensual generado (texto + cifras clave: "vendiste X, margen Y, tu mejor producto fue Z, la caja aguanta N meses") entregable por email/WhatsApp. Es la feature que un dueño no-financiero realmente lee. | M |

### 4.3 Qué NO haría en v3

- **No** adelantar el Núcleo Contable de partida doble
  ([extra/CONTABILIDAD_NUCLEO.md](extra/CONTABILIDAD_NUCLEO.md)): la decisión del
  maestro de prepararlo sin solaparse es correcta; la caja en base caja (V3-030..039)
  cubre al público objetivo actual.
- **No** abrir API pública/webhooks todavía: sin enforcement server-side de planes ni
  auditoría, exponer API multiplica el riesgo. Es candidata natural a v4.
- **No** internacionalizar la UI (i18n) aún: la app es coherente en español y el
  mercado es local; el esfuerzo hoy no tiene retorno. Sí conviene **no hardcodear**
  más textos en componentes nuevos de lo necesario para no encarecer el futuro.

---

<a name="5-impresiones"></a>
## 5. Impresiones y consejos

**Impresión general.** Este es un proyecto tratado con seriedad profesional: la
consistencia del patrón de capas, la ausencia total de `any`, los contratos backend
escritos *antes* de pedir el trabajo, y un documento maestro de v3 con gobernanza e IDs
estables son prácticas de equipo maduro aplicadas por un equipo pequeño. La v2 es un
producto funcionalmente completo para su nicho.

**Consejo 1 — Parar de ampliar superficie hasta tener red E2E.** El runbook de release
ya exige un smoke test manual de 6 pasos, y cada área nueva de v3 lo alarga. Un solo
flujo Playwright (login → venta → pago → cancelación parcial → cierre) automatizado en
CI paga su costo en la primera regresión que atrape. Es la inversión con mejor ratio
esfuerzo/retorno de toda esta revisión.

**Consejo 2 — El backend es el camino crítico, no el frontend.** El patrón que se
repite en `estado-proyecto.md` es: frontend terminado, feature bloqueada esperando
backend (gastos con categoría, notificaciones in-app, enforcement de planes, alertas de
stock). Antes de comprometer las áreas Enterprise de v3 (que dependen de `V3-000` +
enforcement), conviene negociar y cerrar el paquete de bloqueadores v2 con el equipo de
backend — de lo contrario la v3 acumulará más inventario de frontend congelado, que es
trabajo pagado sin valor entregado.

**Consejo 3 — Proteger la fuente de la verdad.** `V3-MASTER.md` funciona porque es
única. Las propuestas de §4.2 de este documento **no** son canónicas hasta que se
registren allí con su ID; este archivo es una revisión puntual, no un segundo backlog.
En la misma línea: actualizar `estado-proyecto.md` (aún describe la promoción a 2.0.0
como pendiente) y decidir el destino del CHANGELOG, porque documentación desactualizada
en un repo que depende tanto de su documentación es más costosa que en cualquier otro.

**Consejo 4 — Pequeñas victorias de higiene.** Un PR único de limpieza (quitar
`zustand`, consolidar primitivas UI, README real, CLAUDE.md real, Prettier, deduplicar
`docs/análisis-planes/`) deja el repo listo para que la v3 arranque sin ruido. Es medio
día de trabajo.

---

*Fuentes: exploración directa de `src/` (438 archivos TS/TSX), `package.json`,
`ROADMAP.md`, `CHANGELOG.md`, `docs/estado-proyecto.md`, `docs/v3/V3-MASTER.md`,
`git log`.*
