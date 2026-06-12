## 📋 Guía de Implementación Frontend para el Cambio de Relación Category

### 🔑 Cambios Clave que Debe Manejar el Frontend

#### 1. **Endpoint de Categorías - Paginación**

**Antes:**
```json
GET /api/v2/category
{
  "message": "Categorías obtenidas exitosamente",
  "data": [Category...]
}
```

**Después:**
```json
GET /api/v2/category?page=1&limit=10
{
  "message": "Categorías obtenidas exitosamente",
  "data": [Category...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

**Acciones Frontend:**
- Agregar parámetros `page` y `limit` a las peticiones de categorías
- Actualizar componentes de lista para manejar `total`, `page`, `limit`
- Implementar paginador o infinite scroll si no existe

---

#### 2. **Categoría en Productos - BusinessProduct en lugar de Product**

**Antes (al obtener productos de un negocio):**
```json
{
  "product": { "id": "...", "name": "...", "category": { "id": "...", "name": "Frutas" } },
  "businessProduct": { "id": "...", "price": 100, "stock": 10 }
}
```

**Después (al obtener productos de un negocio):**
```json
{
  "product": { "id": "...", "name": "..." },
  "businessProduct": { 
    "id": "...", 
    "price": 100, 
    "stock": 10,
    "category": { "id": "...", "name": "Frutas" }  // ← Ahora aquí
  }
}
```

**Acciones Frontend:**

| Caso de Uso | Acción Requerida |
|-------------|-----------------|
| **Listar productos de un negocio** | Leer categoría desde `businessProduct.category` en lugar de `product.category` |
| **Crear producto con categoría** | Enviar `categoryId` en el endpoint `/product/business/{businessId}` - la categoría se asignará al BusinessProduct |
| **Reportes de ventas por categoría** | Agrupar por `businessProduct.category` en lugar de `product.category` |
| **Filtros de productos por categoría** | Usar la categoría de BusinessProduct, no de Product |

---

#### 3. **Crear Producto con Negocio**

**Endpoint:** `POST /api/v2/product/business/{businessId}`

**DTO esperado (sin cambios):**
```json
{
  "name": "Arroz",
  "description": "Arroz blanco",
  "unit": "kg",
  "categoryId": "uuid-de-categoria",  // ← Se asignará al BusinessProduct
  "price": 15.50,
  "stock": 100
}
```

---

#### 4. **Consultas con BusinessProduct**

En los siguientes endpoints, la categoría ahora está en el nivel de BusinessProduct:

| Endpoint | Cambio |
|----------|--------|
| `GET /business/{id}/products` | `product.category` → `businessProduct.category` |
| `GET /business/{id}/stock-alerts` | `bp.product.category` → `bp.category` |
| `GET /inventory/business/{id}/current` | `product.category` → `category` (en BusinessProduct) |

---

### 🛠️ Código de Ejemplo para Adaptación

**Angular/React - Servicio de Categorías:**
```typescript
// Antes
getCategories(): Observable<Category[]> {
  return this.http.get<Category[]>('/api/v2/category');
}

// Después
getCategories(page: number = 1, limit: number = 10): Observable<PaginatedCategories> {
  return this.http.get<PaginatedCategories>('/api/v2/category', {
    params: { page: page.toString(), limit: limit.toString() }
  });
}

// Tipo de respuesta
interface PaginatedCategories {
  message: string;
  data: Category[];
  total: number;
  page: number;
  limit: number;
}
```

**Angular/React - Procesamiento de Productos:**
```typescript
// Antes
const productCategory = product.category?.name;

// Después
const productCategory = businessProduct?.category?.name || productCategoryFromFirstBP;

// Helper para obtener categoría del producto (si está en múltiples negocios)
function getProductCategory(businessProducts: BusinessProduct[]): string | null {
  return businessProducts.find(bp => bp.category)?.category?.name || null;
}
```

---

### 📊 Impacto en Reportes y Analytics

| Reporte | Acción Requerida |
|---------|-----------------|
| **Ventas por categoría** | Usar `sale.items.product.businessProducts` → filtrar por business → obtener categoría |
| **Productos por categoría** | Agrupar por `businessProduct.category` |
| **Margen por categoría** | Calcular usando `businessProduct.category` + `entryPrice` |

---

### ⚠️ Notas Importantes

1. **Producto sin negocio**: Si un producto existe pero no tiene BusinessProduct, NO tendrá categoría
2. **Mismo producto, diferentes categorías**: Un producto puede aparecer en múltiples negocios con categorías diferentes
3. **Categoría null**: Siempre manejar el caso donde `category` es `null`
4. **Migración de datos**: Los productos existentes necesitarán que su categoría actual se transfiera al BusinessProduct correspondiente