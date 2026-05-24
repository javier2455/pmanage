# SDD — pmanage (`develop` / Pre-producción)

> **Documento de especificación de la siguiente versión.** Describe el **delta sobre `main`**: features ya implementadas en `develop` que esperan promoverse a producción, trabajo en curso y roadmap.
> Para el sistema en producción ver [sdd-main.md](./sdd-main.md).

| | |
|---|---|
| **Rama** | `develop` |
| **Versión en `package.json`** | `1.0.7-alpha` |
| **Commits por delante de `main`** | 27 (al 2026-05-23) |
| **Entorno** | Pre-producción / staging (pruebas internas) |
| **Sirve para** | Validar features antes de promover a `main` |
| **Backend** | `https://psearch.dveloxsoft.com/api/v2` (mismo que producción) |

---

## 1. Resumen ejecutivo

Cambios respecto a `main` agrupados por estado:

| # | Feature / cambio | Estado | PR | ¿Lista para promover? |
|---|---|---|---|---|
| 1 | Historial de precios — iteración final con `EditPriceDialog` | ✅ Mergeada en develop | #8 | Sí — pendiente PR `develop → main` |
| 2 | Refactor de rutas dinámicas con query params | ✅ Mergeada | (`a18f6c7`) | Sí |
| 3 | Despliegue en subdirectorio (`basePath` + `.htaccess`) | ✅ Mergeada | (`8051f30`, `964c4c7`) | Sí — requiere validar `NEXT_PUBLIC_BASE_PATH` en el deploy real |
| 4 | Limpieza del workflow de cPanel viejo | ✅ Mergeada | (`efdf04e`) | Sí |
| 5 | Endpoints de **categorías de gasto** (`expense-categories`) | 🟡 Sin commit (working tree) | — | **No** — falta integración UI y backend confirmado |
| 6 | Spec backend de **Proveedores** | 🟡 Untracked, documento listo | — | **No** — solo documentación, requiere backend + UI |
| 7 | OAuth con Google | 🔵 En rama remota `feature/auth-google` | — | **No** — no integrado en develop |
| 8 | Fix CORS / limpieza API interna | 🔵 En rama remota `fix/cors-error` | — | **No** — sin merge |

> **Atención.** Las features merged en develop incluyen una **segunda iteración de historial de precios** (PR #8) y un **refactor de la sección de detalles del negocio** que ya están parcialmente reflejados en `main` por commits de cherry-pick directo, pero el estado canónico de la feature vive en `develop`. Verificar antes de promover.

---

## 2. Features mergeadas en `develop` (esperando producción)

### 2.1. Historial de precios — versión refinada (PR #8)

**Qué hace.** Cada vez que cambia el precio de un `BusinessProduct` se registra un `PriceHistoryEntry` con precio anterior, precio nuevo, moneda, usuario y fecha. El usuario puede:

- Editar el precio inline desde la fila del producto vía `EditPriceDialog` (reemplaza el viejo `EditProductForm` + `PriceHistoryTrigger`).
- Ver el historial completo en una **página dedicada** (antes era un modal popover desde la fila).

**Archivos clave.**
- [src/hooks/use-product-price-history.ts](../../src/hooks/use-product-price-history.ts)
- [src/components/products/](../../src/components/products/) — `EditPriceDialog`, `price-history-item.tsx`
- Tipo `PriceHistoryEntry` con `price` y `previousPrice` como **string** (para precisión decimal).

**Criterios de aceptación.**
- Cambiar el precio de un producto crea un nuevo registro de historial visible al instante.
- El historial muestra delta, moneda formateada, usuario que realizó el cambio.
- El historial mock data fue eliminado (commit `d5350f8`); todo viene del backend.

**Riesgos.** Verificar que la migración no rompa instancias donde el campo `price` venía como `number` en el frontend.

---

### 2.2. Rutas de edición con query params (commit `a18f6c7`, `3ba032e`)

**Qué hace.** Las páginas de edición (`products/[id]/edit`, `sales/[id]/edit`, etc.) dejaron de depender exclusivamente del `[id]` dinámico de Next.js. Ahora:

- Las páginas son client components con `useSearchParams()` para leer el id.
- Se mantiene `generateStaticParams()` con el placeholder `__dynamic__`.
- Los links se construyen con `?id=...` cuando aplica.

**Por qué.** Mejor compatibilidad con el export estático, soporte de back-button y URLs compartibles.

**Riesgos.** Si algún link interno aún apunta al patrón `/products/${id}/edit` sin query param, puede romper en producción. Hacer grep antes de promover.

---

### 2.3. Despliegue en subdirectorio (SPA `basePath`)

**Qué cambia.**
- [next.config.ts](../../next.config.ts) lee `NEXT_PUBLIC_BASE_PATH` y aplica `basePath` + `assetPrefix`.
- [public/.htaccess](../../public/.htaccess) maneja rewrites tanto en raíz como en subdirectorio.
- Permite hospedar la app en `example.com/pmanage/` sin cambios de código.

**Criterios de aceptación.**
- Build con `NEXT_PUBLIC_BASE_PATH=/pmanage` produce assets prefijados correctamente.
- Navegación interna no rompe ni en raíz ni en subdir.
- Refresh de cualquier ruta dinámica resuelve gracias al `.htaccess`.

**Riesgos.** El env var debe inyectarse en build, no en runtime (Next export es estático). Documentar en el workflow de deploy.

---

### 2.4. Otros mergeados menores

- **Workflow de cPanel viejo eliminado** (`efdf04e`) — limpia el `.github/workflows/deploy.yml` legacy en favor de `deploy-workflow.yml`.
- **Configuración inicial de basePath** (`8051f30`) y **.htaccess para SPA fallback** (`964c4c7`).
- Bump de versión a `1.0.7-alpha`.

---

## 3. Trabajo en curso (working tree y ramas)

### 3.1. Categorías de gasto — backend listo, frontend pendiente

**Estado.** Archivo modificado sin commit: [src/lib/routes/expenses.ts](../../src/lib/routes/expenses.ts).

**Diff vs `main`.** Se agregaron 5 endpoints:
```
GET    /expense-categories
GET    /expense-categories/:id
POST   /expense-categories
PUT    /expense-categories/:id
DELETE /expense-categories/:id
```

**Qué falta para entregarla.**
- Hook `use-expense-categories.ts` (no existe aún).
- Tipos en `src/lib/types/`.
- Schemas Zod de validación.
- Componentes UI: selector de categoría en formulario de gasto, gestor de categorías en alguna ruta de settings.
- Tests manuales contra el backend.

**Razón.** Forma parte de la **Variante B** del roadmap (gestión integral) — ver §4.

---

### 3.2. Módulo de Proveedores — spec backend lista

**Estado.** Documento untracked: [docs/extra/análisis-planes/spec-suppliers-backend.md](../extra/análisis-planes/spec-suppliers-backend.md) (~569 líneas).

**Cubre.**
- Tablas: `suppliers` (soft delete), `supplier_products`, FK a `inventory_entries`.
- Endpoints CRUD para `suppliers` + ofertas de productos + bulk import.
- Endpoint agregador de historial de compras (total gastado, n° de transacciones).
- Pro-gating: 403 para planes no-Pro.
- Sistema de permisos para workers: nuevo `menuId = "suppliers"` con read/write/update/delete.

**Qué falta.**
- Implementación backend.
- Hook `use-suppliers.ts` y archivo `src/lib/routes/suppliers.ts` en frontend.
- UI: listado, alta, ofertas por proveedor, historial.

---

### 3.3. Ramas en flight

| Rama | Último commit | Estado | Notas |
|---|---|---|---|
| `feature/auth-google` (remota) | `35eee53` | En revisión | Popup OAuth con Google. Requiere endpoint backend `/auth/google`. |
| `fix/cors-error` (remota) | `b71a03a` | En revisión | Limpia carpeta `src/app/api/` no usada que causaba CORS al deployar. |
| `cooing-weather` (local, `6210db9`) | v0.16.1-beta | Estancada | Refactor de botones y página de asignación de productos. Validar si aún relevante. |
| `feature-providers` (local) | igual a `main` | Placeholder | No tiene cambios reales — borrar o reusar para el módulo de proveedores. |

---

## 4. Roadmap (no implementado)

Tomado de [docs/extra/análisis-planes/analisis-planes.md](../extra/análisis-planes/analisis-planes.md) y [docs/extra/CONTABILIDAD_NUCLEO.md](../extra/CONTABILIDAD_NUCLEO.md).

### 4.1. Variante A — "Más datos, mismas operaciones" (2–3 semanas)

Reportes sobre la información que ya capturamos. **Sin nuevas entidades**, solo agregaciones y filtros nuevos.

| Feature | Idea | Hooks/rutas backend nuevos |
|---|---|---|
| Alertas de stock bajo | Marca productos por debajo de un umbral configurable | `GET /products/low-stock?threshold=...` |
| Rentabilidad por producto | Margen = venta − costo de entrada × cantidad vendida | `GET /products/profitability?from=&to=` |
| Comparativas de periodos | Ventas/gastos de este mes vs el anterior | `GET /analytics/period-compare?range=` |
| Métricas por trabajador | Ventas atribuibles a cada worker | `GET /sales/by-worker` |

Spec técnica: [docs/extra/análisis-planes/spec-tecnicas.md](../extra/análisis-planes/spec-tecnicas.md).

### 4.2. Variante B — "Gestión integral" (6–8 semanas)

Introduce nuevas entidades de dominio.

| Feature | Estado de preparación |
|---|---|
| Módulo de Proveedores | Spec backend listo §3.2 |
| Categorías de gasto | Endpoints listos §3.1, UI pendiente |
| Presupuestos mensuales | Solo idea |
| Historial de precios — fase 2 (forecasts, gráficos) | Ver [docs/extra/price-history-fase-2.md](../extra/price-history-fase-2.md) |

### 4.3. Núcleo contable (largo plazo, ~55 días estimados)

Resumen de [docs/extra/CONTABILIDAD_NUCLEO.md](../extra/CONTABILIDAD_NUCLEO.md), 4 fases:

1. **Plan de cuentas + asientos contables** (doble entrada).
2. **Periodos fiscales con bloqueo** — impide editar transacciones de periodos cerrados.
3. **COGS y margen bruto** — captura el costo unitario al momento de la venta.
4. **AR/AP, snapshots de tipo de cambio por transacción, conciliación bancaria con CSV.**

Este bloque cambia significativamente la arquitectura: requiere modelar `JournalEntry`, `Account`, `FiscalPeriod`, etc. Discutir antes de comenzar.

### 4.4. Otros candidatos

- OAuth Google (rama existe, falta merge).
- Exportaciones a Excel/PDF (mencionado como feature Pro pero no implementado).
- Notificaciones push o email para alertas de stock.

---

## 5. Política de promoción `develop` → `main`

### Criterios mínimos para promover una feature

1. **Mergeada en develop** y probada en el deploy de develop.
2. **Sin regresiones** reportadas por el equipo después de >48h en pre-producción.
3. **SDD actualizado**: el bloque correspondiente se mueve de `sdd-develop.md` a `sdd-main.md` en el mismo PR de promoción.
4. **Backend compatible**: si depende de endpoints nuevos, éstos ya están en producción del backend.
5. **Sin TODOs críticos** ni `console.log` agregados nuevos.

### Mecanismo

1. Crear PR `develop → main` con changelog acumulado.
2. En ese mismo PR, mover los bloques en los SDDs.
3. Actualizar el campo "Versión en `package.json`" y el commit hash en la cabecera de `sdd-main.md`.
4. Mergear con merge commit (no squash) para preservar la historia de develop.
5. Taggear la versión: `git tag v1.x.y && git push --tags`.

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
5. **Actualizar este documento (`sdd-develop.md`) en el mismo PR**: agregar entrada en §2 o §3 según el estado.
6. PR contra `develop` con descripción, screenshots si hay UI, y checklist de criterios de aceptación.

### 6.2. Convenciones

- **Query keys de React Query**: usar arrays `[entity, businessId, ...args]` — nunca strings sueltos. (Pendiente de centralización formal — ver deuda técnica en [sdd-main.md](./sdd-main.md#11-deuda-técnica-conocida)).
- **Schemas Zod**: viven en `src/lib/validations/`, no inline.
- **Forms**: React Hook Form + zodResolver, siempre.
- **Currency display**: formatear con `Intl.NumberFormat` por código de moneda; nunca concatenar `"$"` manualmente.
- **Mutations**: invalidar solo las queries específicas afectadas; no usar `queryClient.invalidateQueries()` sin key.
- **Imports**: usar alias `@/` definido en `tsconfig.json`.

### 6.3. Cuando un PR rompe la convención

Actualizar primero esta sección o §6.2, **luego** mergear el PR. Si el cambio amerita un ADR mini en `sdd-main.md`, agregarlo en el PR de promoción.

---

## 7. Mantenimiento de este documento

- Cada PR a `develop` que añade/quita/cambia una feature debe **editar este documento** en el mismo commit.
- Cuando una feature pasa a `main`, su bloque se **mueve** (no se duplica) a [sdd-main.md](./sdd-main.md).
- Cuando un ítem del roadmap se cierra como descartado, anótalo en §4 con una línea y la fecha.
- La tabla §1 (Resumen ejecutivo) es el dashboard. Si la editas, asegúrate de que refleja la realidad de `git log main..develop`.

---

## 8. Anexo — Comandos útiles

```bash
# ¿Qué hay en develop que no esté en main?
git log main..develop --oneline

# Diff de archivos modificados develop vs main
git diff main..develop --stat

# Promover una feature: PR de develop a main
gh pr create --base main --head develop --title "Release v1.x.y" --body "..."
```
