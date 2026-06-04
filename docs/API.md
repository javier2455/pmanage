# Business Settings API - Documentación Frontend

## Endpoints

### POST /businesses/{businessId}/settings
Crea la configuración de alertas de un negocio.

#### Headers
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

#### Request Body
```typescript
interface BusinessSettingsCreate {
  dailyClosingAlert?: ('email' | 'sms' | 'whatsapp')[];
  monthlyClosingAlert?: ('email' | 'sms' | 'whatsapp')[];
  lowStockAlert?: ('email' | 'sms' | 'whatsapp')[];
  outOfStockAlert?: ('email' | 'sms' | 'whatsapp')[];
}
```

#### Casos de Uso

**1. Configurar alertas solo email (todos los planes)**
```json
{
  "dailyClosingAlert": ["email"],
  "monthlyClosingAlert": ["email"],
  "lowStockAlert": ["email"],
  "outOfStockAlert": null
}
```

**2. Configurar alertas multi-canal (requiere plan PRO)**
```json
{
  "dailyClosingAlert": ["email", "sms", "whatsapp"],
  "monthlyClosingAlert": ["email"],
  "lowStockAlert": ["whatsapp"],
  "outOfStockAlert": ["email", "sms"]
}
```

**3. Deshabilitar todas las alertas**
```json
{
  "dailyClosingAlert": null,
  "monthlyClosingAlert": null,
  "lowStockAlert": null,
  "outOfStockAlert": null
}
```

#### Respuesta Exitosa (201)
```json
{
  "id": "uuid",
  "dailyClosingAlert": ["email"],
  "monthlyClosingAlert": null,
  "lowStockAlert": ["whatsapp"],
  "outOfStockAlert": null
}
```

#### Errores

**400 - Sin plan PRO requerido**
```json
{
  "statusCode": 400,
  "message": "Se requiere un plan PRO (Premium o Enterprise) para usar canales SMS o WhatsApp"
}
```

**400 - Plan no permitido**
```json
{
  "statusCode": 400,
  "message": "El plan actual (free) no permite usar canales SMS/WhatsApp. Se requiere plan Premium o Enterprise."
}
```

---

### GET /businesses/{businessId}/settings
Obtiene la configuración actual de alertas.

#### Respuesta (200)
```json
{
  "id": "uuid",
  "dailyClosingAlert": ["email"],
  "monthlyClosingAlert": null,
  "lowStockAlert": ["whatsapp"],
  "outOfStockAlert": null
}
```

---

### PATCH /businesses/{businessId}/settings
Actualiza parcialmente la configuración de alertas.

#### Request Body (ejemplo)
```json
{
  "dailyClosingAlert": ["email", "sms"]
}
```

#### Respuesta Exitosa (200)
```json
{
  "id": "uuid",
  "dailyClosingAlert": ["email", "sms"],
  "monthlyClosingAlert": null,
  "lowStockAlert": ["whatsapp"],
  "outOfStockAlert": null
}
```

---

## Reglas de Negocio

| Canal | Plan FREE | Plan BASIC | Plan PREMIUM | Plan ENTERPRISE |
|-------|-----------|------------|--------------|-----------------|
| email | ✓ | ✓ | ✓ | ✓ |
| sms | ✗ | ✗ | ✓ | ✓ |
| whatsapp | ✗ | ✗ | ✓ | ✓ |

## Ejemplos de Uso Frontend

### Verificar si usuario puede usar SMS/WhatsApp
```typescript
// Llamar primero al endpoint de plan del usuario
const { plan } = await api.get('/plans/my-plan');
const canUseProChannels = ['premium', 'enterprise'].includes(plan.type);
```

### Guardar configuración con validación frontend
```typescript
const saveSettings = async (settings: BusinessSettingsCreate) => {
  const hasProChannels = Object.values(settings).some(channels => 
    channels?.includes('sms') || channels?.includes('whatsapp')
  );
  
  if (hasProChannels && !canUseProChannels) {
    throw new Error('Upgrade a PRO para usar SMS/WhatsApp');
  }
  
  return api.post(`/businesses/${businessId}/settings`, settings);
};
```

### Actualizar alerta individual
```typescript
const updateDailyAlert = async (channels: string[]) => {
  return api.patch(`/businesses/${businessId}/settings`, {
    dailyClosingAlert: channels
  });
};
```

## Notas
- Los campos pueden ser `null` para deshabilitar alertas
- Arrays vacíos `[]` pueden causar comportamientos inesperados, usar `null` para deshabilitar
- El ID del negocio debe ser un UUID válido