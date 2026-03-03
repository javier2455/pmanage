# Changelog

Todas las cambios notables del proyecto se documentan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y el proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

---

## [0.2.0-beta] - 2026-03-03

### Agregado

#### Productos
- Componente `ProductsTableSkeleton` para mostrar estado de carga con estructura de tabla (shadcn)
- Skeleton en página de productos durante carga inicial (`isLoading`) y refetch tras crear/editar/eliminar (`isFetching`)

### Corregido

#### Crear producto
- Combobox de unidad no sincronizaba con react-hook-form (usaba estado local); ahora usa `watch("unit")` y `setValue` para mantener el valor del formulario
- Backend rechazaba `imageUrl`: eliminado del payload en `lib/api/product.ts` y del schema de validación
- Toast de feedback cuando falla la validación del formulario (campos requeridos)

#### StatusBadge
- Badges no mostraban color de fondo: la variante `default` del Badge aplicaba `bg-neutral-900` y sobrescribía las clases personalizadas; ahora usan `variant="ghost"` para que `bg-destructive` y `bg-emerald-500` se apliquen correctamente

#### Invalidación de cache (productos)
- `useEditProductMutation` no invalidaba la lista de productos; ahora invalida `["all-product-of-my-businesses"]` además de la query del producto individual
- La tabla de productos se actualiza correctamente tras crear, editar o eliminar

#### Otros (sesiones anteriores)
- `DeleteDialog`: no se cerraba tras confirmar eliminación; añadido estado `open` controlado y `setOpen(false)` tras `onConfirm` exitoso
- `BusinessProvider`: token expirado causaba 401, lista de negocios vacía y redirección incorrecta; añadido manejo de `isError`, retry sin reintentos en 401, redirección a login y limpieza de localStorage
- `cancelSale`: mismo fix de headers en body (orden de argumentos en `axios.post`)

### Eliminado
- Campo `imageUrl` del schema `createProductSchema` y del formulario de crear producto (el backend no lo acepta)
- `console.log` de debug en `lib/api/product.ts`

---

## [0.1.0-beta] - 2026-03-01

### Funcionalidades del sistema

#### Autenticación
- Registro de usuario con verificación por correo electrónico
- Login con validación de credenciales
- Verificación de código enviado al correo
- Reenvío de código de verificación
- Cierre de sesión con limpieza de localStorage
- Verificación de plan activo al hacer login (redirige a `/plans` si no tiene plan)

#### Gestión de negocios
- Creación de negocios con formulario completo (nombre, tipo, dirección, provincia, municipio, descripción, teléfono, correo)
- Selects dependientes de provincia → municipio (municipio se habilita al seleccionar provincia)
- Tipos de negocio soportados: MiPyme, Agromercado, Mercado
- Redirección automática a crear negocio si el usuario no tiene ninguno registrado
- Loading state mientras se cargan los negocios (evita flash de contenido)
- Cambio de negocio activo desde el sidebar (BusinessSwitcher)
- Persistencia del negocio activo en localStorage

#### Productos
- Listado de productos por negocio
- Creación de productos (nombre, descripción, categoría, unidad, precio, stock)
- Edición de productos existentes
- Eliminación de productos con diálogo de confirmación

#### Ventas
- Registro de ventas con selector de producto y cantidad
- Validación de stock disponible
- Cálculo automático de total
- Resumen de venta en tiempo real
- Listado de ventas por negocio

#### Entradas (Inventario)
- Actualización de stock de productos existentes

#### Cierre contable
- Cierre diario
- Cierre mensual

#### Tipo de cambio
- Consulta de tipo de cambio

#### UI/UX
- Sidebar colapsable con navegación por secciones
- Dark mode con toggle
- Diseño responsivo (móvil y escritorio)
- Notificaciones con Sileo (éxito y error)
- Componentes shadcn/ui + Tailwind CSS

### Stack técnico
- **Framework**: Next.js (App Router)
- **UI**: shadcn/ui, Tailwind CSS, Lucide icons
- **Formularios**: react-hook-form + Zod
- **Estado servidor**: TanStack Query (React Query)
- **HTTP**: Axios
- **Notificaciones**: Sileo

---

### Cambios realizados en esta sesión

#### Corregido
- Fix en la función `register` de `lib/api/auth.ts`: eliminado `try/catch` que tragaba errores silenciosamente e impedía la navegación a `/verify` después del registro

#### Agregado
- Tipo `CreateBusinessPayload` en `lib/types/business.ts`
- Schema de validación `createBusinessSchema` en `lib/validations/business.ts`
- Ruta `createBusiness` en `lib/routes/business.ts`
- Función API `createBusiness` en `lib/api/business.ts`
- Hook `useCreateBusinessMutation` en `hooks/use-business.ts` con invalidación de cache
- Página `/dashboard/business/create` con formulario completo
- Selects dependientes de provincia/municipio usando `useGetAllProvinces` y `useGetAllMunicipalitiesByProvinceId`
- Redirección automática en `BusinessProvider` cuando el usuario no tiene negocios
- Loading state en `BusinessProvider` para evitar flash del dashboard
- Botón "Agregar negocio" funcional en el `BusinessSwitcher` del sidebar
- Notificaciones con Sileo en éxito y error al crear negocio
- Botón de cancelar en el formulario de crear negocio

#### Corregido (edición de productos)
- Fix en `lib/api/product.ts`: función `edit` enviaba los headers como parte del body en vez de como config de axios (segundo vs tercer argumento de `axios.put`)
- Fix en `lib/validations/products.ts`: campo `active` en `editProductSchema` era requerido pero el formulario no lo incluía, causando que la validación fallara silenciosamente y el submit nunca se ejecutara. Ahora es `.optional()`

#### Cambiado
- Icono del botón de actualizar producto: `Save` reemplazado por `RefreshCw`
- Eliminado efecto hover del `SelectTrigger` en `components/ui/select.tsx`

#### Eliminado
- Código muerto de `getMyBusinesses` en el login (no se usaba la respuesta)
- Import sin usar de `businessRoutes` en login
