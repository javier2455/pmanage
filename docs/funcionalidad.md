# Business Schedule API - Guía para Frontend

## Endpoints

### 1. Obtener horario del negocio

```
GET /v2/businesses/:id/schedule
```

**Descripción**: Devuelve el horario de disponibilidad completo del negocio (array de 0 a 7 registros, uno por día de la semana).

**Headers**:

```typescript
Authorization: Bearer <token>
```

**Roles**: admin, business_owner.

**Nota**: No requiere cuerpo (body). El `id` en la URL es el ID del negocio.

---

### 2. Reemplazar horario completo (upsert)

```
PUT /v2/businesses/:id/schedule
```

**Descripción**: Reemplaza **todo** el horario del negocio. Envía un array con hasta 7 registros (uno por cada `dayOfWeek` del 0 al 6). Si existe un registro para ese día se actualiza; si no existe se crea.

**Headers**:

```typescript
Authorization: Bearer <token>
Content-Type: application/json
```

**Roles**: admin, business_owner.

---

## Modelos

### `BusinessSchedule` (response)

```typescript
interface BusinessSchedule {
  id: string;          // UUID del registro de horario
  dayOfWeek: number;   // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  openTime: string | null;   // "HH:mm" o null si está cerrado
  closeTime: string | null;  // "HH:mm" o null si está cerrado
  isClosed: boolean;   // true = cerrado todo el día
  createdBy: string | null;
  createdAt: string;   // ISO timestamp
  updatedAt: string;   // ISO timestamp
  businessId: string;  // UUID del negocio
}
```

### Request body para `PUT`

```typescript
interface CreateBusinessScheduleDto {
  dayOfWeek: number;           // 0 a 6 (entero)
  isClosed?: boolean;          // opcional
  openTime?: string;           // "HH:mm" (obligatorio si isClosed = false)
  closeTime?: string;          // "HH:mm" (obligatorio si isClosed = false)
}

interface UpsertBusinessScheduleDto {
  schedules: CreateBusinessScheduleDto[];
}
```

**Reglas de negocio (validadas en backend)**:

- `dayOfWeek` debe estar entre 0 y 6.
- No puede haber días repetidos en el array enviado.
- Si `isClosed = true`, no se requieren `openTime` ni `closeTime`.
- Si `isClosed = false` o no se especifica, `openTime` y `closeTime` son obligatorios.
- `openTime` debe ser menor que `closeTime`.
- Formato de hora: `HH:mm` (24 horas, con ceros iniciales).

---

## Responses

### GET - 200 OK

```typescript
interface BusinessScheduleResponse {
  message: string;
  data: BusinessSchedule[];
}
```

### PUT - 200 OK

```typescript
interface BusinessScheduleUpsertResponse {
  message: string;
  data: BusinessSchedule[];
}
```

El array devuelto contiene los registros guardados/actualizados (normalmente en el mismo orden del request, aunque no está garantizado).

---

## Códigos de Error

| Status | Descripción |
|--------|-------------|
| 400 | Datos inválidos (formato de hora, día duplicado, horario inválido) |
| 401 | No autorizado - Token inválido o faltante |
| 404 | Negocio no encontrado |

---

## Ejemplos

### Angular

```typescript
// business-schedule.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BusinessSchedule {
  id: string;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  businessId: string;
}

@Injectable({ providedIn: 'root' })
export class BusinessScheduleService {
  private readonly baseUrl = `${environment.apiUrl}/v2/businesses`;

  constructor(private http: HttpClient) {}

  getSchedule(businessId: string): Observable<{ message: string; data: BusinessSchedule[] }> {
    return this.http.get<{ message: string; data: BusinessSchedule[] }>(
      `${this.baseUrl}/${businessId}/schedule`
    );
  }

  upsertSchedule(
    businessId: string,
    schedules: Array<{
      dayOfWeek: number;
      isClosed?: boolean;
      openTime?: string;
      closeTime?: string;
    }>
  ): Observable<{ message: string; data: BusinessSchedule[] }> {
    return this.http.put<{ message: string; data: BusinessSchedule[] }>(
      `${this.baseUrl}/${businessId}/schedule`,
      { schedules }
    );
  }

  deleteSchedule(businessId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${businessId}/schedule`
    );
  }
}
```

### React (fetch)

```typescript
// businessScheduleApi.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface BusinessSchedule {
  id: string;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  businessId: string;
}

export async function getBusinessSchedule(
  businessId: string,
  token: string
): Promise<{ message: string; data: BusinessSchedule[] }> {
  const res = await fetch(
    `${API_URL}/v2/businesses/${businessId}/schedule`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function upsertBusinessSchedule(
  businessId: string,
  schedules: Array<{
    dayOfWeek: number;
    isClosed?: boolean;
    openTime?: string;
    closeTime?: string;
  }>,
  token: string
): Promise<{ message: string; data: BusinessSchedule[] }> {
  const res = await fetch(
    `${API_URL}/v2/businesses/${businessId}/schedule`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ schedules }),
    }
  );
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}
```

### React Query (ejemplo)

```typescript
const useBusinessSchedule = (businessId: string, token: string) => {
  return useQuery({
    queryKey: ['business-schedule', businessId],
    queryFn: () => getBusinessSchedule(businessId, token),
  });
};

const useUpsertBusinessSchedule = (businessId: string, token: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (schedules) => upsertBusinessSchedule(businessId, schedules, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-schedule', businessId] });
    },
  });
};
```

---

## Notas Importantes

- **Zona horaria**: Los horarios se guardan en formato `HH:mm` sin zona horaria. El frontend debe interpretarlos según la zona local del negocio o del usuario.
- **Día cerrado**: Si `isClosed` es `true`, el frontend debe mostrar ese día como "Cerrado" y ocultar los horarios de apertura/cierre.
- **Rango opcional**: Aunque el backend valida el rango completo (0-6) y unicidad por día, el frontend puede enviar solo los días que requieran configuración. Los días faltantes no se interpretan como "cerrados" a menos que se envíe explícitamente `isClosed: true`.
- **Reemplazo completo**: El endpoint `PUT` reemplaza todo el horario. Si el frontend envía solo 3 días, los demás días se mantendrán tal como estaban previamente. Para "limpiar" o "resetear" todos los días, el frontend debe enviar un array completo de 7 elementos (o usar `DELETE` para borrar todo).