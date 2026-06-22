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
- [ ] Reemplazar las 4 tarjetas KPI estáticas con datos reales (ventas del día, balance, transacciones)
- [ ] Reemplazar la lista "Ventas recientes" con datos de `useAllSalesByBusinessId`
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
- [ ] Descomentar y completar la constante `EXCHANGE_RATES` en `/business/sales/create/page.tsx`
- [ ] Agregar selector de moneda en el formulario de venta (CUP / USD / EUR)
- [ ] Calcular el equivalente automáticamente usando el tipo de cambio registrado en `/exchange-rate`

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
- [ ] Agregar botón "Exportar" en cierre diario y mensual
- [ ] Implementar exportación a PDF del resumen financiero + tablas (librería: `@react-pdf/renderer` o `jspdf`)
- [ ] Implementar exportación a CSV de las tablas de ventas e inventario

### Gráficas en el dashboard
- [ ] Instalar `recharts` (compatible con Next.js y shadcn)
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
- [ ] Definir umbral de stock bajo (configurable por producto o global en settings)
- [ ] Mostrar badge de advertencia en el sidebar junto a "Inventario" cuando haya productos bajo el umbral
- [ ] Mostrar banner o notificación en la página de inventario listando los productos críticos

### Cancelación con motivo en ventas
- [ ] Agregar campo de texto "Motivo" en `CancelSaleDialog`
- [ ] Enviar el motivo en el payload de cancelación
- [ ] Mostrar el motivo en el diálogo de detalles de la venta (`details-dialog.tsx` en sales)

---

## Fase 4 — Escalabilidad y administración

### Roles y permisos granulares
- [ ] Definir roles adicionales: `empleado` (solo ventas), `supervisor` (ventas + reportes)
- [ ] Proteger rutas y secciones según rol en el middleware de Next.js
- [ ] Mostrar/ocultar ítems del sidebar según rol del usuario autenticado

### Mejoras en plan Pro — múltiples negocios
- [ ] Agregar buscador en `BusinessSwitcher` cuando el usuario tiene más de 3 negocios
- [ ] Indicar visualmente cuál es el negocio activo con un checkmark o resaltado más claro
- [ ] Mostrar contador de negocios vs límite del plan actual

### Log de actividad
- [ ] Definir tipo `ActivityLog` (quién, qué acción, qué recurso, cuándo)
- [ ] Registrar en el backend: ventas creadas/canceladas, stock modificado, datos del negocio actualizados
- [ ] Crear sección "Actividad" en el dashboard para visualizar el historial

### Notificaciones en tiempo real
- [ ] Evaluar WebSockets vs Server-Sent Events según capacidad del backend
- [ ] Notificar cuando una venta es cancelada por otro usuario de la misma sesión de negocio
- [ ] Notificar cuando el stock de un producto llega a cero
- [ ] Icono de campana en la barra superior con contador de notificaciones no leídas

---

## Mejoras técnicas transversales

### Autenticación
- [ ] Completar el flujo de refresh token silencioso en el interceptor de `lib/axios.ts`
- [ ] Redirigir al login automáticamente cuando el refresh falla (actualmente solo se maneja el 401 inicial)

### Caché y rendimiento
- [ ] Configurar `staleTime` apropiado en los hooks de react-query según la frecuencia de actualización de cada recurso
- [ ] Agregar `gcTime` para controlar cuánto tiempo se mantienen los datos inactivos en caché

### Coordenadas geográficas en negocios
- [ ] Descomentar campos `lat` y `lng` en `createBusinessSchema` (`lib/validations/business.ts`)
- [ ] Agregar un selector de mapa en el formulario de creación/edición de negocio (librería: `leaflet` o `mapbox-gl`)
- [ ] Mostrar la ubicación del negocio en la página de detalles

### PWA
- [ ] Instalar y configurar `next-pwa`
- [ ] Definir estrategia de caché offline para las páginas más usadas (ventas, inventario)
- [ ] Agregar manifiesto con ícono y nombre de la app para instalación en móvil

### Tests
- [ ] Configurar `vitest` o `jest` con `testing-library/react`
- [ ] Tests unitarios para todos los schemas zod en `lib/validations/`
- [ ] Tests unitarios para funciones de utilidad (`getPaginationStripItems`, `formatClosingCurrency`, etc.)
- [ ] Tests de integración para los flujos críticos: login, crear venta, actualizar stock
