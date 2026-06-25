# Roadmap — Negora Sistema de Gestión

Documento de seguimiento de mejoras, funcionalidades pendientes y deuda técnica.
Marca cada ítem con `[x]` cuando esté completado.

---

## Fase 1 — Completar lo que ya está iniciado

> Cosas que existen en el código pero están incompletas o desconectadas.

### Perfil de usuario funcional
- [ ] Leer datos reales del usuario con `useAuthUserData` y poblar los campos del formulario
- [ ] Conectar `react-hook-form` + schema zod para validación de nombre, correo y contraseña
- [ ] Llamar a las mutaciones correspondientes al guardar (actualizar datos personales y contraseña por separado)

### Dashboard con datos reales
- [x] Reemplazar las tarjetas KPI estáticas con datos reales — ahora consumen `dashboardSummary` y agrupan ventas/gastos **por moneda** con contador de transacciones (`StatsCard` + `DashboardCurrencyTotal`); incluye `CashBalanceWidget` de caja
- [x] Reemplazar la lista "Ventas recientes" con datos reales (`recent-sales-table.tsx`)
- [ ] Reemplazar "Actividad reciente" con movimientos reales de inventario o ventas recientes

### Tarjetas de resumen en cierre diario/mensual
- [ ] Descomentar el bloque de 4 cards (Total Ventas, Total Gastos, Balance, Stock Total) en `daily/page.tsx`
- [ ] Descomentar el mismo bloque en `monthly/page.tsx`
- [ ] Ajustar la variable `totalUnitsSold` que el bloque necesita

### Tab "Nuevo producto" en entrada de inventario
- [ ] Descomentar el tab y su `TabsContent` en `/business/inventory/create/page.tsx`
- [ ] Conectar con `NewProductForm` que ya existe en `components/products/`

### Limpieza de código
- [ ] Eliminar `console.log('data', data)` en `app/dashboard/exchange-rate/page.tsx`
- [ ] Eliminar import `Settings` no usado en `components/sidebar/nav-user.tsx`
- [ ] Revisar opciones de query comentadas en hooks (`staleTime`, `enabled`) y configurar las que correspondan

---

## Fase 2 — Mejoras de diseño y UX

### Página de configuración
- [ ] Crear ruta `/dashboard/settings`
- [ ] Descomentar ítem "Configuración" en `nav-user.tsx`
- [ ] Sección de preferencias: tema (claro/oscuro/sistema), moneda por defecto para visualización
- [ ] Sección de notificaciones: preferencias de alertas

### Tipo de cambio en creación de ventas
> Implementado por la **Suite Multimoneda** (feature 33) — las monedas salen de `MonetaryExchange`, no de constantes fijas.
- [x] Selector de moneda en el formulario de venta (monedas derivadas de `getAvailableCurrencies`)
- [x] Cálculo automático del equivalente con la tasa registrada (pagos multimoneda con tasa congelada)

### Separador y pulido visual en resumen financiero
- [ ] Descomentar `<Separator />` dentro del resumen financiero en `daily/page.tsx`
- [ ] Aplicar el mismo ajuste en `monthly/page.tsx`

### Empty states consistentes
- [ ] Auditar todas las tablas del proyecto y asegurarse de que usen el componente `Empty` de `components/ui/empty`
- [ ] Estandarizar iconos y textos de cada estado vacío según el contexto

### Skeleton loaders consistentes
- [ ] Revisar qué páginas/secciones no tienen skeleton durante la carga
- [ ] Aplicar el patrón de `DailyClosePageSkeleton` / `MonthlyClosePageSkeleton` en las secciones que faltan

---

## Fase 3 — Funcionalidades nuevas de alto valor

### Exportar reportes
> Implementado para cierres contables (feature 16, Pro): el backend devuelve un `Blob` y el cliente lo descarga.
- [x] Botón "Exportar" en cierre diario y mensual
- [x] Exportación a **PDF y Excel** del cierre contable (gateado a Pro)
- [ ] Exportación a CSV de las tablas de ventas e inventario

### Gráficas en el dashboard
- [x] Instalar `recharts` (compatible con Next.js y shadcn) — usado en Analytics
- [ ] Gráfica de ventas por día de la semana (últimos 7 días)
- [ ] Gráfica de evolución del balance (últimos 30 días)
- [ ] Gráfica de top 5 productos más vendidos del mes

### Flujo de caja
> Ampliar el módulo de caja (`currency-account`) de la foto del saldo a un flujo
> completo. Detalle y contrato propuesto al backend en [docs/flujo-de-caja.md](docs/flujo-de-caja.md).
- [x] Fase 1 — Consolidación visual: total en moneda base (CUP), tab "Consolidado" y widget en el dashboard
- [ ] Libro de movimientos de caja (requiere `GET /currency-accounts/movements/{businessId}`; ver contrato en el doc)
- [ ] Ajustes manuales de caja: depósito, retiro y transferencia entre monedas (endpoints nuevos)
- [ ] Flujo por período en base caja (entradas vs salidas con saldo corriente, por moneda)
- [ ] Proyección de cobros (ventas pendientes / cuentas por cobrar) — ver `CONTABILIDAD_NUCLEO.md`

### Filtros avanzados en ventas
- [ ] Agregar filtro por rango de fechas en la tabla de ventas (reusar `DateFilter`)
- [ ] Agregar filtro por estado (activa / cancelada)
- [ ] Persistir los filtros activos en la URL como query params

### Alertas de stock bajo
> Frontend completo; emisión multi-canal entregada. Pendientes solo los endpoints de lectura/umbral en backend (ver `docs/backend-alertas-stock.md`).
- [x] Definir umbral de stock bajo configurable por producto (`stockAlertThreshold`)
- [ ] Mostrar badge de advertencia en el sidebar junto a "Inventario" cuando haya productos bajo el umbral
- [x] Mostrar banner/notificación en la página de inventario listando los productos críticos

### Cancelación con motivo en ventas
> Implementado y ampliado a **devolución parcial con merma** (feature 34).
- [x] Campo de texto "Motivo" en `CancelSaleDialog`
- [x] Enviar el motivo (y `items[]` con cantidades a devolver) en el payload de cancelación
- [x] Mostrar el motivo y lo devuelto vs. la merma en el diálogo de detalles de la venta

---

## Fase 4 — Escalabilidad y administración

### Roles y permisos granulares
- [ ] Definir roles adicionales: `empleado` (solo ventas), `supervisor` (ventas + reportes) — cubierto en parte por los **permisos granulares por módulo** de trabajadores (Pro)
- [x] Proteger rutas y secciones según rol/plan — `middleware.ts` (gateo rápido por cookies) + `RouteGuard` cliente (barrera real en build estático) para rutas Pro y `/dashboard/admin/*`
- [x] Mostrar/ocultar ítems del sidebar según rol/plan del usuario autenticado

### Mejoras en plan Pro — múltiples negocios
> Relacionado: la **reconciliación de negocios** (feature 39) ya separa activos vs archivados y aplica el tope por plan (`getMaxBusinesses`: Pro 3, resto 1).
- [ ] Agregar buscador en `BusinessSwitcher` cuando el usuario tiene más de 3 negocios
- [ ] Indicar visualmente cuál es el negocio activo con un checkmark o resaltado más claro
- [ ] Mostrar contador de negocios vs límite del plan actual

### Log de actividad
- [ ] Definir tipo `ActivityLog` (quién, qué acción, qué recurso, cuándo)
- [ ] Registrar en el backend: ventas creadas/canceladas, stock modificado, datos del negocio actualizados
- [ ] Crear sección "Actividad" en el dashboard para visualizar el historial

### Notificaciones en tiempo real
> Campana implementada (con polling); el tiempo real (WS/SSE) y las notificaciones in-app generales siguen pendientes de backend (ver `docs/notificaciones-internas.md`).
- [ ] Evaluar WebSockets vs Server-Sent Events según capacidad del backend
- [ ] Notificar cuando una venta es cancelada por otro usuario de la misma sesión de negocio
- [ ] Notificar cuando el stock de un producto llega a cero
- [x] Icono de campana en la barra superior con contador de notificaciones no leídas (in-app + soporte fusionados)

---

## Mejoras técnicas transversales

### Autenticación
- [ ] Completar el flujo de refresh token silencioso en el interceptor de `lib/axios.ts`
- [ ] Redirigir al login automáticamente cuando el refresh falla (actualmente solo se maneja el 401 inicial)

### Caché y rendimiento
- [ ] Configurar `staleTime` apropiado en los hooks de react-query según la frecuencia de actualización de cada recurso
- [ ] Agregar `gcTime` para controlar cuánto tiempo se mantienen los datos inactivos en caché

### Coordenadas geográficas en negocios
> Implementado con **MapLibre GL** (`maplibre-gl`).
- [x] Campos `lat`/`lng` en el formulario de negocio
- [x] Selector de mapa en creación/edición de negocio (MapLibre)
- [x] Mostrar la ubicación del negocio en la página de detalles

### PWA
- [ ] Instalar y configurar `next-pwa`
- [ ] Definir estrategia de caché offline para las páginas más usadas (ventas, inventario)
- [ ] Agregar manifiesto con ícono y nombre de la app para instalación en móvil

### Tests
- [ ] Configurar `vitest` o `jest` con `testing-library/react`
- [ ] Tests unitarios para todos los schemas zod en `lib/validations/`
- [ ] Tests unitarios para funciones de utilidad (`getPaginationStripItems`, `formatClosingCurrency`, etc.)
- [ ] Tests de integración para los flujos críticos: login, crear venta, actualizar stock
