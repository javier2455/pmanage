# Estado del proyecto — pmanage

> Documento de referencia del estado real del proyecto. Incluye lo implementado, lo que está en curso y las proyecciones de desarrollo.
> Última actualización: **2026-06-03** (sistema multi-moneda con conversión dinámica, PR #10).

---

## Snapshot general

| | |
|---|---|
| **Versión actual** | `1.4.0-alpha` (rama `develop`) |
| **Versión en producción** | `1.0.0` (rama `main`) |
| **Commits por delante de `main`** | **53** |
| **Último commit** | `e741fce` — 2026-06-03 (merge PR #10, moneda) |
| **PR `develop → main`** | **No creado** — deuda de promoción acumulada |
| **Bloqueador para promover** | Backend debe agregar item de menú "Categorías" en `GET /menu/` y aceptar `expenseCategoryId` en el payload de gastos |

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
| 5 | Sección Categorías (CRUD de categorías de gastos) | `fbfff42` | Backend debe agregar item en `GET /menu/` |
| 6 | Selector de categoría en formulario de gasto | `0dad138` | Backend debe aceptar `expenseCategoryId` en payload de gasto |
| 7 | Módulo de Proveedores completo (CRUD + detalle) | #9, `50a959d`, `636a506` | — |
| 8 | Tabla de productos por proveedor | `8ef2b3d` | — |
| 9 | Auto-completar precio de entrada desde proveedor | `25e2b6a` | — |
| 10 | Refactor sidebar con secciones y visibilidad por rol | `a5a2a03` | — |
| 11 | Gestión de submenús (admin navigation) | `4c579ce` | — |
| 12 | Historial de inventario con timeline completo | `3138a7e` | — |
| 13 | Back navigation en inventario y catálogo | `3138a7e` | — |
| 14 | Validación y estilo de `phone-input` | `636a506`, `3138a7e` | — |
| 15 | **Alertas de stock bajo / agotado** (frontend completo) | `3eaf9c3` | **Backend pendiente** (ver spec en `docs/backend-alertas-stock.md`) |
| 16 | **Exportación a PDF y Excel** en cierre diario y mensual | — | — (Pro gateado) |
| 17 | **Sistema multi-moneda con conversión dinámica** (ingreso y visualización en CUP/USD/EUR regidos por las tasas) | #10, `348fbaa` | — (no requiere backend; almacena en CUP) |

### Detalle: Alertas de stock bajo (feature Pro) — `3eaf9c3`

El frontend está completo. Permite configurar un umbral por producto (`stockAlertThreshold`) al asignarlo al negocio o desde el diálogo en la tabla de inventario. Muestra badges por fila ("Sin stock" / "Stock bajo") y un banner-resumen en la página de inventario.

Espera los siguientes endpoints del backend:
- `GET /businesses/:id/stock-alerts` — lista productos con alerta activa
- `PATCH /businesses/:businessId/products/:productId/stock-alert` — actualiza umbral

Spec completa del contrato en [docs/backend-alertas-stock.md](backend-alertas-stock.md).

### Detalle: Sistema multi-moneda con conversión dinámica — #10 (`348fbaa`)

Hasta ahora las tasas de `/dashboard/exchange-rate` solo se usaban en esa pantalla.
Esta feature las convierte en la fuente de verdad para **ingresar** y **visualizar**
precios en CUP/USD/EUR en toda la app, **sin cambios de backend** (el sistema sigue
almacenando todo en CUP).

- **Ingreso:** `MoneyAmountInput` (selector + preview) en asignar producto, dar
  entrada, gasto, precios de proveedor y editar precio; convierte a CUP antes de enviar.
- **Visualización:** selector global en la barra superior (persistido en `localStorage`)
  + toggles locales en el punto de venta + equivalencias en diálogos de detalle.
  Cubre tablas, dashboard, analytics y cierres contables.
- **Disponibilidad:** CUP siempre; USD/EUR solo con tasa válida (`> 0`). Sin tasas,
  todo opera en CUP. Convención: valor guardado = CUP por unidad (`monto × tasa`).
- **Núcleo:** `src/lib/utils/currency.ts`, `src/context/currency-context.tsx`,
  `useActiveExchangeRates`, `src/components/ui/currency/*`. Ver §2.11 de
  [sdd-develop.md](sdd/sdd-develop.md).

---

## En curso — ramas no mergeadas

| Rama | Qué hace | Bloqueador |
|---|---|---|
| `feature/auth-google` | OAuth con Google (popup) | Endpoint backend `/auth/google` |
| `fix/cors-error` | Limpia `src/app/api/` que causa CORS al deployar | En revisión, listo para merge |

---

## Proyecciones de desarrollo

### Próximo — Variante A: "Más datos, mismas operaciones" (est. 2–3 semanas)

No requiere entidades nuevas. Todo es agregación sobre datos ya capturados.

| Feature | Estado frontend | Endpoint backend necesario |
|---|---|---|
| Alertas de stock bajo/agotado | ✅ Implementado | `GET /businesses/:id/stock-alerts` + `PATCH .../stock-alert` |
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
| Notificaciones push/email para alertas de stock | Sin spec, complementa la alerta de stock ya implementada |
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

1. **Mergear `fix/cors-error`** a develop — es un fix de infraestructura que debería incluirse en el próximo release.
2. **Coordinar con backend** dos puntos antes del PR a main:
   - Item de menú "Categorías" en `GET /menu/` (para eliminar el `static-fallback.ts`)
   - Aceptar `expenseCategoryId` en payload de gasto
3. **Crear PR `develop → main`** con los 53 commits acumulados. Mover bloques del `sdd-develop.md` al `sdd-main.md` en el mismo PR.
4. **Implementar endpoints de alertas de stock** en backend — el frontend ya está listo y esperando.
5. Continuar con Variante A del roadmap (rentabilidad, comparativas, métricas por worker).

---

*Fuentes: `git log`, [docs/sdd/sdd-develop.md](sdd/sdd-develop.md), [docs/sdd/sdd-main.md](sdd/sdd-main.md), [docs/extra/AUDIT.md](extra/AUDIT.md), [docs/extra/CONTABILIDAD_NUCLEO.md](extra/CONTABILIDAD_NUCLEO.md), estructura de `src/`.*
