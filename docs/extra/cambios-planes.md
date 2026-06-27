# Cambios realizados a los planes y estructura de precios

Documento de referencia con todos los ajustes hechos en la rama `plans-updated` para luego aplicarlos en `main`.

Commit principal: **`655ee97`** — *feat: update plans and pricing structure, add billing period selection*

Archivos modificados:
- [src/app/dashboard/profile/plans-change/page.tsx](src/app/dashboard/profile/plans-change/page.tsx)
- [src/app/plans/page.tsx](src/app/plans/page.tsx)

---

## 1. Selector de período de facturación (Mensual / Anual)

Se agregó un selector con tabs (`Tabs`, `TabsList`, `TabsTrigger` de shadcn) en ambas páginas, encima del grid de planes, controlado por estado local:

```tsx
type BillingPeriod = "monthly" | "yearly"
const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly")
```

Cada plan ahora expone **dos precios** (`monthlyPrice` y `yearlyPrice`) en lugar de `price` + `period`. El precio mostrado se calcula:

```tsx
const displayPrice =
  billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
```

---

## 2. Nueva estructura de precios

| Plan      | Antes (mes)     | Mensual (nuevo) | Anual (nuevo, equivalente mensual) |
|-----------|-----------------|-----------------|------------------------------------|
| Gratuito  | $0 CUP/mes      | $0 USD          | $0 USD                             |
| Básico    | $100 CUP/mes    | $5 USD          | $3 USD                             |
| Pro       | $200 CUP/mes    | $15 USD         | $12 USD                            |

Moneda cambia de **CUP** a **USD**. Se elimina el sufijo `CUP / mes` y se reemplaza por `USD / mes`.

En `src/app/plans/page.tsx` el Básico estaba antes en `$3` y Pro en `$10`; ahora coinciden con la tabla anterior.

---

## 3. Textos auxiliares debajo del precio

- **Plan gratuito**: se muestra leyenda fija
  > *Disponible por única vez durante un período de prueba de 15 días hábiles.*
- **Cuando el período es anual** (precio > 0):
  > *Facturado anualmente (${displayPrice * 12} USD/año)*
- **Para planes de pago** (siempre, ambos períodos):
  > *Si pagas en moneda nacional, el cambio aplicado es el que acepta la plataforma.*

Se quitó la leyenda anterior `USD o al cambio en moneda nacional / mes`.

---

## 4. Listas de features reescritas

### `src/app/dashboard/profile/plans-change/page.tsx`

**Gratuito** (features unificadas con las del Básico, todas marcadas igual que Básico para mostrar las funcionalidades disponibles durante prueba):
- 1 negocio ✓
- Hasta 100 productos ✓
- Registro de ventas y compras ✓
- Cierre contable diario ✓
- Tasas de cambio multi-moneda ✓
- Soporte por WhatsApp o correo ✓
- Cierre contable mensual ✗
- Exportar Excel/PDF ✗
- Alertas de stock bajo ✗
- Rentabilidad por producto ✗
- Comparativa de periodos ✗
- Ventas por trabajador ✗

Descripción del Gratuito cambia a:
> *Prueba todas las funcionalidades del plan Pro sin compromiso.*

**Básico**: mismas 12 features que Gratuito (con los mismos checks/cruces).

**Pro** (todas incluidas):
- Hasta 3 negocios ✓
- Hasta 500 productos ✓
- Registro de ventas y compras ✓
- Cierre contable diario ✓
- Tasas de cambio multi-moneda ✓
- Cierre contable mensual ✓
- Exportar Excel/PDF ✓
- Alertas de stock bajo ✓
- Rentabilidad por producto ✓
- Comparativa de periodos ✓
- Ventas por trabajador ✓
- Soporte prioritario 24/7 ✓

Se eliminaron features previas como `Usuarios ilimitados`, `Ventas ilimitadas`, `Cierre diario avanzado`, `Integracion facturacion`, `Tipo de cambio automatico`, `Reportes avanzados y exportacion`, `Cierre mensual y anual`.

### `src/app/plans/page.tsx`

**Básico**:
- 1 negocio ✓
- Hasta 100 productos ✓
- Registro de ventas y compras ✓
- Cierre contable diario ✓
- Tasas de cambio multi-moneda ✓
- Soporte por WhatsApp o correo ✓

(Antes había entradas separadas para `Registro de ventas` / `Registro de compras` y `Tipo de cambio manual`.)

**Pro**:
- Todo lo que incluye el plan basico mas: ✓
- Hasta 3 negocios ✓
- Hasta 500 productos ✓
- Cierre contable mensual ✓
- Exportar Excel/PDF ✓
- Alertas de stock bajo ✓
- Rentabilidad por producto ✓
- Comparativa de periodos ✓
- Ventas por trabajador ✓
- Soporte prioritario 24/7 ✓

Se eliminó la entrada `Reportes avanzados y exportacion` (reemplazada por `Exportar Excel/PDF`).

---

## 5. Cambios estructurales JSX

- Bloque de precio envuelto en un nuevo `<div className="mb-6">` que contiene el precio y las leyendas auxiliares (antes la clase `mb-6` estaba en el `flex` del precio).
- En `src/app/plans/page.tsx` el `.map()` pasó de `return (` implícito de arrow a un cuerpo de bloque con `const displayPrice = ...; return ( ... )` y el cierre cambia de `))}` a `)})}` (ver diff del commit).
- Import añadido en ambas páginas: `import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"`.

---

## 6. Cómo aplicar en `main`

Cuando me lo indiques, la forma más limpia es hacer cherry-pick del commit:

```bash
git checkout main
git pull
git cherry-pick 655ee97
```

Si hay conflictos (puede haber, porque `main` no tiene el commit `0dfa1fb` con el cambio de precios previos en `src/app/plans/page.tsx`), los resolvemos tomando el contenido de este documento como fuente de verdad.

Alternativa: aplicar manualmente los cambios siguiendo este documento sección por sección.
