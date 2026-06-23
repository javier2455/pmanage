# Comparativa de Planes — Gratuito vs Básico vs Pro

> Fecha: 2026-06-23
> Basado en revisión del código real del proyecto (no solo de la landing de precios).

Este documento responde a una pregunta concreta: **¿está equilibrado lo que ofrece cada plan?** Para eso se separan dos cosas que en el proyecto NO coinciden del todo:

1. **Lo que promete la landing** (`src/app/plans/page.tsx`) — el discurso comercial.
2. **Lo que el código realmente aplica** (`src/lib/pro-gates.ts`, `middleware.ts`, hooks y componentes) — el gating efectivo.

---

## Hallazgo principal (resumen ejecutivo)

- **El código solo distingue Pro vs NO-Pro.** Toda la lógica de bloqueo se reduce a la función `isProPlan()` ([src/lib/pro-gates.ts](../../src/lib/pro-gates.ts#L17)). No existe ninguna comprobación que separe **Gratuito de Básico** a nivel de funcionalidad.
- **Gratuito y Básico son funcionalmente idénticos en el frontend.** La única diferencia real entre ellos es el límite numérico `maxProducts` que llega del backend en el objeto del plan, y el precio. Un usuario "free" y uno "básico" ven y pueden hacer exactamente lo mismo en la app.
- **El plan Gratuito ni siquiera se muestra** en la página de precios: la landing solo lista Básico ($5) y Pro ($15). "free" existe como tipo en el modelo de datos (`PlanType = "free" | "basic" | "premium" | "enterprise"`) pero no se comercializa.
- **El plan Pro SÍ está bien diferenciado del Básico en el código actual.** Tras los últimos desarrollos (alertas de stock, gastos consolidados, notificaciones WhatsApp, historial de precios, etc.) el salto Básico → Pro tiene contenido real, más allá del cierre mensual y la exportación que se mencionaban en el análisis original de mayo. El desequilibrio hoy **no** es "Pro ofrece poco sobre Básico", sino **"Gratuito y Básico son casi indistinguibles"**.

> **Dirección elegida (2026-06-23):** el plan Gratuito deja de ser un tier permanente y pasa a ser un **trial con caducidad de 15 días**. Esto resuelve de raíz la indistinción Gratuito/Básico (el Gratuito ya no es un destino, sino la puerta de entrada). Ver sección **"Modelo de trial"** más abajo.

---

## Tabla A — Lo que PROMETE la landing de precios

> Fuente: [src/app/plans/page.tsx](../../src/app/plans/page.tsx#L20-L63). La landing **no muestra plan Gratuito**.

| Funcionalidad | Gratuito | Básico ($5/mes · $4 anual) | Pro ($15/mes · $12 anual) |
|---|:---:|:---:|:---:|
| Negocios | — (no listado) | 1 | Hasta 3 |
| Productos | — | Hasta 100 | Hasta 500 |
| Registro de ventas y compras | — | ✓ | ✓ |
| Gestión de gastos con categorías | — | ✓ | ✓ |
| Cierre contable diario | — | ✓ | ✓ |
| Tasas de cambio multi-moneda | — | ✓ | ✓ |
| Historial de precios de productos | — | ✓ ⚠️ | ✓ |
| Historial de inventario | — | ✓ | ✓ |
| Búsqueda global | — | ✓ | ✓ |
| Panel de estadísticas | — | ✓ | ✓ |
| Notificaciones por correo | — | ✓ | ✓ |
| Cierre contable mensual | — | ✗ | ✓ |
| Exportar cierres a Excel/PDF | — | ✗ | ✓ |
| Gestión de proveedores | — | ✗ | ✓ |
| Gestión de equipo y permisos | — | ✗ | ✓ |
| Comparador de precios multi-producto | — | ✗ | ✓ |
| Notificaciones por WhatsApp | — | ✗ | ✓ |
| Soporte | — | WhatsApp / correo | Prioritario 24/7 |

⚠️ **Inconsistencia:** la landing anuncia "Historial de precios de productos" como funcionalidad del plan **Básico**, pero el código la bloquea detrás del plan **Pro** (ver [price-history-button.tsx](../../src/components/products/price-history-button.tsx#L20)). Lo prometido y lo aplicado no coinciden.

---

## Tabla B — Lo que el CÓDIGO realmente aplica

> Fuente: `isProPlan()` + `PRO_ROUTES` ([pro-gates.ts](../../src/lib/pro-gates.ts)) y comprobaciones en componentes. Recordatorio: **Gratuito = Básico** en todo lo que no sea el límite de productos.

| Funcionalidad / Restricción | Gratuito | Básico | Pro | Dónde se aplica |
|---|:---:|:---:|:---:|---|
| **Crear 1.er negocio** | ✓ | ✓ | ✓ | [business/create/page.tsx:131](../../src/app/dashboard/business/create/page.tsx#L131) |
| **Crear negocios adicionales (hasta 3)** | ✗ | ✗ | ✓ | `canAddBusiness = isProPlan \|\| businesses.length === 0` ([business-switcher.tsx:27](../../src/components/sidebar/business-switcher.tsx#L27)) |
| **Límite de productos** | `maxProducts` (backend) | `maxProducts` (backend, 100) | `maxProducts` (backend, 500) | Campo numérico del plan ([plans.ts](../../src/lib/types/plans.ts)) |
| Registro de ventas / compras | ✓ | ✓ | ✓ | Sin gate |
| Cierre contable **diario** | ✓ | ✓ | ✓ | Sin gate (la página es libre) |
| Tasas de cambio multi-moneda | ✓ | ✓ | ✓ | Sin gate |
| Búsqueda global / estadísticas básicas | ✓ | ✓ | ✓ | Sin gate |
| Notificaciones por correo | ✓ | ✓ | ✓ | Sin gate |
| **Cierre contable mensual** (página) | ✗ | ✗ | ✓ | Ruta Pro en `PRO_ROUTES` → bloqueada por middleware |
| **Analítica avanzada** (página) | ✗ | ✗ | ✓ | Ruta Pro `/dashboard/analytics` |
| **Gestión de proveedores** (página) | ✗ | ✗ | ✓ | Ruta Pro `/dashboard/business/providers` |
| **Exportar cierre diario a Excel/PDF** | ✗ | ✗ | ✓ | `disabled={!isProPlan}` ([daily/page.tsx:161](../../src/app/dashboard/accounting-close/daily/page.tsx#L161)) |
| **Exportar cierre mensual** | ✗ | ✗ | ✓ | [monthly/page.tsx:176](../../src/app/dashboard/accounting-close/monthly/page.tsx#L176) |
| **Alertas de stock bajo** (banner + umbral por producto) | ✗ | ✗ | ✓ | [inventory/page.tsx:27,50,68](../../src/app/dashboard/business/inventory/page.tsx#L27) + [assign-product-to-business-form.tsx:341](../../src/components/products/assign-product-to-business-form.tsx#L341) |
| **Gastos consolidados de todos los negocios** | ✗ | ✗ | ✓ | `consolidated = isProPlan && showAllBusinesses` ([expenses/page.tsx:30](../../src/app/dashboard/business/expenses/page.tsx#L30)) |
| **Notificaciones WhatsApp / SMS** | ✗ | ✗ | ✓ | `channel.pro && !isProPlan` ([notification-settings-card.tsx:216](../../src/components/business/notification-settings-card.tsx#L216)) |
| **Historial de precios de productos** (página) | ✗ | ✗ | ✓ | [price-history-button.tsx:20](../../src/components/products/price-history-button.tsx#L20) ⚠️ contradice la landing |
| Soporte prioritario 24/7 | ✗ | ✗ | ✓ | Comercial, no técnico |

**Lectura de la tabla B:** todas las columnas Gratuito y Básico son idénticas salvo el valor numérico de `maxProducts`. El gate es siempre `isProPlan` (binario).

---

## Análisis de equilibrio

### 1. Gratuito vs Básico — desequilibrio real (casi no hay diferencia)
A nivel de producto, pagar el Básico sobre el Gratuito solo compra **más cupo de productos**. Mismas pantallas, mismas acciones, mismos negocios (1). Esto es un problema de propuesta de valor: no hay una razón funcional clara para pasar de Gratuito a Básico, solo el techo de productos. Y como el plan Gratuito no se muestra en la landing, hoy esa transición ni se comunica.

### 2. Básico vs Pro — hoy SÍ está diferenciado
La preocupación original ("Pro ofrece poco sobre Básico") era válida en el análisis de mayo de 2026 ([analisis-planes.md](analisis-planes.md)), cuando el único diferencial diario era el cierre mensual + exportación (uso esporádico). Pero el código actual ya incorporó buena parte de la **Variante A** y algo de la **Variante B**:

- Alertas de stock bajo (valor diario) ✓
- Gastos consolidados multi-negocio ✓
- Notificaciones por WhatsApp ✓
- Historial de precios ✓
- Gestión de proveedores ✓
- Analítica ✓ (página dedicada)

Sumado a los límites (1→3 negocios, 100→500 productos), el salto Básico → Pro hoy tiene sustancia. El desequilibrio "Pro flojo" está en gran parte resuelto.

### 3. Inconsistencias landing ↔ código a corregir
- **Historial de precios:** anunciado en Básico, bloqueado a Pro. Decidir en qué plan va y alinear ambos.
- **Comparador de precios multi-producto** y **gestión de equipo/permisos:** aparecen como Pro en la landing pero **no se encontró gate explícito** en el código revisado. Conviene verificar que estén realmente restringidos (o que la landing no prometa algo no implementado).
- **Cierre diario:** la landing lo lista en ambos planes; en código la página es libre (también para "free"), coherente.

---

## Modelo de trial (dirección elegida)

En lugar de mantener un plan Gratuito permanente (que hoy es indistinguible del Básico), el plan Gratuito se redefine como un **periodo de prueba con caducidad**:

**Flujo de cliente:**
1. El usuario se registra → se le asigna automáticamente el plan de prueba con `expireDate = fecha de registro + 15 días`.
2. Durante esos 15 días **prueba el sistema al completo** (la landing lo comunica como "acceso completo, como el plan Pro").
3. Al expirar, elige: suscribirse a **Básico** (si le basta lo esencial) o a **Pro** (si necesita más).

**Por qué esto equilibra los planes:** el Gratuito ya no compite con el Básico ni necesita un diferenciador artificial — es un *taste* temporal de todo el producto. La decisión de pago se traslada al final del trial, cuando el usuario ya tiene sus datos cargados y un hábito formado.

### Infraestructura que YA existe (no hay que inventarla)

El backend ya modela planes con caducidad. En el login / `getMe` ([auth.ts:38-42, 93-94](../../src/lib/api/auth.ts#L38)):

- `Plan.startDate` y `Plan.expireDate` — fechas del periodo del plan.
- `expiredPlan: boolean` — bandera de plan vencido.
- `hasNeverHadPlan: boolean` — usuario que nunca tuvo plan (útil para distinguir "nuevo registro" de "trial vencido").

Como el gating del frontend es binario (`isProPlan`), un usuario en trial es simplemente "un usuario no-Pro" (si el trial es de Básico) o "un usuario Pro temporal" (si el trial es de Pro). En ningún caso hay que reescribir el gating de funcionalidades.

### Decisiones abiertas

| Decisión | Opciones | Estado |
|---|---|---|
| **Alcance del trial** | Trial de **Básico** (lo pedido inicialmente) vs trial de **Pro** completo (mejor conversión: el usuario *saborea* lo premium y al retirárselo tiene incentivo a pagar) | ⏳ **Pendiente de confirmar.** La landing se redactará como "acceso completo / como Pro". |
| **Cómputo de los 15 días** | Días **hábiles** (lo dicho inicialmente; requiere calcular fines de semana + feriados) vs días **naturales** (recomendado: más simple, predecible y se comunica solo con `expireDate`) | ⏳ Pendiente. Recomendación: naturales. |
| **Estado al expirar (día 16)** | Solo lectura / paywall que obliga a elegir plan / bloqueo total. Hoy **no existe** ningún gate que bloquee a un usuario con `expiredPlan: true` en el frontend. | ⏳ Hay que definirlo y construirlo. |

---

## Recomendaciones

1. **Adoptar el modelo de trial** (sección anterior) como respuesta al desequilibrio Gratuito/Básico. Es la decisión de producto correcta y reaprovecha la infraestructura existente.
2. **Construir el estado de expiración del trial.** Es el hueco más importante: hoy un plan vencido (`expiredPlan: true`) no bloquea nada en el frontend. Definir el comportamiento del día 16 (paywall recomendado) y confirmar si el backend ya rechaza escrituras con plan vencido.
3. **Cerrar las 2 decisiones abiertas** (alcance Básico/Pro y días hábiles/naturales) antes de implementar.
4. **Resolver las 3 inconsistencias landing ↔ código** (historial de precios, comparador, equipo/permisos) antes de promocionar.
5. **El eje de mejora ya no es "robustecer Pro" sino "convertir el trial".** Pro está razonablemente cargado; lo crítico ahora es que la prueba de 15 días termine en suscripción.

---

## Archivos de referencia

| Propósito | Ruta |
|---|---|
| Lógica única de gating Pro | [src/lib/pro-gates.ts](../../src/lib/pro-gates.ts) |
| Hook de plan para componentes | [src/hooks/use-user-role-plan.ts](../../src/hooks/use-user-role-plan.ts) |
| Landing de precios | [src/app/plans/page.tsx](../../src/app/plans/page.tsx) |
| Tipos y límites del plan | [src/lib/types/plans.ts](../../src/lib/types/plans.ts) |
| Guía de gating para devs | [docs/extra/pro-gating.md](../extra/pro-gating.md) |
| Análisis estratégico previo (mayo 2026) | [docs/análisis-planes/analisis-planes.md](analisis-planes.md) |
</content>
</invoke>
