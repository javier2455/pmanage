# SDD — pmanage (`develop` / Pre-producción)

> **Documento de especificación de la siguiente versión.** Describe el **delta sobre `main`**: trabajo en curso, contratos de backend pendientes y roadmap.
> Para el sistema en producción ver [sdd-main.md](./sdd-main.md).

| | |
|---|---|
| **Rama** | `develop` |
| **Versión en `package.json`** | `2.0.0` (alineada con `main` tras la promoción) |
| **Último commit** | `5bc8fe8` (al 2026-06-27) |
| **Entorno** | Pre-producción / staging (`/dev`) |
| **Sirve para** | Validar features antes de promover a `main` |
| **Backend** | `https://psearch.dveloxsoft.com/api/v2` (mismo que producción) |
| **Última actualización del documento** | 2026-06-27 |

---

## 1. Resumen ejecutivo

Con la **v2.0.0** se promovió a `main` todo el delta acumulado (features 1–42). El catálogo
completo y las specs por feature viven ahora en [sdd-main.md](./sdd-main.md) §5b.

`develop` queda alineado con `main`. Lo único que **no** está plenamente operativo en
producción son las features cuyo **frontend ya embarcó** pero esperan que el backend
entregue su contrato (§2), más el trabajo en ramas sin merge (§3) y el roadmap (§4).

| Pendiente | Tipo | Estado | Referencia |
|---|---|---|---|
| Alertas de stock bajo/agotado | Contrato backend | Frontend en prod, endpoints pendientes | §2.1 |
| Notificaciones internas (in-app, generales) | Contrato backend | Frontend en prod, canal `in_app`/`readAt` pendiente | §2.2 |
| Selección de plan self-service / trial Pro | Contrato backend | Frontend en prod, `POST /plans/select` + enforcement pendiente | §2.3 |
| `expenseCategoryId` en gastos | Bug backend | Frontend en prod, error SQL `:categoryId` | §2.4 |
| `currency` en gastos + conversión pagos base ≠ CUP | Bug backend | Frontend en prod | §2.4 |
| Categoría a nivel de `BusinessProduct` | Migración backend | Frontend en prod, faltan datos + `PATCH .../category` | §2.4 |
| OAuth con Google | Rama sin merge | `feature/auth-google` | §3 |

> El detalle funcional de cada feature (qué hace, archivos, criterios) está en
> [sdd-main.md](./sdd-main.md) §5b. Aquí solo se rastrea **lo que falta** para cerrarlas.

---

## 2. Contratos de backend pendientes (frontend ya en producción)

Estas features embarcaron su frontend con la v2.0.0 pero quedan **inertes** hasta que el
backend entregue lo indicado. Las llamadas (`apiClient`) ya apuntan a las rutas definidas.

### 2.1. Alertas de stock bajo / agotado

**Bloqueador.** Endpoints pendientes:
- `GET /businesses/:id/stock-alerts` — lista productos con alerta activa.
- `PATCH /businesses/:businessId/products/:productId/stock-alert` — actualiza el umbral.

El emisor de alertas (Business Settings, multi-canal) ya está entregado (ver
[sdd-main.md](./sdd-main.md) §5b, feature 20). Contrato completo en
[docs/backend-alertas-stock.md](../backend-alertas-stock.md). Archivos frontend:
[src/lib/api/stock-alerts.ts](../../src/lib/api/stock-alerts.ts),
[src/hooks/use-stock-alerts.ts](../../src/hooks/use-stock-alerts.ts),
[src/components/inventory/](../../src/components/inventory/).

### 2.2. Notificaciones internas / in-app (generales por negocio)

**Bloqueador.** El backend debe añadir un canal `in_app` y estado de leído (`readAt`) a la
entidad `Notification`, y exponer 4 endpoints (listar paginado, conteo de no leídos, marcar
una/todas leídas), más la entrada de sidebar "Notificaciones" en `GET /section`. Contrato en
[docs/notificaciones-internas.md](../notificaciones-internas.md).

> **Nota.** Las **notificaciones de soporte** (por usuario, feature 32) tienen su contrato
> **ya entregado** y funcionan en producción; se fusionan en la misma campana/página. El
> bloqueador aplica solo a las notificaciones **generales** (por negocio).

Archivos frontend: [src/lib/api/notifications.ts](../../src/lib/api/notifications.ts),
[src/hooks/use-notifications.ts](../../src/hooks/use-notifications.ts),
[src/components/notifications/](../../src/components/notifications/).

### 2.3. Selección de plan self-service / trial Pro

**Bloqueador.** El backend debe entregar:
- `POST /plans/select` `{ planType, billingPeriod, keepBusinessId? }` **transaccional** (con `KEEP_BUSINESS_REQUIRED` si falta el negocio a conservar).
- Asignación automática del **trial Pro** (`expireDate = now + 15 días`) al registrar; `expiredPlan`/`hasNeverHadPlan` correctos en `getMe`.
- Campos `status` (`active`/`archived`) y `archivedReason` en `Business` y en `GET /businesses/my-businesses`; suspensión de `Worker`/`Invitation` al downgrade y restauración al volver a Pro.
- **Enforcement server-side**: límite de negocios (`BUSINESS_LIMIT_REACHED`), equipo solo Pro (`PRO_REQUIRED`), escritura bloqueada en `archived` (`BUSINESS_ARCHIVED`), plan vencido (`PLAN_EXPIRED`).

Marcadores `TODO(backend):` en el código. Códigos de error y tabla de contratos en
[docs/análisis-planes/backend-cambios.md](../análisis-planes/backend-cambios.md).

### 2.4. Bugs / migraciones de backend en features ya embarcadas

| Punto | Síntoma | Qué debe hacer el backend |
|---|---|---|
| `expenseCategoryId` en gastos | `POST /expenses` → 500, error SQL `near ':categoryId'` | Enlazar el parámetro y persistir `expenseCategoryId` en `POST/PATCH`; devolverlo en `GET`. |
| `currency` en gastos | `POST /expenses` → 400 `"property currency should not exist"` | Aceptar `currency` en el DTO de gastos. |
| Conversión de pagos base ≠ CUP | Pago en EUR sobre venta en USD se acredita mal; no llega a `paid` | Corregir el cruce de tasas ([docs/bug-conversion-pagos-multimoneda.md](../bug-conversion-pagos-multimoneda.md)). |
| Categoría en `BusinessProduct` | Productos existentes quedan sin categoría; cambiar categoría da 404 | Migrar la categoría de `Product` a `BusinessProduct`; implementar `PATCH .../products/:bpId/category`; paginar `GET /category`. |
| Decimales en `add-stock` | Riesgo de redondeo a entero | Confirmar persistencia de cantidades fraccionarias (peso/volumen). |

---

## 3. Trabajo en curso (ramas en flight)

| Rama | Último commit | Estado | Notas |
|---|---|---|---|
| `feature/auth-google` (remota) | `35eee53` | En revisión | Popup OAuth con Google. Requiere endpoint backend `/auth/google`. |
| `move-to-spa` | — | En curso | Migración/afinado de la conversión a estático. Ver [docs/conversion-a-estatico.md](../conversion-a-estatico.md). |

> Validar si quedan ramas locales obsoletas (`cooing-weather`, `feature-providers`) y borrarlas.

---

## 4. Roadmap (no implementado)

Tomado de [docs/extra/análisis-planes/analisis-planes.md](../extra/análisis-planes/analisis-planes.md) y [docs/extra/CONTABILIDAD_NUCLEO.md](../extra/CONTABILIDAD_NUCLEO.md).

### 4.1. Variante A — "Más datos, mismas operaciones" (est. 2–3 semanas)

Reportes sobre la información que ya capturamos. **Sin nuevas entidades**, solo agregaciones y filtros nuevos.

| Feature | Descripción | Endpoint backend necesario |
|---|---|---|
| Rentabilidad por producto | Margen = venta − costo entrada × cantidad vendida | `GET /products/profitability?from=&to=` |
| Comparativas de periodos | Ventas/gastos de este mes vs. el anterior | `GET /analytics/period-compare?range=` |
| Métricas por trabajador | Ventas atribuibles a cada worker | `GET /sales/by-worker` |

Spec técnica: [docs/extra/análisis-planes/spec-tecnicas.md](../extra/análisis-planes/spec-tecnicas.md).

### 4.2. Variante B — "Gestión integral" (est. 6–8 semanas)

| Feature | Estado de preparación |
|---|---|
| Caja — Fase 2 (libro de movimientos, ajustes manuales, flujo por período) | Frontend F1 en prod; falta backend ([docs/flujo-de-caja.md](../flujo-de-caja.md)) |
| Presupuestos mensuales | Solo idea, sin spec |
| Historial de precios — fase 2 (forecasts, gráficos comparativos) | Ver [docs/extra/price-history-fase-2.md](../extra/price-history-fase-2.md) |

### 4.3. Núcleo contable (largo plazo, est. ~55 días)

Resumen de [docs/extra/CONTABILIDAD_NUCLEO.md](../extra/CONTABILIDAD_NUCLEO.md), 4 fases:

1. **Plan de cuentas + asientos contables** (doble entrada).
2. **Periodos fiscales con bloqueo** — impide editar transacciones de periodos cerrados.
3. **COGS y margen bruto** — captura el costo unitario al momento de la venta.
4. **AR/AP, snapshots de tipo de cambio por transacción, conciliación bancaria con CSV.**

Este bloque cambia significativamente la arquitectura: requiere modelar `JournalEntry`, `Account`, `FiscalPeriod`, etc. Discutir antes de comenzar.

### 4.4. Calidad / testing (continuo)

- Subir la pirámide de tests: componentes/integración (Testing Library + MSW) y E2E (Playwright) sobre los caminos críticos de dinero/acceso. Base actual (84 tests de lógica pura) en [docs/testing.md](../testing.md).

### 4.5. Otros candidatos

- OAuth Google (rama existe, falta merge — ver §3).
- Notificaciones push o email para alertas de stock.

---

## 5. Política de promoción `develop` → `main`

### Criterios mínimos para promover una feature

1. **Mergeada en develop** y probada en el deploy de develop (`/dev`).
2. **Sin regresiones** reportadas por el equipo después de >48h en pre-producción.
3. **SDD actualizado**: el bloque correspondiente se mueve de `sdd-develop.md` a `sdd-main.md` en el mismo PR de promoción.
4. **Backend compatible**: si depende de endpoints nuevos, éstos ya están en producción del backend. (Excepción documentada en v2.0.0: features embarcadas como ⚠️ con su frontend inerte hasta el contrato — ver §2.)
5. **Sin TODOs críticos** ni `console.log` agregados nuevos.

### Mecanismo

1. Crear PR `release/vX.Y.Z → main` con changelog acumulado.
2. En ese mismo PR, mover los bloques en los SDDs.
3. Actualizar el campo "Versión en `package.json`" y el commit hash en la cabecera de `sdd-main.md`.
4. **`public/.htaccess` sin `/dev/`** y verificarlo en el `out/` y en el servidor (ver [docs/estado-proyecto.md](../estado-proyecto.md) → "Promoción a producción v2").
5. Mergear con merge commit (no squash) para preservar la historia de develop.
6. Taggear la versión: `git tag vX.Y.Z && git push --tags`.

---

## 6. Guía para el equipo (y para Claude)

### 6.1. Cómo agregar una feature nueva

1. **Branch desde `develop`** con nombre descriptivo: `feature/<area>-<corta>` o `fix/<area>-<corta>`.
2. Si la feature introduce una entidad nueva, agregar:
   - `src/lib/routes/<entity>.ts` con los endpoints.
   - `src/lib/types/<entity>.ts` con los tipos.
   - `src/lib/validations/<entity>.ts` con schemas Zod.
   - `src/hooks/use-<entity>.ts` con los hooks de React Query.
   - Componentes en `src/components/<entity>/`.
3. Si toca el menú lateral, actualizar permisos en [src/lib/routes/menu.ts](../../src/lib/routes/menu.ts).
4. Si es feature Pro, añadirla a `PRO_ROUTES` en [src/lib/pro-gates.ts](../../src/lib/pro-gates.ts) y al renderizado del `<ProBadge>` correspondiente.
5. **Si añades una ruta dinámica `[param]`**: exporta `generateStaticParams()` (placeholder `__dynamic__` o valores reales) y añade su regla en [public/.htaccess](../../public/.htaccess) (con `/dev/` en develop, sin él en main). Ver [docs/conversion-a-estatico.md](../conversion-a-estatico.md).
6. Si hay lógica pura nueva (dinero, stock, validación), añadir su suite en `src/testing/suites/`.
7. **Actualizar este documento** en el mismo PR.
8. PR contra `develop` con descripción, screenshots si hay UI, y checklist de criterios de aceptación.

### 6.2. Convenciones

- **Query keys de React Query**: usar arrays `[entity, businessId, ...args]` — nunca strings sueltos.
- **Schemas Zod**: viven en `src/lib/validations/`, no inline.
- **Forms**: React Hook Form + zodResolver, siempre.
- **Currency display**: usar `formatMoney(value, currency)` de [src/lib/currency.ts](../../src/lib/currency.ts) (código de moneda como sufijo). **No** usar `Intl.NumberFormat` con `style: "currency"`: `EURO`/`MLC` no son ISO 4217 y rompen el formateo. Nunca concatenar `"$"` manualmente ni hardcodear `"COP"`/`"CUP"`. Las monedas seleccionables salen de `getAvailableCurrencies(exchange)`, no de listas fijas.
- **Mutations**: invalidar solo las queries específicas afectadas; no usar `queryClient.invalidateQueries()` sin key.
- **Imports**: usar alias `@/` definido en `tsconfig.json`.

### 6.3. Cuando un PR rompe la convención

Actualizar primero esta sección o §6.2, **luego** mergear el PR. Si el cambio amerita un ADR mini en `sdd-main.md`, agregarlo en el PR de promoción.

---

## 7. Mantenimiento de este documento

- Cada PR a `develop` que añade/quita/cambia una feature debe **editar este documento** en el mismo commit.
- Cuando una feature pasa a `main`, su bloque se **mueve** (no se duplica) a [sdd-main.md](./sdd-main.md).
- Cuando un ítem del roadmap se cierra como descartado, anótalo en §4 con una línea y la fecha.
- La tabla §1 (Resumen ejecutivo) es el dashboard de lo pendiente. Si la editas, asegúrate de que refleja la realidad de `git log main..develop`.

---

## 8. Anexo — Comandos útiles

```bash
# ¿Qué hay en develop que no esté en main?
git log main..develop --oneline

# Diff de archivos modificados develop vs main
git diff main..develop --stat

# Archivos que existen en main pero ya no en develop (borrados que el merge debe respetar)
git diff --diff-filter=D --name-only main develop

# Promover: PR de release a main
gh pr create --base main --head release/vX.Y.Z --title "Release vX.Y.Z" --body "..."
```
