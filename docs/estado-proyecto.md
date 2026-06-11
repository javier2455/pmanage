# Estado del proyecto — pmanage

> Documento de referencia del estado real del proyecto. Incluye lo implementado, lo que está en curso y las proyecciones de desarrollo.
> Última actualización: **2026-06-10** (sistema de notificaciones in-app, combobox de productos con scroll infinito, y reversiones pendientes de backend).

---

## Snapshot general

| | |
|---|---|
| **Versión actual** | `1.3.7-alpha` (rama `develop`) |
| **Versión en producción** | `1.0.0` (rama `main`) |
| **Commits por delante de `main`** | **71** |
| **Último commit** | `b1e1a93` — 2026-06-10 |
| **PR `develop → main`** | **No creado** — deuda de promoción acumulada (sigue creciendo) |
| **Bloqueadores para promover** | (1) Backend con bug al guardar gasto con `expenseCategoryId` (error SQL `:categoryId` — ver Punto pendiente abajo); (2) contrato de **notificaciones in-app** (canal `in_app` + `readAt` + endpoints) — ver `docs/notificaciones-internas.md` |

---

## Módulos implementados y en producción (`main` v1.0.0)

| Módulo | Plan |
|---|---|
| Autenticación completa (login, registro, verificación, reset, aceptar invitación) | — |
| Dashboard con stats de ventas y gastos recientes | Básico+ |
| Analytics (KPIs: ingresos, beneficio, ticket promedio, cancelaciones, valor inventario; tendencias; top productos) | Básico+ |
| Gestión de negocios (multi-negocio, detalles, geolocalización con MapLibre) | Básico (1) / Pro (3) |
| Productos (CRUD completo, asignar al negocio, catálogo global) | Básico+ |
| Historial de precios (EditPriceDialog + página dedicada + comparador multi-producto) | Básico+ / Pro |
| Inventario (stock actual, entradas de compra, stock inicial) | Básico+ |
| Ventas (crear, cancelar con razón) | Básico+ |
| Gastos (CRUD) | Básico+ |
| Equipo / Workers (invitaciones por email, permisos granulares por módulo) | Pro |
| Cierre contable diario | Básico+ |
| Cierre contable mensual | Pro |
| Tipos de cambio multi-moneda (USD, EUR, CUP, MXN, CAD, GBP, CHF, JPY) | Básico+ |
| Planes y suscripción (Básico $5/mes · Pro $15/mes; selector mensual/anual) | — |
| Admin: asignación de planes a usuarios | Admin |
| Búsqueda global | Básico+ |
| Menú y permisos dinámico por rol | — |

---

## Implementado en `develop` — pendiente de promover a producción

Todo lo siguiente está mergeado en `develop` y **listo para producción** (salvo los bloqueadores indicados).

| # | Feature | Commit(s) | Bloqueador |
|---|---|---|---|
| 1 | Historial de precios refinado (`EditPriceDialog`) | #8 | — |
| 2 | Comparador multi-producto en historial de precios | `485ae8b` | — (Pro gateado) |
| 3 | Refactor rutas dinámicas con query params | `a18f6c7` | — |
| 4 | Despliegue en subdirectorio (`basePath` + `.htaccess`) | `8051f30`, `964c4c7` | Inyectar `NEXT_PUBLIC_BASE_PATH` en build |
| 5 | Sección Categorías (CRUD de categorías de gastos) | `fbfff42` | — (resuelto: el sidebar se alimenta de `GET /api/v2/section`) |
| 6 | Selector de categoría en formulario de gasto | `0dad138` | **Backend con bug** al persistir `expenseCategoryId` (ver Punto pendiente abajo) |
| 7 | Módulo de Proveedores completo (CRUD + detalle) | #9, `50a959d`, `636a506` | — |
| 8 | Tabla de productos por proveedor | `8ef2b3d` | — |
| 9 | Auto-completar precio de entrada desde proveedor | `25e2b6a` | — |
| 10 | Refactor sidebar con secciones y visibilidad por rol | `a5a2a03` | — |
| 11 | Gestión de submenús (admin navigation) | `4c579ce` | — |
| 12 | Historial de inventario con timeline completo | `3138a7e` | — |
| 13 | Back navigation en inventario y catálogo | `3138a7e` | — |
| 14 | Validación y estilo de `phone-input` | `636a506`, `3138a7e` | — |
| 15 | **Alertas de stock bajo / agotado** (frontend completo) | `3eaf9c3`, `22f6a12`, `b1e1a93` | Parcial (ver detalle) |
| 16 | **Exportación a PDF y Excel** en cierre diario y mensual | — | — (Pro gateado) |
| 17 | **Sistema de notificaciones** (campana in-app + ajustes multi-canal por negocio) | `f0ddcb4`, `52b0159`, `3b12632`, `faf0b8a` | Contrato in-app pendiente (ver detalle) |
| 18 | **Combobox de productos con scroll infinito + búsqueda en servidor** | `22f6a12` | — |
| 19 | Historial de inventario con filtrado por producto | `1f61ac2` | — |
| 20 | Filtrado de módulos admin-only en permisos de trabajadores | `20f9cf9` | — |
| 21 | Limpieza de `src/app/api/` (fix CORS al deployar) — **resuelto y mergeado** | `5aae8d7` (PR #2) | — |
| 22 | Fila de producto cliqueable abre el detalle en ambas tablas de Productos (Catálogo y a la venta); se elimina "Ver detalles" del menú de acciones | — | — |
| 23 | **Gastos filtrados por negocio activo** + toggle "Todos los negocios" (reporte consolidado, gateado a Pro) | — | — |
| 24 | Fila de venta cliqueable abre el detalle; se elimina el dropdown de acciones y se deja solo el icono de "Cancelar venta" en la fila | — | — |

### Detalle: Alertas de stock bajo (feature Pro) — `3eaf9c3`, `22f6a12`, `b1e1a93`

El frontend está completo. Permite configurar un umbral por producto (`stockAlertThreshold`) al asignarlo al negocio o desde el diálogo en la tabla de inventario; si no hay umbral personalizado se usa un valor por defecto. Muestra badges por fila ("Sin stock" / "Stock bajo") y un banner-resumen en la página de inventario.

**Lado de emisión de alertas:** el backend ya entregó **Business Settings** (`/businesses/{businessId}/settings`) con 4 tipos de alerta multi-canal: `lowStockAlert`, `outOfStockAlert`, `dailyClosingAlert`, `monthlyClosingAlert` (email para todos los planes; SMS/WhatsApp solo Pro). Ver [docs/API.md](API.md) y [docs/notificaciones-alertas.md](notificaciones-alertas.md).

**Sigue pendiente** (spec en [docs/backend-alertas-stock.md](backend-alertas-stock.md)):
- `GET /businesses/:id/stock-alerts` — lista productos con alerta activa
- `PATCH /businesses/:businessId/products/:productId/stock-alert` — actualiza umbral

### Detalle: Sistema de notificaciones — `f0ddcb4`, `52b0159`, `3b12632`

Dos piezas:
1. **Ajustes de notificación por negocio (multi-canal):** tarjeta de configuración (`notification-settings-card.tsx`) que consume el contrato de Business Settings ya entregado por backend (4 alertas × 3 canales, gateado por plan).
2. **Bandeja in-app (campana):** `notification-bell.tsx` + `notification-item.tsx` + hook `use-notifications.ts`. El scaffolding del frontend está listo, **a la espera de que backend exponga la Parte 2** del contrato: canal `in_app`, estado `readAt` (leído/no leído) y endpoints para listar, contar no leídas y marcar como leídas.

Spec completa del contrato in-app en [docs/notificaciones-internas.md](notificaciones-internas.md).

### Detalle: `expenseCategoryId` en gastos — bug de backend (bloqueador)

El frontend está completo y **envía `expenseCategoryId` en el payload** sin workarounds: tipos ([src/lib/types/expenses.ts](../src/lib/types/expenses.ts)), validación ([src/lib/validations/expenses.ts](../src/lib/validations/expenses.ts)), formulario ([src/components/expenses/expense-form.tsx](../src/components/expenses/expense-form.tsx)) y API ([src/lib/api/expense.ts](../src/lib/api/expense.ts)).

Al crear un gasto, el backend responde **HTTP 500** con un error de sintaxis SQL:

```
POST /api/v2/expenses → 500
"You have an error in your SQL syntax; ... near ':categoryId' at line 1"
```

**Diagnóstico:** el backend usa un parámetro nombrado `:categoryId` en una query que nunca se enlaza al valor; el literal llega crudo a MySQL y rompe la sintaxis. Es un bug del backend, no del frontend.

**Lo que debe hacer el backend:**
1. Columna/migración: `expenseCategoryId` (FK nullable) en la entidad `Expense`.
2. `POST /expenses`: aceptar y persistir `expenseCategoryId` (UUID o `null`) — **corregir el binding del parámetro `:categoryId`**.
3. `PATCH /expenses/:id`: aceptar/actualizar el campo, permitiendo `null` (des-asignar).
4. `GET /expenses` y `GET /expenses/:id`: **devolver** `expenseCategoryId` (idealmente con la categoría embebida) para que la edición precargue la selección.

**Verificación:** crear un gasto con categoría y reabrirlo en edición; si la categoría aparece seleccionada, el punto queda resuelto.

### Detalle: Gastos filtrados por negocio activo (feature 23)

Antes, la página de Gastos llamaba a `getAllExpenses` **sin `businessId`**, mezclando los gastos de todos los negocios del usuario. Ahora filtra por el **negocio activo** por defecto, alineándose con Ventas y Categorías.

- **API/hook:** `getAllExpenses` ([src/lib/api/expense.ts](../src/lib/api/expense.ts)) acepta `businessId` como query param opcional; `useGetAllExpensesQuery` ([src/hooks/use-expenses.ts](../src/hooks/use-expenses.ts)) lo incluye en el `queryKey` (sin riesgo de cache leak entre negocios). Backend ya soporta el query param — ver [spec-tecnicas.md](extra/análisis-planes/spec-tecnicas.md).
- **Reporte consolidado (Pro):** un toggle "Todos los negocios" ([src/app/dashboard/business/expenses/page.tsx](../src/app/dashboard/business/expenses/page.tsx)) omite el `businessId` para ver los gastos de todos los negocios juntos. Gateado a plan Pro siguiendo [docs/extra/pro-gating.md](extra/pro-gating.md): el switch va deshabilitado con `<ProBadge />` + tooltip para usuarios free/básico. Nuevo componente `src/components/ui/switch.tsx` (shadcn).

**Sin bloqueador de backend** — el contrato del query param ya está disponible.

---

## Reversiones — implementado y revertido a la espera de backend

Trabajo de frontend completado pero **revertido en `develop`** porque depende de una definición de backend aún no entregada. El historial conserva los commits para re-aplicarlos sin re-investigar.

| Feature | Commit original | Revert | Notas |
|---|---|---|---|
| Categorías de producto globales por usuario (Opción A) | `27af9af` | `9288ffa` | Backend debe definir el modelo. Diff completo y plan de re-aplicación en [docs/PENDIENTE-categorias-producto-globales.md](PENDIENTE-categorias-producto-globales.md) |
| Sistema de gestión de divisas con conversión dinámica | `348fbaa` | `0d3375d` | Revertido tras merge de PR #10; pendiente de re-alineación |

---

## En curso — ramas no mergeadas

| Rama | Qué hace | Bloqueador |
|---|---|---|
| `feature/auth-google` | OAuth con Google (popup) | Endpoint backend `/auth/google` |
| `move-to-spa` | Migración a SPA (conversión a estático) | Ver [docs/conversion-a-estatico.md](conversion-a-estatico.md) |

> `fix/cors-error` ya está mergeado: `src/app/api/` fue eliminado y el problema de CORS al deployar está resuelto.

---

## Proyecciones de desarrollo

### Próximo — Variante A: "Más datos, mismas operaciones" (est. 2–3 semanas)

No requiere entidades nuevas. Todo es agregación sobre datos ya capturados.

| Feature | Estado frontend | Endpoint backend necesario |
|---|---|---|
| Alertas de stock bajo/agotado | ✅ Implementado · emisión multi-canal entregada | Pendiente: `GET /businesses/:id/stock-alerts` + `PATCH .../stock-alert` |
| Notificaciones in-app (bandeja) | ✅ Scaffolding listo | Pendiente: canal `in_app` + `readAt` + endpoints (listar/contar/marcar) |
| Rentabilidad por producto (margen = venta − costo entrada × cantidad) | Por hacer | `GET /products/profitability?from=&to=` |
| Comparativas de periodos (este mes vs. anterior) | Por hacer | `GET /analytics/period-compare?range=` |
| Métricas de ventas por trabajador | Por hacer | `GET /sales/by-worker` |

Spec técnica detallada: [docs/extra/análisis-planes/spec-tecnicas.md](extra/análisis-planes/spec-tecnicas.md).

### Medio plazo — Variante B: "Gestión integral" (est. 6–8 semanas)

| Feature | Estado |
|---|---|
| Presupuestos mensuales | Solo idea, sin spec técnica |
| Historial de precios Fase 2 (forecasts, gráficos de evolución temporal) | Spec parcial en [docs/extra/price-history-fase-2.md](extra/price-history-fase-2.md) |

### Largo plazo — Núcleo contable (est. ~55 días)

Requiere cambio arquitectónico significativo. No comenzar sin alineación del equipo.

| Fase | Descripción |
|---|---|
| 1 | Plan de cuentas + asientos contables (doble entrada) |
| 2 | Periodos fiscales con bloqueo de transacciones pasadas |
| 3 | COGS y margen bruto capturado al momento de la venta |
| 4 | AR/AP, tipo de cambio por transacción, conciliación bancaria CSV |

Spec completa: [docs/extra/CONTABILIDAD_NUCLEO.md](extra/CONTABILIDAD_NUCLEO.md).

### Sin fecha definida

| Feature | Notas |
|---|---|
| OAuth con Google | Rama existe (`feature/auth-google`), falta backend |
| Categorías de producto globales | Frontend hecho y revertido; espera definición de backend ([docs/PENDIENTE-categorias-producto-globales.md](PENDIENTE-categorias-producto-globales.md)) |
| Gestión de divisas (conversión dinámica) | Frontend hecho y revertido; pendiente de re-alineación |
| Migración a SPA (`move-to-spa`) | Rama en curso; ver [docs/conversion-a-estatico.md](conversion-a-estatico.md) |
| Tests automatizados | Cero cobertura actualmente — riesgo alto para releases futuros |

---

## Deuda técnica

### Resuelta

| Problema | Resolución |
|---|---|
| `console.log` en código de producción | ✅ Eliminados — cero ocurrencias en `src/` (commit en develop) |
| Tipos duplicados entre `lib/types/` e inline | ✅ Las interfaces inline son props de componentes (práctica estándar React); tipos de dominio centralizados en `src/lib/types/` |
| JWT en sessionStorage | ✅ Trade-off documentado e intencional — cookies solo sirven al middleware; la sesión expira al cerrar la pestaña (ver `docs/extra/AUDIT.md`) |
| Query keys con riesgo de cache leak entre negocios | ✅ Todos los hooks incluyen `businessId` en la key (`["entity", businessId, ...]`); la invalidación cruzada está controlada |

### Pendiente

| Problema | Impacto | Prioridad |
|---|---|---|
| Sin tests automatizados (ni unitarios ni e2e) | Regresiones no detectadas en CI | Alta |
| Sin Prettier configurado | Inconsistencia de estilo entre archivos | Baja |
| Query keys no centralizados en un archivo de constantes | Renombrar una key requiere buscar en todos los hooks | Baja |

---

## Siguiente acción recomendada

**Orden sugerido:**

1. **Coordinar con backend** los contratos que bloquean la promoción:
   - **Corregir el bug SQL de `expenseCategoryId`** en `POST/PATCH /expenses` (parámetro `:categoryId` sin enlazar) — ver detalle arriba.
   - **Notificaciones in-app** — Parte 2 del contrato: canal `in_app`, `readAt`, y endpoints para listar/contar/marcar ([docs/notificaciones-internas.md](notificaciones-internas.md)).
   - Endpoints de alertas de stock: `GET /businesses/:id/stock-alerts` + `PATCH .../stock-alert` ([docs/backend-alertas-stock.md](backend-alertas-stock.md)).
2. **Crear PR `develop → main`** con los **71 commits** acumulados — la deuda de promoción sigue creciendo. Mover bloques del `sdd-develop.md` al `sdd-main.md` en el mismo PR.
3. **Re-aplicar las reversiones** (categorías globales, divisas) cuando backend confirme el modelo — ambos diffs están conservados en el historial.
4. Continuar con Variante A del roadmap (rentabilidad, comparativas, métricas por worker).

---

*Fuentes: `git log`, [docs/sdd/sdd-develop.md](sdd/sdd-develop.md), [docs/sdd/sdd-main.md](sdd/sdd-main.md), [docs/extra/AUDIT.md](extra/AUDIT.md), [docs/extra/CONTABILIDAD_NUCLEO.md](extra/CONTABILIDAD_NUCLEO.md), estructura de `src/`.*
