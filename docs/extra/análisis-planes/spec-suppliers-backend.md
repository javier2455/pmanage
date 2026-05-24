# Especificación Técnica — Sección de Proveedores (Suppliers)

> **Fecha:** 2026-05-23
> **Autor:** Equipo Frontend (PManage)
> **Destinatario:** Equipo Backend
> **Base URL:** `http://psearch.dveloxsoft.com/api/v2`
> **Documento base:** [`docs/análisis-planes/spec-tecnicas.md`](./spec-tecnicas.md) (sección Variante B — Proveedores, líneas 650-748)

---

## 1. Resumen ejecutivo

Implementar la sección de **Proveedores** como parte del Plan Pro (Variante B).

**Problema actual:** `InventoryEntry.supplier` es un campo de texto libre. No se puede:
- Saber a quién contactar para reabastecer.
- Ver el historial agregado de compras por proveedor.
- Reusar el precio que un proveedor sugiere de cierto producto.
- Evitar duplicados por tipos ("Juan Perez" vs "juan perez").

**Solución propuesta:** crear dos entidades nuevas (`Supplier`, `SupplierProduct`), añadir un FK opcional `supplierId` a `InventoryEntry`, y exponer un conjunto de endpoints CRUD + un endpoint de historial de compras.

Esta spec **amplía** la propuesta original del [doc de variantes](./spec-tecnicas.md#L650) con:
- Entidad nueva `SupplierProduct` (no estaba en la propuesta original).
- Vínculo opcional al catálogo global `Product`.
- Soft delete en lugar de hard delete.
- Importación masiva de productos ofertados.
- Endpoint de historial de compras por proveedor.

---

## 2. Decisiones de diseño

| Decisión | Resolución | Razonamiento |
|---|---|---|
| Vínculo `SupplierProduct` ↔ `Product` | **Opcional** (`productId` nullable) | Permite ofertas vinculadas al catálogo (con autorrellenado al hacer entradas) o sueltas (texto libre, sin vínculo) |
| Borrado de proveedor | **Soft delete** (`active: boolean`) | Preserva el historial: un `InventoryEntry` con `supplierId` apuntando a un proveedor desactivado sigue siendo legible, y se puede reactivar el proveedor sin perder nada |
| Producto del proveedor no asignado al negocio | El frontend hará un flujo combinado "asignar al negocio + registrar entrada". El backend solo necesita aceptar `supplierId` en el endpoint de add-stock existente | Mantiene el backend simple, la complejidad UX queda en el frontend |
| Pro-gating | Backend devuelve `403` en todos los endpoints de suppliers si el plan no es Pro. El endpoint de menú devuelve el ítem para todos los planes con flag `requiresPro: true` para que el frontend muestre badge "Pro" | Permite que usuarios Free/Básico vean la funcionalidad y entiendan el valor de upgrade |
| Permisos de trabajadores (Worker) | Reusar el sistema de permisos granular existente. Añadir `suppliers` como `menuId`. Verificar `read/write/update/delete` por endpoint | Un trabajador puede tener permiso solo de lectura sobre proveedores, por ejemplo |

---

## 3. Migraciones de base de datos

### 3.1. Tabla `suppliers`

```sql
CREATE TABLE suppliers (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID         NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  description   TEXT         NULL,
  contact_name  VARCHAR(255) NULL,
  phone         VARCHAR(50)  NULL,
  email         VARCHAR(255) NULL,
  address       VARCHAR(500) NULL,
  active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_by    UUID         NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Un proveedor activo no puede repetir nombre en el mismo negocio.
-- Si se desactiva, se puede crear otro con el mismo nombre.
CREATE UNIQUE INDEX uniq_supplier_business_name_active
  ON suppliers(business_id, name)
  WHERE active = TRUE;

CREATE INDEX idx_supplier_business_active
  ON suppliers(business_id, active);
```

### 3.2. Tabla `supplier_products`

```sql
CREATE TABLE supplier_products (
  id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id  UUID            NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id   UUID            NULL     REFERENCES products(id)  ON DELETE SET NULL,
  name         VARCHAR(255)    NOT NULL,
  price        DECIMAL(12, 2)  NOT NULL,
  unit         VARCHAR(10)     NOT NULL CHECK (unit IN ('kg','lb','g','L','mL','ud')),
  notes        TEXT            NULL,
  created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uniq_supplier_product_name
  ON supplier_products(supplier_id, name);

CREATE INDEX idx_supplier_product_supplier
  ON supplier_products(supplier_id);

CREATE INDEX idx_supplier_product_product
  ON supplier_products(product_id) WHERE product_id IS NOT NULL;
```

### 3.3. Modificación a `inventory_entries`

```sql
ALTER TABLE inventory_entries
  ADD COLUMN supplier_id UUID NULL REFERENCES suppliers(id) ON DELETE SET NULL;

CREATE INDEX idx_inventory_entries_supplier
  ON inventory_entries(supplier_id) WHERE supplier_id IS NOT NULL;
```

El campo existente `supplier` (TEXT libre) **se mantiene** por compatibilidad. Cuando se envíe `supplier_id`, el backend debe rellenar `supplier` con el nombre del proveedor en ese momento, para que el historial siga siendo legible aunque el proveedor se desactive en el futuro.

---

## 4. Endpoints — CRUD de Supplier

### 4.1. `GET /suppliers/business/{businessId}`

Listar proveedores de un negocio.

**Query params:**

| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | int | 1 | Página actual |
| `limit` | int | 20 | Items por página |
| `search` | string | — | Búsqueda case-insensitive por `name`, `contactName`, `phone` |
| `includeInactive` | boolean | `false` | Si `true`, incluye desactivados |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "businessId": "uuid",
      "name": "Distribuidora La Cubana",
      "description": "Mayorista de aceites y conservas",
      "contactName": "Pedro Sánchez",
      "phone": "+53 5 555 1234",
      "email": "pedro@lacubana.cu",
      "address": "Calle 23 #456, Vedado, La Habana",
      "active": true,
      "productsCount": 12,
      "createdBy": "uuid",
      "createdAt": "2026-05-23T10:00:00Z",
      "updatedAt": "2026-05-23T10:00:00Z"
    }
  ],
  "meta": {
    "total": 35,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

### 4.2. `GET /suppliers/{supplierId}`

Detalle de un proveedor.

**Response `200 OK`:** mismo objeto Supplier del listado, incluye `productsCount`.
**Errores:** `404` si no existe o pertenece a un negocio del que el usuario no es miembro.

### 4.3. `POST /suppliers`

Crear proveedor nuevo.

**Body:**
```json
{
  "businessId": "uuid",
  "name": "Distribuidora La Cubana",
  "description": "Mayorista de aceites y conservas",
  "contactName": "Pedro Sánchez",
  "phone": "+53 5 555 1234",
  "email": "pedro@lacubana.cu",
  "address": "Calle 23 #456, Vedado, La Habana"
}
```

Solo `businessId` y `name` son requeridos. El resto opcional.

**Validaciones:**
- `name`: min 2 chars, max 255.
- `email`: formato válido si se envía.
- `phone`: max 50 chars.
- `businessId`: el usuario debe ser dueño o trabajador con permiso `write` en `suppliers`.

**Response `201 Created`:** el objeto `Supplier` completo creado.

**Errores:**
- `400` si validación falla.
- `409` `{ "message": "Ya existe un proveedor activo con ese nombre en este negocio" }`.
- `403` si el plan no es Pro o el usuario no tiene permisos.

### 4.4. `PATCH /suppliers/{supplierId}`

Actualizar proveedor existente.

**Body:** cualquier subconjunto de los campos de `POST` (todos opcionales). `businessId` **no** se puede cambiar.

**Response `200 OK`:** objeto `Supplier` actualizado.

**Errores:** `404`, `409`, `403` (mismos que `POST`).

### 4.5. `DELETE /suppliers/{supplierId}` (soft delete)

Marca el proveedor como inactivo (`active = false`). No borra físicamente. El `InventoryEntry` con `supplier_id` apuntando aquí queda intacto.

**Response `200 OK`:**
```json
{ "message": "Proveedor desactivado correctamente" }
```

**Errores:** `404`, `403`.

### 4.6. `POST /suppliers/{supplierId}/restore`

Reactiva un proveedor desactivado (`active = true`).

**Validación:** si ya existe otro proveedor activo con el mismo nombre en ese negocio, devolver `409`.

**Response `200 OK`:** el objeto `Supplier` reactivado.

---

## 5. Endpoints — CRUD de SupplierProduct (productos ofertados)

### 5.1. `GET /suppliers/{supplierId}/products`

Lista de productos ofertados por un proveedor.

**Query params:**

| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | int | 1 | |
| `limit` | int | 20 | |
| `search` | string | — | Búsqueda en `name` |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "supplierId": "uuid",
      "productId": "uuid | null",
      "name": "Aceite de girasol 1L",
      "price": 250.00,
      "unit": "L",
      "notes": "Caja de 12 unidades",
      "product": {
        "id": "uuid",
        "name": "Aceite de girasol",
        "category": "Aceites",
        "unit": "L",
        "imageUrl": "https://..."
      },
      "createdAt": "2026-05-23T10:00:00Z",
      "updatedAt": "2026-05-23T10:00:00Z"
    }
  ],
  "meta": { "total": 12, "page": 1, "limit": 20, "totalPages": 1 }
}
```

- `product` solo se incluye si `productId` no es null. Si es null, devolver `product: null`.

### 5.2. `POST /suppliers/{supplierId}/products`

Añadir un producto a la oferta del proveedor.

**Body:**
```json
{
  "name": "Aceite de girasol 1L",
  "price": 250.00,
  "unit": "L",
  "productId": "uuid (opcional)",
  "notes": "Caja de 12 unidades (opcional)"
}
```

**Validaciones:**
- `name`: min 1 char, max 255, único dentro del proveedor.
- `price`: > 0.
- `unit`: uno de `kg | lb | g | L | mL | ud`.
- `productId`: si se envía, debe existir en `products`.

**Response `201 Created`:** el objeto `SupplierProduct` completo.

**Errores:**
- `400` validación.
- `409` `{ "message": "Este proveedor ya oferta un producto con ese nombre" }`.
- `404` si `supplierId` o `productId` no existen.
- `403` plan/permiso.

### 5.3. `POST /suppliers/{supplierId}/products/bulk`

Importación masiva de productos ofertados (ej. desde el catálogo del negocio).

**Body:**
```json
{
  "items": [
    { "name": "Aceite", "price": 250.00, "unit": "L", "productId": "uuid", "notes": null },
    { "name": "Arroz", "price": 80.00, "unit": "kg", "productId": "uuid" }
  ]
}
```

**Response `201 Created`:**
```json
{
  "created": [ /* array de SupplierProduct creados */ ],
  "skipped": [
    { "name": "Frijoles", "reason": "duplicate" },
    { "name": "X", "reason": "invalid_unit" }
  ]
}
```

La operación es **parcialmente exitosa**: crea los válidos y reporta los que se saltaron con su razón. Razones posibles: `duplicate`, `invalid_unit`, `invalid_price`, `product_not_found`.

### 5.4. `PATCH /suppliers/{supplierId}/products/{supplierProductId}`

Actualizar una oferta.

**Body:** cualquier subconjunto de campos de `POST`. Response y errores análogos a `POST`.

### 5.5. `DELETE /suppliers/{supplierId}/products/{supplierProductId}`

**Hard delete** — está OK borrar físicamente porque `InventoryEntry` no referencia `supplierProductId` (solo referencia `supplierId`).

**Response `200 OK`:**
```json
{ "message": "Producto eliminado de la oferta del proveedor" }
```

---

## 6. Endpoint — Historial de compras por proveedor

### 6.1. `GET /suppliers/{supplierId}/purchase-history`

Devuelve las entradas de inventario (`InventoryEntry`) hechas a este proveedor, agregadas con totales.

**Query params:**

| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | int | 1 | |
| `limit` | int | 20 | |
| `startDate` | ISO 8601 | — | Filtro desde |
| `endDate` | ISO 8601 | — | Filtro hasta |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "entryId": "uuid",
      "productId": "uuid",
      "productName": "Aceite de girasol",
      "quantity": 24,
      "entryPrice": 250.00,
      "totalCost": 6000.00,
      "description": "Compra mensual",
      "createdAt": "2026-05-20T14:30:00Z",
      "createdByName": "Pedro Rodríguez"
    }
  ],
  "totals": {
    "totalSpent": 18500.00,
    "totalEntries": 7
  },
  "meta": { "total": 7, "page": 1, "limit": 20, "totalPages": 1 }
}
```

- `totals` calcula sobre **todo el rango filtrado**, no solo la página actual.
- Ordenado por `createdAt DESC` (más reciente primero).

---

## 7. Modificación a endpoint existente — Add Stock

### 7.1. `POST /inventory/business/{businessId}/product/{productId}/add-stock`

Añadir al body un campo opcional `supplierId`:

**Body actual + nuevo campo:**
```json
{
  "quantity": 10,
  "entryPrice": 50.00,
  "description": "Compra mensual",
  "supplierId": "uuid (opcional, nuevo)"
}
```

**Validaciones nuevas:**
- Si `supplierId` se envía, debe existir, pertenecer al `businessId` de la URL y tener `active = true`. Si no, devolver `400 { "message": "Proveedor inválido o inactivo" }`.

**Side effect:**
- Si se envía `supplierId`, el backend debe:
  1. Persistir `inventory_entries.supplier_id = supplierId`.
  2. Rellenar `inventory_entries.supplier` (texto) con el `name` del proveedor en ese momento. Esto preserva legibilidad histórica aunque el proveedor se desactive.

**Compatibilidad:** las llamadas que NO envíen `supplierId` siguen funcionando exactamente igual que hoy.

---

## 8. Pro-gating y permisos

### 8.1. Pro-gating

**Todos los endpoints** de las secciones 4, 5 y 6 deben devolver:

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{ "message": "Funcionalidad disponible solo en Plan Pro" }
```

…si el plan del usuario autenticado no es Pro.

**Excepción:** el endpoint `/menu/` debe devolver el ítem "Proveedores" para **todos los planes** (Free, Básico, Pro), con un flag adicional:

```json
{
  "id": "suppliers",
  "label": "Proveedores",
  "path": "/dashboard/business/suppliers",
  "icon": "truck",
  "requiresPro": true,
  "plans": ["free", "basic", "pro"]
}
```

Esto permite al frontend mostrar el ítem en el sidebar con un badge "Pro" para usuarios no-Pro, y al hacer click mostrarles una pantalla bloqueada con CTA de upgrade.

### 8.2. Permisos de trabajadores (Worker)

Reusar el sistema de permisos granular existente (`WorkerPermissoEntry` con `read/write/update/delete/download/all`).

Añadir `suppliers` como nuevo `menuId` en el seed de menús. Cada endpoint verifica el permiso correspondiente:

| Endpoint | Permiso requerido |
|---|---|
| `GET /suppliers/business/{businessId}` | `read` |
| `GET /suppliers/{supplierId}` | `read` |
| `GET /suppliers/{supplierId}/products` | `read` |
| `GET /suppliers/{supplierId}/purchase-history` | `read` |
| `POST /suppliers` | `write` |
| `POST /suppliers/{supplierId}/products` | `write` |
| `POST /suppliers/{supplierId}/products/bulk` | `write` |
| `PATCH /suppliers/{supplierId}` | `update` |
| `PATCH /suppliers/{supplierId}/products/{spId}` | `update` |
| `DELETE /suppliers/{supplierId}` | `delete` |
| `DELETE /suppliers/{supplierId}/products/{spId}` | `delete` |
| `POST /suppliers/{supplierId}/restore` | `update` |

El dueño del negocio (`Business.userId`) siempre tiene todos los permisos sin necesidad de configuración explícita.

Para el endpoint `POST /inventory/.../add-stock`, el campo `supplierId` no añade permiso extra: si el usuario ya tenía permiso de `write` en `inventory`, puede usarlo.

---

## 9. Códigos de error — referencia

| Código | Cuándo |
|---|---|
| `400 Bad Request` | Validación de body falla (campos requeridos, tipos, formato email, unit inválido, price ≤ 0, `supplierId` referenciando proveedor inactivo) |
| `401 Unauthorized` | Token JWT inválido o ausente |
| `403 Forbidden` | Plan no Pro **o** trabajador sin el permiso requerido |
| `404 Not Found` | `supplierId`, `supplierProductId` o `businessId` no existen, o no pertenecen al alcance del usuario |
| `409 Conflict` | Nombre duplicado al crear/restaurar |
| `500 Internal Server Error` | Error inesperado |

Formato uniforme de errores:
```json
{
  "message": "Descripción legible del error",
  "error": "ERROR_CODE (opcional)"
}
```

---

## 10. Checklist de implementación recomendada

Orden sugerido para minimizar bloqueos:

1. **Migraciones** (sección 3)
   - [ ] Crear tabla `suppliers`
   - [ ] Crear tabla `supplier_products`
   - [ ] Añadir `supplier_id` a `inventory_entries`
   - [ ] Crear índices

2. **Modelos / entidades / DTOs** según el framework del backend

3. **Pro-gate middleware** reutilizable
   - [ ] Helper que verifica plan Pro y devuelve `403` si no aplica
   - [ ] Helper que verifica permisos de Worker (`menuId` + acción)

4. **CRUD Supplier** (sección 4)
   - [ ] `GET /suppliers/business/{businessId}` con paginación y búsqueda
   - [ ] `GET /suppliers/{supplierId}` con `productsCount`
   - [ ] `POST /suppliers` con validación de unicidad
   - [ ] `PATCH /suppliers/{supplierId}`
   - [ ] `DELETE /suppliers/{supplierId}` (soft)
   - [ ] `POST /suppliers/{supplierId}/restore`

5. **CRUD SupplierProduct** (sección 5)
   - [ ] `GET /suppliers/{supplierId}/products` con nested `product`
   - [ ] `POST /suppliers/{supplierId}/products`
   - [ ] `POST /suppliers/{supplierId}/products/bulk`
   - [ ] `PATCH /suppliers/{supplierId}/products/{spId}`
   - [ ] `DELETE /suppliers/{supplierId}/products/{spId}`

6. **Historial de compras** (sección 6)
   - [ ] `GET /suppliers/{supplierId}/purchase-history` con totales

7. **Modificar add-stock** (sección 7)
   - [ ] Aceptar `supplierId` opcional
   - [ ] Validar pertenencia y `active = true`
   - [ ] Rellenar `supplier` (texto) con el nombre del proveedor

8. **Actualizar endpoint `/menu/`** (sección 8.1)
   - [ ] Devolver el ítem "Proveedores" para todos los planes con flag `requiresPro: true`
   - [ ] Añadir `suppliers` al sistema de permisos de Worker

9. **Pruebas**
   - [ ] Tests de unicidad parcial (no permite duplicar nombre activo, sí permite si el otro está inactivo)
   - [ ] Tests de soft delete (verificar que `InventoryEntry` no se rompa)
   - [ ] Tests de pro-gating (Free/Básico reciben 403)
   - [ ] Tests de permisos por Worker
   - [ ] Test del flujo `add-stock` con `supplierId` válido / inválido / inactivo

10. **Postman / OpenAPI**
    - [ ] Actualizar la colección/spec compartida con los nuevos endpoints

---

## 11. Preguntas abiertas para el equipo de backend

Antes de implementar, por favor confirmar:

1. ¿El campo `address` en `Supplier` debe ser estructurado (calle, ciudad, etc.) o se mantiene como string libre? **Propuesta:** string libre por simplicidad.
2. ¿El email de un proveedor debe validarse como único dentro del negocio? **Propuesta:** no, dos proveedores pueden compartir email (ej. distribuidoras de una misma empresa).
3. ¿Hay límite de productos ofertados por proveedor según plan? **Propuesta:** no limitar inicialmente.
4. Para el endpoint `bulk`, ¿se considera aceptable la operación parcialmente exitosa (devuelve los creados + los saltados)? **Propuesta:** sí, evita re-enviar todo si solo uno falla.
5. ¿Cómo manejar la migración del campo `supplier` (texto libre) existente? **Propuesta:** no hacer migración automática. Los datos viejos se quedan como texto, los nuevos pueden usar `supplierId`. Si más adelante se quiere migrar, se hace en una segunda fase con UI de "matching" manual.

---

## 12. Cambios futuros (fuera del alcance de esta spec)

- Endpoint para sugerir el "mejor proveedor" de un producto basado en precio histórico promedio.
- Recordatorios automáticos de reabastecimiento basados en stock bajo + proveedor preferido.
- Soporte multi-moneda en el precio del `SupplierProduct` (hoy se asume CUP).

---

**Fin del documento.** Cualquier duda escribir a `technology@commercecraft.ai`.
