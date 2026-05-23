# Historial de Precios — Fase 2 (Comparación Multi-Producto)

## Objetivo

Permitir a usuarios del **plan Pro** comparar la evolución de precios de
**varios productos a la vez** en un mismo gráfico, para detectar
correlaciones, anomalías o tendencias por categoría.

La Fase 1 (entrega individual por producto desde el popover de acciones de la
tabla de productos) ya está implementada. Esta fase la complementa sin
reemplazarla.

## Ubicación propuesta

Sección dentro de Analytics: ruta nueva
`/dashboard/analytics/price-comparison`.

Justificación:
- `/dashboard/analytics` ya está gateado por plan Pro vía `PRO_ROUTES`
  ([src/lib/pro-gates.ts](../src/lib/pro-gates.ts)). No hay que duplicar
  guards.
- El análisis comparativo es un caso de "dashboard" — no encaja en la fila
  de la tabla.

## Flujo de usuario

1. Desde la tabla de productos
   ([src/components/products/business-products-table-columns.tsx](../src/components/products/business-products-table-columns.tsx))
   habilitar **multi-select** (checkbox por fila) — solo visible para Pro.
2. Al seleccionar 2+ productos aparece un botón flotante / barra de acciones
   con **"Comparar precios"**.
3. El botón navega a `/dashboard/analytics/price-comparison?products=id1,id2,id3`.
4. La vista renderiza:
   - **Selector de rango de fechas compartido** (reutilizar
     [src/components/analytics/date-range-picker.tsx](../src/components/analytics/date-range-picker.tsx)).
   - **Gráfico de líneas multi-serie** con `recharts` (v3.8.0, ya instalado).
     Una línea por producto, color distinto, leyenda interactiva.
   - **Tabla resumen** con: nombre, precio actual, mín, máx, variación %.
   - **Click en un punto del gráfico** abre el mismo `PriceHistoryDialog`
     de Fase 1 para ese producto puntual.

## Consideraciones

### Unidades distintas
Los productos pueden tener unidades diferentes (`kg`, `lb`, `g`, `L`, `mL`,
`ud`) — definidas en
[src/lib/types/product.ts](../src/lib/types/product.ts).
Comparar precio absoluto entre `kg` y `ud` no tiene sentido directo.

Opciones:
- **A.** Mostrar aviso si el set seleccionado mezcla unidades, sin normalizar
  (más simple, transparente).
- **B.** Permitir agrupar por unidad y mostrar un gráfico por grupo.
- **C.** Normalizar a una unidad base (complejo, requiere factores de
  conversión y no aplica a `ud`).

Recomendación: **A** en el MVP, **B** si la demanda lo justifica.

### Fetching
Reutilizar `useProductPriceHistoryByRange` de
[src/hooks/use-product-price-history.ts](../src/hooks/use-product-price-history.ts)
en paralelo para cada producto. TanStack Query ya soporta esto sin trabajo
extra; cada query es independiente y cacheable.

### Performance
- Limitar a un máximo razonable de productos comparables a la vez
  (sugerido: **5**). Más líneas saturan el gráfico y la leyenda.
- Si el backend permite, exponer un endpoint batch
  (`/product-price-history/batch?ids=...&startDate=...`) para reducir
  N requests. Por ahora N requests paralelos son aceptables.

## Componentes reutilizables ya construidos en Fase 1

- `src/lib/types/price-history.ts` — tipos compartidos
- `src/lib/api/product-price-history.ts` — funciones API (incluye paginación)
- `src/hooks/use-product-price-history.ts` — hooks de TanStack Query
- `src/components/products/price-history-dialog.tsx` — modal individual
  (se reutiliza al hacer click en un punto del gráfico)

## Pendientes para arrancar la Fase 2

- [ ] Decidir si se expone un endpoint batch en el backend.
- [ ] Definir UX del multi-select en la tabla (checkbox column + barra de
  acciones flotante).
- [ ] Mockear datos de varios productos con el generador
  determinístico para validar visualmente el gráfico antes de tener backend.
