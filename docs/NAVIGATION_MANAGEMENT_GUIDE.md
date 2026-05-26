# Gestión de Navegación — Secciones, Menús y Submenús

Guía de referencia para administrar la jerarquía del sidebar desde
`/dashboard/admin/menus`. Documenta el modelo de datos, las reglas de negocio
y el mapa de archivos del frontend.

> **Estado:** maquetación + cableado completo. La lógica de negocio detallada
> (validaciones cruzadas, ordenamiento drag-and-drop, etc.) se irá refinando
> en iteraciones posteriores.

---

## 1. Modelo de datos

La jerarquía es **Section → Menu → Submenu** (tres niveles fijos).

| Entidad   | Padre        | Hijos directos | Puede no tener hijos | Tiene URL |
| --------- | ------------ | -------------- | -------------------- | --------- |
| `Section` | (raíz)       | `Menu[]`       | ✅                   | ❌         |
| `Menu`    | `Section`    | `Submenu[]`    | ✅                   | ✅         |
| `Submenu` | `Menu`       | —              | —                    | ✅         |

### Campos comunes

- `id: string` — identificador.
- `name: string` — etiqueta visible.
- `icon: string` — nombre del icono (clave de `ICON_MAP` en
  [src/lib/icon-map.ts](../src/lib/icon-map.ts)).
- `roles: string[]` — IDs de roles que tienen acceso.
  - En **sección** puede ir vacío (visible a todos los roles).
  - En **menú** y **submenú** se exige al menos uno.
- `plans: string[] | null` — planes que tienen acceso. `null` = todos los
  planes. Hoy se envía `null` desde el form (no hay UI de selección).
- `active: boolean` — si está activo se renderiza en el sidebar.
- `order?: number` — orden de aparición (lo dictamina el backend).

`Section` no tiene `url` ni `plans` porque actúa como agrupador visual del
sidebar (igual que el label "Navegación" actual).

---

## 2. Endpoints consumidos

Definidos en [src/lib/routes/navigation.ts](../src/lib/routes/navigation.ts).

### Section (`/api/v2/section`)

- `GET    /section`        → árbol recursivo (sección → menús → submenús)
  - Query params:
    - `businessId?: string` — filtra los nodos accesibles al negocio activo.
    - `isList?: boolean`   — si es `true`, devuelve una lista plana con
      permisos por nodo (`SectionListItem[]`), análogo a `getMenuList()`.
- `GET    /section/:id`    → una sección con sus hijos
- `POST   /section`        → crea sección
- `PATCH  /section/:id`    → actualiza sección
  - **Body**: `{ icon?, name?, badge?, active?, order?, roles?, plans? }`
- `DELETE /section/:id`    → elimina sección (cascada a menús/submenús)

**Shape de respuesta** (modo árbol — `SectionApiNode`):

```jsonc
{
  "id": "...",
  "icon": "fa fa-folder",
  "name": "Administración",
  "badge": "Nuevo" | null,
  "active": true,
  "roles": ["4", "5"],
  "plans": ["plan-premium-uuid"] | null,
  "menus": [
    {
      "id": "...",
      "icon": "fa fa-home",
      "name": "Inicio",
      "badge": null,
      "url": "/home",
      "active": true,
      "roles": ["4", "5"],
      "plans": ["plan-premium-uuid"] | null,
      "submenus": [ /* SectionApiSubmenu[] */ ]
    }
  ]
}
```

Tres niveles fijos: **section → menu → submenu**. Las secciones agrupan
y no tienen `url` propia; los menús y submenús sí. La discriminación se
hace por la posición en el árbol (no por un campo `kind`).

### Menu (`/api/v2/menu`)

- `GET    /menu`           → todas las menús con submenús (filtrado por rol)
- `GET    /menu/:id`       → un menú con sus submenús
- `POST   /menu`           → crea menú
  - **Body**: `{ icon, name, badge, url, active, roles }`
  - Le enviamos también `sectionId` en el body para indicar el padre
    (el endpoint no lo lleva en path ni query).
- `PATCH  /menu/:id`       → actualiza menú
  - **Body**: `{ icon?, name?, badge?, url?, active?, roles? }` (no acepta `sectionId`)
- `DELETE /menu/:id`       → elimina menú (cascada a submenús)

### Submenu (`/api/v2/submenu`)

- `GET    /submenu`              → todos los submenús
- `GET    /submenu/:id`          → un submenú
- `GET    /submenu/menu/:menuId` → submenús de un menú
- `POST   /submenu`              → crea submenú
  - **Body**: `{ icon, name, badge, url, menuId, active, roles }`
- `PATCH  /submenu/:id`          → actualiza submenú
  - **Body**: `{ icon?, name?, badge?, url?, active?, menuId?, roles? }`
  - **Acepta `menuId`** para mover el submenú a otro menú padre. Por ahora la
    UI no expone el cambio de padre, pero el campo se envía con el mismo
    `menuId` del nodo para consistencia.
- `DELETE /submenu/:id`          → elimina submenú

---

## 3. Reglas de negocio

1. **Acceso restringido a admin.** La ruta `/dashboard/admin/menus` está
   protegida por `useUserRoleAndPlan().isAdmin`. El backend además debe
   devolver el menú "Gestionar Menús" con `roles=[<admin-roleId>]` para que
   sólo lo vea el administrador en el sidebar.
2. **Crear sección solo crea la sección.** El diálogo de creación captura
   los campos del body de `POST /section` (icon, name, badge, active,
   order, roles, plans). Luego el admin agrega menús/submenús desde la
   misma página usando las acciones del árbol.
   - **`order` debe ser > 0**: la sección "Navegación" reserva el `0` en la
     BD. El formulario pre-calcula `max(existingOrders) + 1` y lo deja
     editable por si el admin lo quiere ajustar.
3. **Roles asignables por nodo.** Cada sección/menú/submenú declara qué
   roles tienen acceso. El sidebar runtime filtra por `roleId` en
   [src/components/sidebar/sidebar.tsx](../src/components/sidebar/sidebar.tsx).
   - IDs reales hoy en `ROLE_IDS` ([role-multiselect.tsx](../src/components/navigation-admin/role-multiselect.tsx)):
     `4` = "Dueño de negocio", `5` = "Administrador".
   - Cuando un nodo solo es accesible para admin (`roles === ["5"]`), el
     árbol pinta el chip especial `<AdminBadge>` con gradiente morado.
4. **Iconos curados.** El picker sólo deja elegir entre las claves de
   `ICON_MAP`. Si el backend devuelve un icono no incluido en el mapa,
   `resolveIcon()` cae al icono `Circle` por defecto.
5. **Eliminación en cascada.** Borrar una sección borra todos sus menús y
   submenús. Borrar un menú borra sus submenús. El diálogo de eliminación
   muestra una advertencia con los conteos antes de confirmar.

---

## 4. Mapa de archivos

Una sola convención: un módulo por capa, llamado `navigation.ts`, cubre las
tres entidades (Section + Menu + Submenu).

```
src/lib/routes/navigation.ts              # 16 rutas (CRUD x 3 entidades + getSubmenusByMenu)
src/lib/types/navigation.ts               # tipos de 3 entidades + shape API
src/lib/validations/navigation.ts         # 6 esquemas Zod
src/lib/api/navigation.ts                 # 16 funciones API
src/hooks/use-navigation.ts               # hooks (queries + mutations) + invalidación

src/lib/toast.ts                          # helpers toastSuccess/toastError compartidos

src/components/ui/admin-badge.tsx         # badge morado con gradiente (reutilizable)

src/components/navigation-admin/
  ├── icon-picker.tsx          → selector visual sobre ICON_MAP
  ├── role-multiselect.tsx     → selector de roles + ROLE_IDS (4/5)
  ├── role-badges.tsx          → RoleBadges (admin → AdminBadge; resto → chips neutros)
  ├── node-config.ts           → labels/iconos por NavigationNodeKind
  ├── navigation-tree.tsx      → render explícito section.menus[].submenus[]
  ├── navigation-node.tsx      → tarjeta de nodo con expand/collapse + acciones
  ├── section-form-dialog.tsx  → crear y editar sección (form único)
  ├── menu-form-dialog.tsx     → CRUD de menú
  ├── submenu-form-dialog.tsx  → CRUD de submenú
  └── delete-node-dialog.tsx   → confirmación con advertencia de cascada

src/app/dashboard/admin/menus/
  ├── page.tsx                 → server shell
  └── menus-client.tsx         → coordinador de diálogos + árbol + nextOrder
```

Notas:

- Se nombra `AdminMenu` (no `Menu`) en `src/lib/types/navigation.ts` para no
  chocar con `MenuItem` de [src/lib/types/menu.ts](../src/lib/types/menu.ts),
  que sigue siendo el shape que consume el sidebar runtime.
- El módulo `src/lib/api/menu.ts` (sidebar runtime) **no se toca** — sólo se
  agrega la capa administrativa nueva.

---

## 5. Flujo de invalidación de caché

Cada mutación administrativa (create/update/delete de section/menu/submenu)
invoca `useInvalidateNavigation()` en
[src/hooks/use-navigation.ts](../src/hooks/use-navigation.ts), que invalida:

- `["navigation"]` — refresca el árbol completo de `/dashboard/admin/menus`
  **y también el sidebar runtime** (que consume `useGetAllSectionsQuery`
  con queryKey `["navigation", "sections", businessId]`).
- `["all-menu-items"]` y `["menu-list-flat"]` — invalidaciones legacy del
  endpoint anterior `/menu/`, mantenidas por si alguna pantalla aún lo usa.

Así, al editar la navegación desde admin, el sidebar se actualiza sin
recargar la página.

### Sidebar runtime

A partir de esta iteración el sidebar se alimenta del endpoint
**`GET /api/v2/section`** ([sidebar.tsx](../src/components/sidebar/sidebar.tsx)),
no de `/menu/`. Esto trae varias ventajas:

- El nombre de cada `<SidebarGroupLabel>` viene de `section.name`
  (antes "Navegación" estaba hardcoded). Crear una sección nueva en
  `/dashboard/admin/menus` la hace aparecer en el sidebar al instante.
- Permite **múltiples grupos** en el sidebar (uno por sección), en lugar
  de un único grupo.
- El fallback estático [src/lib/menu/static-fallback.ts](../src/lib/menu/static-fallback.ts)
  quedó **deprecado** — ya no se importa desde el sidebar.

---

## 6. Estado actual

### ✅ Listo

- **CRUD completo de las 3 entidades** (section / menu / submenu): GET, POST,
  PATCH, DELETE conectados con backend y cableados al árbol.
- **Validación por entidad**: schemas Zod alineados a los bodies reales
  (sección con `order`, menú/submenu con `badge` + `active`, etc.).
- **Roles**: IDs reales (`4` = dueño, `5` = admin) + `<AdminBadge>` morado
  para nodos solo-admin. En sección, `roles` puede ir vacío.
- **Auto-orden**: el form de sección sugiere `max(existingOrders) + 1`,
  editable a mano.
- **Cascada al eliminar**: el diálogo de borrado muestra cuántos hijos se
  arrastran (menús + submenús).
- **Refresco del sidebar**: las mutaciones invalidan `["all-menu-items"]`
  además del árbol admin, así el sidebar se actualiza en caliente.
- **Toasts unificados**: [src/lib/toast.ts](../src/lib/toast.ts) con
  `toastSuccess`/`toastError` aplicados a los 4 diálogos.
- **UI del árbol**: cards transparentes para menús/submenús, hover con borde
  primario + shadow + transición suave.

---

## 7. TODOs pendientes

- **Detalles del 80% backend.** Pendientes los ajustes finos que mencionó
  el usuario al probar PATCH (sin detalle aún — anotar conforme aparezcan).
- **Fuente dinámica de roles.** Hoy `ROLE_IDS` está hardcoded a `4`/`5`.
  Si el backend agrega roles o queremos evitar valores mágicos, integrar un
  `useRolesQuery` y poblar `ROLE_OPTIONS` desde ahí.
- **Asignación de planes.** El backend acepta `plans: string[]` en
  section/menu/submenu, pero el form envía `null`. Falta:
  - Endpoint o constante con planes disponibles.
  - Selector tipo `RoleMultiSelect` (probablemente reusable como
    `MultiSelectBadges<T>`).
  - Renderizar `requiresPlan` en el árbol (chip "Premium", "Pro", etc.).
- **Mover submenú entre menús.** `PATCH /submenu/:id` acepta `menuId` para
  cambiar de padre, pero la UI no lo expone. Hoy enviamos el mismo `menuId`
  del nodo para consistencia.
- **Reordenamiento drag-and-drop.** Hoy `order` solo se edita en el form de
  sección. Para menús/submenús habría que decidir si se reordena con D&D y
  exponer un endpoint de reorder.
- **Permisos por nodo.** El GET devuelve `permissions: { read, write,
  update, delete, ... }` por nodo pero no se renderizan ni editan. Pendiente
  decidir si entran en el alcance de este módulo o en uno aparte.
- **Modo `isList` sin consumir.** `useGetSectionListQuery` está hecho pero
  ninguna página lo usa todavía. Sirve para validaciones de permisos en
  páginas específicas (mismo patrón que `getMenuList()`).
- **Entrada "Gestionar Menús" en sidebar.** Sigue dependiendo de que el
  backend devuelva el item con `roles=[5]`. Mientras tanto, el admin debe
  navegar directo a `/dashboard/admin/menus`.
- **Eliminar `static-fallback.ts`.** El archivo ya está deprecado y sin
  importadores; se puede borrar cuando se confirme que ningún flujo
  legacy lo necesita.
