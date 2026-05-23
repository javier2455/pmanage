# Análisis Estratégico de Planes — PManage

> Fecha: 2026-05-19

---

## 1. Estado actual del diferencial Básico → Pro

El Plan Pro hoy ofrece muy poco sobre el Básico en términos de valor diario para el usuario:

| Característica | Básico ($3/mes) | Pro ($10/mes) |
|----------------|-----------------|---------------|
| Negocios | 1 | 3 |
| Productos | 100 | 500 |
| Registro de ventas | ✓ | ✓ |
| Registro de compras | ✓ | ✓ |
| Cierre contable diario | ✓ | ✓ |
| Tasas de cambio manuales | ✓ | ✓ |
| Cierre contable mensual | ✗ | ✓ |
| Exportar Excel/PDF | ✗ | ✓ |
| Soporte | WhatsApp/Email | 24/7 Prioritario |

**Problema:** El cierre mensual y las exportaciones son funcionalidades de uso esporádico (1 vez al mes como máximo). No hay nada que haga que el usuario Pro sienta una diferencia en su operativa diaria. Un usuario de un solo negocio con menos de 100 productos no tiene ningún incentivo real para subir de plan.

---

## 2. Nuevas funcionalidades candidatas para el Plan Pro

Agrupadas por categoría. La mayoría aprovechan datos que **el backend ya almacena**, lo que reduce el esfuerzo de implementación.

### A. Inteligencia de negocio (datos existentes, nuevas vistas)

- **Comparativa de períodos:** semana actual vs semana pasada, mes actual vs mes pasado — ventas, gastos, ganancia neta, número de transacciones. El usuario ve de un vistazo si su negocio va mejor o peor que el período anterior.
- **Rentabilidad por producto:** qué productos generan más margen real (precio venta − precio entrada × unidades vendidas). Identifica los productos estrella y los que se venden mucho pero con poco margen.
- **Ventas por trabajador:** si el negocio tiene empleados, ver cuánto vendió cada uno, su ticket promedio y su tasa de cancelaciones. Útil para gestión de equipo y comisiones.
- **Días de mayor venta:** basado en el historial de ventas (`createdAt` ya existe), mostrar qué días de la semana y del mes tienen más actividad.

### B. Alertas de stock bajo

- Definir un umbral mínimo de stock por producto.
- Cuando el stock cae por debajo del umbral, mostrar una alerta visual en el inventario y en el dashboard.
- Evita quedarse sin producto y perder ventas.

### C. Gestión de proveedores (entidad nueva, simple)

- Registrar proveedores con nombre, teléfono, descripción.
- Asociar cada entrada de inventario a un proveedor concreto (actualmente se escribe como texto libre).
- Ver historial de compras a cada proveedor.
- Saber a quién llamar cuando necesitas reabastecer.

### D. Categorías de gastos

- Clasificar gastos: Suministros, Servicios, Personal, Transporte, Otros.
- Ver en el cierre cuánto se gastó en cada categoría.
- Gráfico de desglose de gastos en el dashboard Pro.
- Ayuda a entender dónde se va el dinero y dónde recortar.

### E. Presupuesto mensual de gastos

- Definir cuánto se planea gastar en el mes.
- Ver en tiempo real qué porcentaje del presupuesto ya se consumió.
- Alerta cuando se supera el presupuesto.
- Feature de alto valor para negocios que quieren controlar sus costos.

### F. Historial de precios de productos

- Registrar automáticamente cada vez que cambia el precio de venta o el precio de entrada de un producto.
- Ver la evolución histórica de precios.
- Muy útil en el contexto cubano donde los precios cambian frecuentemente.

---

## 3. Comparativa con sistemas similares

| Sistema | Precio base | Qué ofrece diferente o mejor |
|---------|-------------|------------------------------|
| **Alegra** | $15–40/mes | Facturación electrónica, cuentas por cobrar/pagar, conciliación bancaria, impuestos |
| **Contabilium** | $10–30/mes | Presupuestos, cotizaciones, cuenta corriente de clientes, facturación |
| **Wave** | Gratis | Escaneo de recibos, conexión bancaria (solo para mercados con banca digital) |
| **QuickBooks** | $30–80/mes | Nóminas, declaraciones fiscales, flujo de caja proyectado, reportes contables completos |
| **Shopify POS** | $15–30/mes | Variantes de producto, descuentos, fidelización de clientes, integración e-commerce |
| **Facturama** | $10–25/mes | Cumplimiento fiscal, XML timbrado, facturación electrónica CFDI |

**Lo que PManage hace diferente y bien:**
- Manejo nativo de tasas de cambio multi-moneda (USD, MLC, CUP Transferencia, Clásica, EUR) — ningún competidor tiene esto para el mercado cubano
- Flujo de operación simple y directo, sin sobrecarga de funcionalidades contables complejas
- Orientado específicamente a agromarkets, mercados y MIPYMEs, no a empresas con contabilidad formal

**Gap principal frente a competidores:**
El mayor diferencial que los competidores tienen sobre PManage hoy es la capacidad de dar **información para tomar decisiones**, no solo registrar operaciones. Reportes comparativos, rentabilidad por producto, y presupuestos son lo que convierte un sistema de registro en una herramienta de gestión.

---

## 4. Precios para el contexto cubano

### Referencia de mercado
- Salario medio en Cuba: ~4,000–5,000 CUP/mes ≈ $15–20 USD al cambio informal
- Un pequeño negocio en Cuba factura típicamente entre $200 y $2,000 USD/mes
- Pagar el 0.5–2% de los ingresos mensuales en software de gestión es razonable para un negocio formal

### Precios sugeridos
- **Plan Básico: $5 USD/mes** — accesible para cualquier TCP o MIPYME, cubre lo esencial
- **Plan Pro: $12–15 USD/mes** — viable para negocios con facturación mensual mayor a $500 USD

El precio actual de $3/mes del Básico está subvalorado: genera desconfianza y deja dinero sobre la mesa sin que el acceso sea realmente más democratizado (alguien que no puede pagar $5 tampoco puede pagar $3 de manera sostenida).

---

## 5. Variante A — "Más datos, misma operativa"

**Filosofía:** aprovechar los datos que el sistema ya recopila para generar reportes e indicadores que el usuario Pro no tiene hoy. Mínimo cambio en el modelo de datos del backend.

**Precio sugerido: Básico $5/mes | Pro $12/mes**

| Característica | Básico | Pro |
|----------------|--------|-----|
| Negocios | 1 | 3 |
| Productos | 100 | 500 |
| Registro ventas/compras | ✓ | ✓ |
| Cierre diario | ✓ | ✓ |
| Tasas de cambio | ✓ | ✓ |
| Cierre mensual | ✗ | ✓ |
| Exportar Excel/PDF | ✗ | ✓ |
| **Alertas de stock bajo** | ✗ | ✓ |
| **Rentabilidad por producto** | ✗ | ✓ |
| **Comparativa de períodos** | ✗ | ✓ |
| **Ventas por trabajador** | ✗ | ✓ |
| Soporte | WhatsApp/Email | 24/7 Prioritario |

**Esfuerzo estimado de implementación: Bajo-Medio**
- Backend: 4 endpoints nuevos de agregación sobre datos existentes + 1 campo nuevo en `BusinessProduct`
- Frontend: 6–8 componentes nuevos, activar la página de analítica existente
- Sin nuevas entidades en base de datos (excepto el campo `stockAlertThreshold`)
- Tiempo estimado: 2–3 semanas

---

## 6. Variante B — "Gestión completa del negocio"

**Filosofía:** convertir el Pro en una herramienta de gestión completa añadiendo entidades nuevas que amplían lo que el sistema puede hacer (no solo ver mejor lo que ya hay, sino gestionar más cosas).

**Precio sugerido: Básico $5/mes | Pro $15/mes**

| Característica | Básico | Pro |
|----------------|--------|-----|
| Negocios | 1 | 5 |
| Productos | 150 | Ilimitados |
| Registro ventas/compras | ✓ | ✓ |
| Cierre diario | ✓ | ✓ |
| Tasas de cambio | ✓ | ✓ |
| Cierre mensual | ✗ | ✓ |
| Exportar Excel/PDF | ✗ | ✓ |
| **Alertas de stock bajo** | ✗ | ✓ |
| **Rentabilidad por producto** | ✗ | ✓ |
| **Comparativa de períodos** | ✗ | ✓ |
| **Gestión de proveedores** | ✗ | ✓ |
| **Categorías de gastos** | ✗ | ✓ |
| **Presupuesto mensual** | ✗ | ✓ |
| **Historial de precios** | ✗ | ✓ |
| Soporte | WhatsApp/Email | 24/7 Prioritario |

**Esfuerzo estimado de implementación: Alto**
- Backend: 3 nuevas entidades (Supplier, ExpenseCategory, MonthlyBudget, ProductPriceHistory), 12–16 nuevos endpoints
- Frontend: 3 nuevas secciones completas + modificaciones a secciones existentes
- Tiempo estimado: 6–8 semanas

---

## 7. Recomendación

**Implementar Variante A como primera fase.**

Razones:
1. Lanzable en 2–3 semanas frente a 6–8 de la B
2. Genera valor inmediato y tangible para el usuario Pro en su operativa diaria
3. La infraestructura de frontend (charts, cards, tabs) ya existe en el proyecto
4. No requiere cambios estructurales en la base de datos del backend
5. Permite validar con usuarios reales qué reportes son más útiles antes de invertir en la B
6. La Variante B es perfectamente implementable como "fase 2" sobre la base de A

La Variante B no desaparece — se convierte en el roadmap natural después de lanzar A.

---

## Próximos pasos

1. Compartir `spec-tecnicas.md` con el equipo de backend para validar los endpoints propuestos
2. Llegar a un acuerdo sobre la variante a implementar
3. Crear el documento de especificaciones finales acordadas
4. Comenzar implementación en orden de prioridad establecido
