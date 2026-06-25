# Bug: `GET /businesses/my-businesses` no devuelve la relación anidada `municipality`

> **Para:** equipo de backend (`psearch.dveloxsoft.com`)
> **De:** equipo de frontend (pmanage)
> **Severidad:** media — la provincia y el municipio aparecen vacíos (`-`) en la pantalla de detalles del negocio.
> **Estado del frontend:** ya implementado y blindado para consumir la relación. En cuanto el backend la incluya, la UI funcionará sin más cambios.

---

## 1. Síntoma

En **Dashboard → Detalles del negocio**, los campos **Provincia** y **Municipio** se muestran siempre como `-`, aunque el negocio sí tenga un municipio asignado (de hecho fue obligatorio asignarlo al crearlo).

## 2. Causa raíz

El frontend pinta provincia y municipio en modo lectura a partir del objeto anidado **`municipality`** del negocio activo, que se obtiene de `GET /businesses/my-businesses`:

```ts
// Forma que el frontend espera (src/lib/types/business.ts)
type Business = {
  // ...
  municipalityId: string | null;
  municipality: {
    id: string;
    name: string;
    provinceId: string;   // FK a la provincia
  } | null;
  // ...
}
```

- El **nombre del municipio** se toma directo de `municipality.name`.
- El **nombre de la provincia** se resuelve buscando `municipality.provinceId` dentro del catálogo de provincias (`GET /search/provinces`).

Actualmente **`GET /businesses/my-businesses` está devolviendo `municipalityId` pero NO el objeto anidado `municipality`** (llega `null` o ausente). Sin ese objeto, el frontend no tiene forma de saber ni el nombre del municipio ni a qué provincia pertenece, porque:

- No existe un endpoint "municipio por id"; solo hay `GET /search/municipalities?province=:id` (municipios **por provincia**).
- Sin `provinceId` no se puede inferir la provincia a partir de un `municipalityId` suelto.

Por eso **ambos** campos quedan vacíos.

## 3. Solución requerida en el backend

Incluir la relación **`municipality`** (con su `provinceId`) en la respuesta de `GET /businesses/my-businesses`, para **cada** negocio del arreglo.

Ejemplo de la forma esperada por negocio:

```json
{
  "id": "biz_123",
  "name": "Mi Tienda",
  "municipalityId": "45",
  "municipality": {
    "id": "45",
    "name": "Plaza de la Revolución",
    "provinceId": "3"
  },
  "lat": 23.1357,
  "lng": -82.3892
}
```

### Requisitos del contrato

| Campo | Tipo | Notas |
|---|---|---|
| `municipality` | objeto o `null` | `null` solo si el negocio realmente no tiene municipio asignado |
| `municipality.id` | `string` | mismo valor que `municipalityId` |
| `municipality.name` | `string` | nombre legible del municipio |
| `municipality.provinceId` | `string` | FK a la provincia; debe coincidir con un `id` del catálogo de `GET /search/provinces` |

> **Nota sobre tipos:** el frontend ya normaliza `provinceId` a string al comparar, así que es indiferente si llega como número o string. Aun así, lo ideal es enviarlo como string para mantener la consistencia con `GET /search/provinces`.

### Implementación sugerida

Es el típico *eager load* de la relación. Por ejemplo, en TypeORM:

```ts
// Repositorio de Business al resolver my-businesses
this.businessRepository.find({
  where: { /* ...filtros de usuario/trabajador... */ },
  relations: { municipality: true },
});
```

O en la query builder, un `leftJoinAndSelect('business.municipality', 'municipality')`.

## 4. Verificación

Tras el cambio, `GET /businesses/my-businesses` debe devolver `municipality` poblado en cada negocio que tenga `municipalityId`. En el frontend, la pantalla de detalles mostrará automáticamente provincia y municipio sin necesidad de redeploy del cliente.

## 5. Endpoints relacionados (sin cambios)

- `GET /search/provinces` → `{ message, data: Province[] }` con `Province = { id, name, code }`.
- `GET /search/municipalities?province=:id` → `{ message, data: Municipality[] }` con `Municipality = { id, name, provinceId }`.

Estos ya funcionan correctamente; el único cambio necesario es incluir la relación `municipality` en `my-businesses`.
