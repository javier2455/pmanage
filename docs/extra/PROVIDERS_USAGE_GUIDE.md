# Guía de Uso de Providers (v2)

Este documento describe todos los casos de uso relacionados con la entidad `Provider` en la versión 2 de la API, incluyendo dónde se crean/actualizan, cómo se realizan las operaciones y qué se espera obtener como respuesta.

## Endpoints Disponibles

### 1. Crear un Nuevo Proveedor
- **Endpoint:** `POST /v2/providers`
- **Controlador:** `ProvidersController.create()`
- **Servicio:** `ProvidersService.create()`

#### Parámetros de Entrada (Request Body)
```typescript
{
  name: string (requerido, maxlength: 255);
  description?: string (opcional);
  contactName?: string (opcional, maxlength: 255);
  email?: string (opcional);
  phone?: string (opcional, maxlength: 50);
  businessId: string (requerido, UUID);
  providerProducts?: Array<{
    productId: string (requerido, UUID);
    price: number (opcional, mínimo: 0);
  }>;
}
```

#### Validaciones y Reglas de Negocio
1. El `businessId` debe corresponder a un negocio existente
2. El usuario autenticado debe ser:
   - El propietario del negocio (`business.userId === userId`), O
   - Un administrador (`roleId === 5`)
3. No puede existir otro proveedor con el mismo `name` dentro del mismo negocio
4. Si se proporcionan `providerProducts`:
   - Cada `productId` debe corresponder a un producto existente
   - Se crean o actualizan las relaciones `provider-product` con los precios especificados

#### Proceso de Creación
1. Verifica existencia y permisos del negocio
2. Valida unicidad del nombre del proveedor en el negocio
3. Crea el proveedor básico
4. Si se proporcionan `providerProducts`:
   - Para cada producto:
     * Verifica existencia del producto
     * Busca si ya existe una relación provider-product
     * Si existe: actualiza el precio
     * Si no existe: crea nueva relación
5. Recarga el proveedor con sus relaciones (`providerProducts` y `providerProducts.product`)
6. Retorna el proveedor completo

#### Respuesta Exitosa (201 Created)
```json
{
  "message": "Proveedor creado exitosamente",
  "data": {
    "id": "string (UUID)",
    "name": "string",
    "description": "string | null",
    "contactName": "string | null",
    "email": "string | null",
    "phone": "string | null",
    "businessId": "string (UUID)",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)",
    "providerProducts": [
      {
        "id": "string (UUID)",
        "price": "number",
        "product": {
          "id": "string (UUID)",
          "name": "string",
          // ... otros campos del producto
        }
      }
    ]
  }
}
```

#### Posibles Errores
- `400`: Datos inválidos (validación de DTO fallida)
- `401`: No autorizado (token JWT faltante o inválido)
- `403`: Prohibido - No tienes acceso al negocio
- `404`: Negocio no encontrado
- `409`: Proveedor ya existe en este negocio

---

### 2. Actualizar un Proveedor Existente
- **Endpoint:** `PUT /v2/providers/:id`
- **Controlador:** `ProvidersController.update()`
- **Servicio:** `ProvidersService.update()`

#### Parámetros de Entrada
- **URL Params:** `id` (UUID del proveedor a actualizar)
- **Request Body:** Mismo formato que creación, pero todos los campos son opcionales excepto `businessId` (que no se puede modificar directamente)

#### Validaciones y Reglas de Negocio
1. El proveedor con el `id` especificado debe existir
2. El usuario autenticado debe tener permisos sobre el negocio del proveedor (misma regla que creación)
3. Si se actualiza el `name`: debe ser único dentro del mismo negocio
4. Si se proporcionan `providerProducts`: reemplaza COMPLETAMENTE las relaciones existentes
   - Elimina todas las relaciones provider-product actuales
   - Crea nuevas relaciones basado en el array proporcionado
   - Si se envía array vacío: elimina todas las relaciones
   - Si se omite el campo: mantiene las relaciones actuales

#### Proceso de Actualización
1. Valida existencia del proveedor y permisos de acceso
2. Si se actualiza nombre: verifica unicidad en el negocio
3. Aplica los cambios enviados en el DTO al proveedor existente
4. Guarda el proveedor actualizado
5. Si se proporcionan `providerProducts`:
   - Elimina todas las relaciones existentes
   - Crea nuevas relaciones (mismo proceso que en creación)
6. Recarga el proveedor con sus relaciones actualizadas
7. Retorna el proveedor completo

#### Respuesta Exitosa (200 OK)
Mismo formato que la respuesta de creación, pero con los valores actualizados y `updatedAt` modificado.

#### Posibles Errores
Mismos que creación, además de:
- `404`: Proveedor no encontrado

---

### 3. Obtener Lista de Proveedores
#### A. Obtener Todos los Proveedores del Usuario
- **Endpoint:** `GET /v2/providers`
- **Controlador:** `ProvidersController.findAll()`
- **Servicio:** `ProvidersService.findAll()`

#### Parámetros de Consulta (Query Params)
- `page`: número (opcional, default: 1)
- `limit`: número (opcional, default: 10)
- `businessId`: string (opcional) - filtra por negocio específico

#### Lógica de Autorización
- Si `roleId !== 5` (no admin): solo devuelve proveedores de negocios donde `business.userId === userId`
- Si se especifica `businessId`: verifica que el usuario tenga acceso a ese negocio antes de filtrar

#### Proceso
1. Determina qué negocios puede acceder el usuario (según su rol)
2. Aplica filtros de negocio (si se especifica `businessId` o filtro por propiedad)
3. Ejecuta consulta paginada con join al negocio
4. Incluye relaciones: `business` (no incluye providerProducts por defecto para optimización)

#### Respuesta Exitosa (200 OK)
```json
{
  "data": [
    {
      "id": "string (UUID)",
      "name": "string",
      "description": "string | null",
      "contactName": "string | null",
      "email": "string | null",
      "phone": "string | null",
      "businessId": "string (UUID)",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)",
      "business": {
        "id": "string (UUID)",
        "name": "string"
        // ... otros campos del negocio
      }
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

#### B. Obtener Proveedores por ID de Negocio Específico
- **Endpoint:** `GET /v2/providers?businessId=:businessId`
- **Controlador:** `ProvidersController.findAll()` (redirige a `findByBusinessId` cuando se especifica businessId)
- **Servicio:** `ProvidersService.findByBusinessId()`

#### Requisitos
- El parámetro `businessId` es requerido en este caso
- Se verifica que el usuario tenga acceso al negocio especificado (misma regla de autorización)

#### Respuesta
Mismo formato que `findAll()` pero filtrado por el businessId especificado.

---

### 4. Obtener un Proveedor por ID
- **Endpoint:** `GET /v2/providers/:id`
- **Controlador:** `ProvidersController.findOne()`
- **Servicio:** `ProvidersService.findOne()`

#### Parámetros
- **URL Params:** `id` (UUID del proveedor)

#### Proceso
1. Busca el proveedor por ID
2. Verifica que el usuario tenga acceso al negocio del proveedor
3. Incluye relación: `business`

#### Respuesta Exitosa (200 OK)
```json
{
  "message": "Proveedor obtenido exitosamente",
  "data": {
    // Mismo objeto proveedor que en los listados, incluyendo:
    "id": "string (UUID)",
    "name": "string",
    // ... otros campos
    "business": {
      "id": "string (UUID)",
      "name": "string"
    }
  }
}
```

#### Posibles Errores
- `404`: Proveedor no encontrado
- `403`: Prohibido - No tienes acceso

---

### 5. Eliminar un Proveedor
- **Endpoint:** `DELETE /v2/providers/:id`
- **Controlador:** `ProvidersController.remove()`
- **Servicio:** `ProvidersService.remove()`

#### Parámetros
- **URL Params:** `id` (UUID del proveedor)

#### Proceso
1. Valida existencia del proveedor y permisos de acceso (misma regla)
2. Elimina el proveedor de la base de datos
3. Debido a la configuración `onDelete: 'CASCADE'` en la relación con ProviderProduct, se eliminan automáticamente las relaciones asociadas

#### Respuesta Exitosa (204 No Content)
- Cuerpo vacío

#### Posibles Errores
- `404`: Proveedor no encontrado
- `403`: Prohibido - No tienes acceso

---

## Detalles Técnicos Importantes

### Sistema de Permisos
- **Role ID 5**: Representa un rol de administrador/superusuario que tiene acceso a todos los negocios
- **Usuario Regular**: Solo puede acceder a proveedores de negocios donde `business.userId === userId` (propietario del negocio)

### Relaciones Cargadas
- **Listados generales** (`findAll`, `findByBusinessId`): Solo cargan la relación `business` para optimización
- **Operaciones individuales** (`findOne`, `create`, `update`): Cargan tanto `business` como `providerProducts` con sus productos asociados (`providerProducts.product`)

### Manejo de Provider-Product
- **Creación**: Se pueden crear relaciones provider-product simultáneamente
- **Actualización**: 
  - Si se envía el campo `providerProducts`: reemplazo completo (eliminar todas + crear nuevas)
  - Si se omite el campo: se mantienen las relaciones existentes
  - Si se envía array vacío: se eliminan todas las relaciones
- **Validación**: Cada productId debe existir en la entidad Product

### Campos de Auditoría
- `createdAt`: establecida automáticamente al crear
- `updatedAt`: actualizada automáticamente al crear y actualizar

### Manejo de Errores
Todos los endpoints siguen el patrón de respuesta:
- **Éxito**: `{ message: string, data: any }`
- **Error**: Se lanza una excepción HTTP apropiada que NestJS convierte a respuesta JSON con:
  - `statusCode`: número de código HTTP
  - `message`: string o array de strings con descripción del error
  - `error`: string corto tipo error (ej: "Not Found", "Bad Request")

---

## Casos Indirectos que Actualizan Provider-Products

Además de los endpoints directos de providers, existen otras operaciones en el sistema que pueden actualizar las relaciones provider-product:

### 1. Agregar Stock (Actualiza Precio de Entrada)
- **Endpoint:** `POST /v2/products/inventory/add-stock`
- **Servicio:** `InventoryService.addStock()`

Cuando se agrega stock a un producto en un negocio, si se proporciona información de proveedor (providerId) y precio de entrada, el sistema:
1. Busca o crea la relación provider-product
2. Actualiza el precio con el `entryPrice` proporcionado
3. Guarda la relación en la tabla provider_products
4. Registra el providerId en el historial de inventario para trazabilidad

**Parámetros que afectan provider-product:**
- `providerId`: ID del proveedor (opcional)
- `entryPrice`: Precio de entrada/costo (requerido si se proporciona provider info)

### 2. Creación/Actualización de Business Products
La entidad `BusinessProduct` mantiene una relación indirecta con provider-products a través del historial de precios de entrada (`entryPrice`), pero no modifica directamente las relaciones provider-product.

## Detalles Técnicos Importantes (Actualizado)

### Manejo de Provider-Product (Actualizado)
- **Creación directa**: A través de endpoints de providers (POST/PUT /v2/providers)
- **Actualización indirecta**: 
  - Al agregar stock mediante inventory service (actualiza precio de entrada)
  - No modifica la relación principal, solo actualiza el campo `price` en provider-product
  - Registra el providerId en el historial de inventario para trazabilidad
- **Validación**: Cada productId debe existir en la entidad Product

## Ejemplos de Uso

### Crear Proveedor con Productos
```http
POST /v2/providers
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Distribuidora ABC",
  "description": "Distribuidora de insumos médicos",
  "businessId": "550e8400-e29b-41d4-a716-446655440000",
  "providerProducts": [
    {
      "productId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "price": 15.99
    },
    {
      "productId": "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj",
      "price": 25.50
    }
  ]
}
```

### Actualizar Solo Información de Contacto
```http
PUT /v2/providers/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "contactName": "Nuevo Contacto",
  "email": "nuevo@contacto.com",
  "phone": "+19876543210"
}
```

### Reemplazar Lista Completa de Productos
```http
PUT /v2/providers/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "providerProducts": [
    {
      "productId": "nnnnnnnn-oooo-pppp-qqqq-rrrrrrrrrrrr",
      "price": 100.00
    }
  ]
}
```

### Eliminar Todas las Relaciones Producto-Proveedor
```http
PUT /v2/providers/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "providerProducts": []
}
```

### Agregar Stock con Información de Proveedor
```http
POST /v2/products/inventory/add-stock
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "businessId": "550e8400-e29b-41d4-a716-446655440000",
  "productId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "quantity": 100,
  "providerId": "11111111-bbbb-cccc-dddd-eeeeeeeeeeee",
  "entryPrice": 12.50,
  "description": "Compra mensual de inventario"
}
```