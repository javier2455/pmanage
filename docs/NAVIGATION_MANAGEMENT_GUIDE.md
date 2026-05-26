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
| `Section` | (raíz)       | `Menu[]`       | ❌ (mínimo 1 menú)   | ❌         |
| `Menu`    | `Section`    | `Submenu[]`    | ✅                   | ✅         |
| `Submenu` | `Menu`       | —              | —                    | ✅         |

### Campos comunes

- `id: string` — identificador.
- `name: string` — etiqueta visible.
- `icon: string` — nombre del icono (clave de `ICON_MAP` en
  [src/lib/icon-map.ts](../src/lib/icon-map.ts)).
- `roles: string[]` — IDs de roles que tienen acceso. Si está vacío, no se
  muestra en el sidebar a ningún rol.
- `plans: string[] | null` — planes que tienen acceso (sólo `Menu` y
  `Submenu`). `null` = todos los planes.
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
   - Roles soportados actualmente: `admin`, `business-owner` (placeholder).
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
src/lib/routes/navigation.ts              # 15 rutas
src/lib/types/navigation.ts               # tipos de 3 entidades
src/lib/validations/navigation.ts         # 6 esquemas Zod
src/lib/api/navigation.ts                 # 15 funciones API
src/hooks/use-navigation.ts               # 16 hooks (queries + mutations)

src/components/navigation-admin/
  ├── icon-picker.tsx          → selector visual sobre ICON_MAP
  ├── role-multiselect.tsx     → selector de roles (stub ROLE_OPTIONS)
  ├── node-config.ts           → labels/iconos por NavigationNodeKind
  ├── navigation-tree.tsx      → render recursivo sección → menú → submenú
  ├── navigation-node.tsx      → tarjeta de nodo con expand/collapse + acciones
  ├── section-form-dialog.tsx  → crear (con tab "Menú inicial") y editar
  ├── menu-form-dialog.tsx     → CRUD de menú
  ├── submenu-form-dialog.tsx  → CRUD de submenú
  └── delete-node-dialog.tsx   → confirmación con advertencia de cascada

src/app/dashboard/admin/menus/
  ├── page.tsx                 → server shell
  └── menus-client.tsx         → coordinador de diálogos + árbol
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

- `["navigation"]` — refresca el árbol completo de `/dashboard/admin/menus`.
- `["all-menu-items"]` — refresca el menú que consume el sidebar runtime.
- `["menu-list-flat"]` — refresca la lista plana de menús (permisos).

Así, al editar la navegación desde admin, el sidebar se actualiza sin
recargar la página.

---

## 6. TODOs pendientes

- **Fuente real de roles.** Hoy `ROLE_OPTIONS` en
  [src/components/navigation-admin/role-multiselect.tsx](../src/components/navigation-admin/role-multiselect.tsx)
  es un stub con dos opciones. Reemplazar por una consulta al endpoint de
  roles cuando el backend lo confirme.
- **Asignación de planes.** El campo `plans` de `Menu`/`Submenu` se envía
  como `null` por defecto desde el formulario. Cuando se decida el flujo,
  agregar un selector de planes análogo al de roles.
- **Ordenamiento.** Si se decide soportar drag-and-drop para reordenar
  nodos, habría que añadir un `order` editable + endpoint de reordenar.
- **Edición avanzada de la sección.** Hoy el modo edición sólo deja cambiar
  `name`, `icon` y `roles`. Si la sección llegara a tener más atributos
  (descripción, etc.), extender `updateSectionSchema`.
- **Visibilidad del item en el sidebar.** El item "Gestionar Menús" en el
  sidebar lo debe entregar el backend con `roles=[<admin>]`. Hasta entonces,
  se accede directamente a la URL `/dashboard/admin/menus`.
