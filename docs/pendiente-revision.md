# Estado del proyecto — Pendiente a revisión

> Documento de estado generado el **2026-05-28**. Refleja la investigación cruzada del historial de git, los SDDs y la estructura del código fuente.

---

## Resumen ejecutivo

| | |
|---|---|
| **Versión actual** | `1.3.1-alpha` (rama `develop`) |
| **Versión en producción** | `1.0.0` (rama `main`) |
| **Commits por delante de `main`** | **47** |
| **Último commit** | `3138a7e` — 2026-05-27 |
| **Estado del PR `develop → main`** | **No creado** — hay deuda de promoción acumulada |

El proyecto ha avanzado significativamente más allá de lo que refleja el `sdd-develop.md` original (que documentaba la versión `1.0.7-alpha`). El módulo de Proveedores y varias integraciones menores estaban marcados como "pendientes" en el SDD pero ya están implementados y mergeados en `develop`.

---

## Lo que estaba pactado y ya está hecho

### Módulos en producción (`main` v1.0.0)

| Módulo | Plan |
|---|---|
| Autenticación (login, registro, verificación, reset de contraseña, aceptar invitación) | — |
| Dashboard con stats de ventas y gastos recientes | Básico+ |
| Analytics (KPIs: ingresos, beneficio, ticket promedio, cancelaciones, valor inventario; tendencias; top productos) | Básico+ |
| Gestión de negocios (multi-negocio, detalles, geolocalización) | Básico (1) / Pro (3) |
| Productos (CRUD, asignar al negocio, catálogo global) | Básico+ |
| Historial de precios (EditPriceDialog + página dedicada + comparador multi-producto) | Básico+ / Pro |
| Inventario (stock actual, entradas de compra, stock inicial) | Básico+ |
| Ventas (crear, cancelar con razón) | Básico+ |
| Gastos (CRUD) | Básico+ |
| Equipo / Workers (invitaciones, permisos granulares por módulo) | Pro |
| Cierre contable diario | Básico+ |
| Cierre contable mensual | Pro |
| Tipos de cambio multi-moneda (USD, EUR, CUP, MXN, CAD, GBP, CHF, JPY) | Básico+ |
| Planes y suscripción (Básico $5/mes, Pro $15/mes; selector mensual/anual) | — |
| Admin: asignación de planes a usuarios | Admin |
| Búsqueda global | Básico+ |
| Menú/permisos dinámico por rol | — |

### Implementado en `develop` desde el SDD original (v1.1.0 → v1.3.1-alpha)

Estos ítems estaban pendientes o no documentados en el SDD de referencia y **ya están mergeados en `develop`**:

| Feature | Commit(s) | Estado previo en SDD |
|---|---|---|
| **Módulo de Proveedores completo** — CRUD, detalles, página dedicada | #9, `50a959d`, `636a506` | "No — solo documentación" |
| **Tabla de productos por proveedor** (`ProviderProductsTable`) | `8ef2b3d` | No documentado |
| **Auto-completar precio de entrada** desde proveedor en UpdateStockForm | `25e2b6a` | No documentado |
| **Categorías de gasto integradas al formulario** de creación/edición de gasto | `0dad138`, `fbfff42` | §3.1 "Pendiente" |
| **Gestión de submenús** desde el panel de administración de navegación | `4c579ce` | No documentado |
| **Refactor del sidebar** con secciones y visibilidad por rol | `a5a2a03` | No documentado |
| **Historial de inventario** con timeline completo y navegación de vuelta | `3138a7e` | No documentado |
| **Back navigation** en página de edición del catálogo | `3138a7e` | No documentado |
| **Validación y estilo de `phone-input`** | `636a506`, `3138a7e` | No documentado |
| **Comparador multi-producto** en historial de precios (Pro) | `485ae8b` | No documentado |
| **ICON_MAP expandido** y rutas de búsqueda con prefijo `/search` | `7a55b56`, `ffeb665` | No documentado |

---

## Lo que queda pendiente

### Ramas en flight (no mergeadas a `develop`)

| Rama | Qué hace | Bloqueador |
|---|---|---|
| `feature/auth-google` | OAuth con Google (popup) | Requiere endpoint backend `/auth/google` |
| `fix/cors-error` | Limpia `src/app/api/` que causa CORS al deployar | En revisión |

### Roadmap Variante A — "Más datos, mismas operaciones" (est. 2–3 semanas)

Trabajo sobre datos ya capturados, **sin nuevas entidades de dominio**.

| Feature | Endpoint backend necesario |
|---|---|
| Alertas de stock bajo | `GET /products/low-stock?threshold=` |
| Rentabilidad por producto (margen = venta − costo entrada × cantidad) | `GET /products/profitability?from=&to=` |
| Comparativas de periodos (este mes vs. anterior) | `GET /analytics/period-compare?range=` |
| Métricas de ventas por trabajador | `GET /sales/by-worker` |

### Roadmap Variante B — "Gestión integral" (est. 6–8 semanas)

| Feature | Estado de preparación |
|---|---|
| Presupuestos mensuales | Solo idea, sin spec técnica |
| Historial de precios Fase 2 (forecasts, gráficos de evolución) | Documento en `docs/extra/price-history-fase-2.md` |

### Núcleo contable — largo plazo (est. ~55 días)

Cambio arquitectónico significativo. No comenzar sin alineación del equipo.

| Fase | Descripción |
|---|---|
| 1 | Plan de cuentas + asientos contables (doble entrada) |
| 2 | Periodos fiscales con bloqueo de transacciones pasadas |
| 3 | COGS y margen bruto capturado al momento de la venta |
| 4 | AR/AP, tipo de cambio por transacción, conciliación bancaria CSV |

Spec completa en [docs/extra/CONTABILIDAD_NUCLEO.md](extra/CONTABILIDAD_NUCLEO.md).

### Otras features pendientes sin fecha

- Exportaciones a Excel/PDF (mencionada como feature Pro, no implementada)
- Notificaciones push o email para alertas de stock bajo
- Tests automatizados (actualmente: cero cobertura, ni unitarios ni e2e)

---

## Deuda técnica activa

Extraída del [docs/extra/AUDIT.md](extra/AUDIT.md):

| Problema | Impacto | Prioridad |
|---|---|---|
| **Query keys dispersos** — definidos como strings sueltos en 12+ archivos | Riesgo de invalidaciones cruzadas entre negocios | Alta |
| **JWT en sessionStorage** en lugar de httpOnly cookie | Exposición a XSS; trade-off documentado | Media |
| **`console.log` en código de producción** — ~12 ocurrencias | Fuga de información en consola | Media |
| **Sin tests automatizados** | Regresiones no detectadas en CI | Alta |
| **Sin Prettier configurado** | Inconsistencia de estilo entre archivos | Baja |
| **Tipos duplicados** entre `lib/types/` y declaraciones inline en componentes | Mantenimiento difícil | Baja |

---

## Punto donde estamos hoy

### Situación del flujo `develop → main`

El PR de promoción `develop → main` **no se ha creado**. Hay 47 commits acumulados en `develop` que incluyen el módulo completo de Proveedores, las categorías integradas, mejoras de UX y refactors internos.

**Criterio de bloqueo identificado:** el módulo de Categorías depende de que el backend agregue el item de menú `"Categorías"` en `GET /menu/`. Mientras tanto funciona via `static-fallback.ts`, pero coordinar esto con backend antes del PR a main evita dejar el fallback en producción.

### Estado del SDD

- `sdd-main.md` documenta `v1.0.0` — **no actualizado** desde que se creó.
- `sdd-develop.md` fue actualizado hoy (2026-05-28) para reflejar `v1.3.1-alpha` y los 47 commits adelante de main.

### Próxima acción sugerida

1. **Coordinar con backend** el item de menú de Categorías y la aceptación de `expenseCategoryId` en gastos.
2. **Crear PR `develop → main`** con changelog acumulado y mover los bloques del SDD-develop al SDD-main.
3. **Mergear `fix/cors-error`** — es un fix de infraestructura que debería ir antes o con el mismo PR.
4. Evaluar si `feature/auth-google` va en este release o en el siguiente.

---

*Documento generado por revisión de código en 2026-05-28. Fuentes: `git log`, `docs/sdd/sdd-develop.md`, `docs/sdd/sdd-main.md`, `docs/extra/AUDIT.md`, `docs/extra/CONTABILIDAD_NUCLEO.md`, estructura de `src/`.*
