# Sistema de Gating Pro

Guía para desarrolladores sobre cómo restringir rutas y funcionalidades al plan Pro.

## Arquitectura

El sistema tiene 3 piezas:

| Archivo | Responsabilidad |
|---------|----------------|
| `src/lib/pro-gates.ts` | Fuente única de verdad: lógica `isProPlan`, lista `PRO_ROUTES`, helpers `isProRoute` y `getProRedirect` |
| `src/components/ui/pro-badge.tsx` | Componente `<ProBadge />` reutilizable (icono Sparkles + texto "Pro" con tema amber) |
| `src/hooks/use-user-role-plan.ts` | Hook de React que expone `isProPlan` como booleano para componentes |

## Agregar una ruta Pro nueva

Una ruta Pro es una **página completa** que solo usuarios Pro pueden ver. Usuarios free son redirigidos.

### Paso único

Agregar una entrada al array `PRO_ROUTES` en `src/lib/pro-gates.ts`:

```ts
export const PRO_ROUTES = [
  // ... rutas existentes
  {
    path: "/dashboard/mi-nueva-ruta",
    redirect: "/dashboard",  // a dónde redirigir usuarios free
  },
] as const
```

### Qué pasa automáticamente (una vez completada la migración)

- **Middleware** (`middleware.ts`): bloquea el acceso y redirige usuarios free
- **Sidebar** (`sidebar.tsx`): el item se muestra deshabilitado con badge Pro para usuarios free

> **No es necesario** tocar middleware.ts, sidebar.tsx ni nav-main.tsx.

## Restringir una funcionalidad dentro de una página

Una funcionalidad Pro es una **acción o botón** dentro de una página que puede ser accesible para todos, pero cuya acción está limitada.

### Patrón básico — Funcionalidad solo Pro

```tsx
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan"
import { ProBadge } from "@/components/ui/pro-badge"

export default function MiPagina() {
  const { isProPlan } = useUserRoleAndPlan()

  return (
    <Button disabled={!isProPlan}>
      Exportar PDF <ProBadge />
    </Button>
  )
}
```

### Patrón con condición custom

Algunas funcionalidades tienen lógica adicional. Por ejemplo, "crear negocio" es gratuito para el primer negocio pero Pro para los siguientes:

```tsx
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan"
import { useBusiness } from "@/context/business-context"
import { ProBadge } from "@/components/ui/pro-badge"

export default function MiComponente() {
  const { isProPlan } = useUserRoleAndPlan()
  const { businesses } = useBusiness()
  const canAddBusiness = isProPlan || businesses.length === 0

  return (
    <Button disabled={!canAddBusiness}>
      Agregar negocio <ProBadge />
    </Button>
  )
}
```

### Patrón para redirección en página

Si la página no debería renderizarse para usuarios free bajo cierta condición:

```tsx
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan"

export default function PaginaProtegida() {
  const router = useRouter()
  const { isProPlan } = useUserRoleAndPlan()

  useEffect(() => {
    if (!isProPlan) {
      router.replace("/dashboard")
    }
  }, [isProPlan, router])

  if (!isProPlan) return null

  return <div>Contenido Pro</div>
}
```

> **Nota:** Si es una página completa Pro, es mejor agregarla a `PRO_ROUTES` en vez de manejar la redirección manualmente. El middleware es más seguro porque actúa antes de que se cargue el JavaScript del cliente.

## Componente ProBadge

El badge visual que indica funcionalidades Pro. Usa los estilos de `PRO_STYLE` definidos en `src/components/assign-plans/utils.ts`.

```tsx
import { ProBadge } from "@/components/ui/pro-badge"

// Uso básico (incluye ml-auto por defecto)
<ProBadge />

// Con clase adicional para ajustar posición
<ProBadge className="ml-2" />
```

## Verificar el plan del usuario

La función `isProPlan` reconoce como Pro cualquier plan cuyo nombre contenga (sin importar tildes ni mayúsculas):
- `pro`
- `profesional`
- `premium`
- `plus`

## Resumen rápido

| Quiero... | Hago... |
|-----------|---------|
| Bloquear una página entera para Pro | Agregar entrada a `PRO_ROUTES` en `pro-gates.ts` |
| Deshabilitar un botón para free | `disabled={!isProPlan}` + `<ProBadge />` |
| Deshabilitar con condición custom | Variable derivada (ej: `canDo = isProPlan \|\| condition`) + `<ProBadge />` |
| Redirigir free desde una página | Preferir `PRO_ROUTES`; si necesita lógica custom, usar `useEffect` + `router.replace` |
