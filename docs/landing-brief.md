# Brief para Landing Page — Negora (Sistema de Gestión de Negocios)

> **Para el agente de diseño:** este documento describe el producto, su público, todas sus funcionalidades, los planes, el soporte y la identidad visual (colores, tipografía, tono). Úsalo como única fuente de verdad para diseñar la landing page. El producto YA está construido (es una app web real); la landing debe vender y explicar lo que ya hace.

---

## 1. Resumen del producto (el "qué")

**Sistema de Gestión de Negocios** es una aplicación web (SaaS) para administrar negocios pequeños y medianos de forma simple y directa: ventas, inventario, gastos, productos, equipo y cierres contables, todo en un solo lugar.

- **Nombre de marca:** **Negora** — es la marca visible en toda la app (pestaña del navegador, sidebar/logo, login, registro) y en la landing. "Sistema de Gestión de Negocios" se usa como descriptor/tagline. (`pmanage` es solo el nombre técnico del repositorio.)
- **Categoría:** Software de gestión / punto de venta + contabilidad simple para MIPYMEs.
- **Descriptor oficial actual:** *"Sistema de Gestión para todo tipo de negocios."*

### Propuesta de valor (one-liner sugerido)
> "Controla tus ventas, inventario y finanzas en un solo lugar — pensado para negocios reales, con manejo nativo de múltiples monedas."

### Diferenciadores clave (resaltar en la landing)
1. **Multimoneda nativo (el gran diferenciador):** maneja ventas, pagos, compras y gastos en varias monedas (USD, EUR, CUP, MLC, y más) con tasas de cambio configurables por negocio. **Ningún competidor directo ofrece esto para el mercado al que apunta.**
2. **Simple y directo:** flujo de operación sin la sobrecarga de la contabilidad formal compleja. Pensado para usar a diario sin entrenamiento.
3. **Multi-negocio:** administra varios negocios desde una sola cuenta (según plan).
4. **Equipo con permisos granulares:** invita empleados y controla exactamente qué puede ver/hacer cada uno.
5. **Orientado a MIPYMEs, agromarkets, mercados y trabajadores por cuenta propia (TCP)** — no a grandes empresas con contabilidad formal.

---

## 2. Público objetivo (el "para quién")

- **Mercado principal:** Cuba (contexto de precios cambiantes y múltiples monedas en circulación → de ahí la fuerza del multimoneda).
- **Perfil de usuario:**
  - Dueños de pequeños negocios (MIPYMEs), TCP (trabajadores por cuenta propia).
  - Agromarkets, mercados, tiendas, puntos de venta minoristas.
  - Negocios que facturan típicamente entre **$200 y $2,000 USD/mes**.
- **Dolor que resuelve:** dejar de llevar las cuentas a mano / en papel / en hojas de cálculo dispersas; saber realmente cuánto se vende, cuánto se gasta y cuánto se gana, con el lío añadido de varias monedas.
- **Tono y lenguaje:** **100% en español**, cercano, claro, sin jerga contable. Hablarle a un dueño de negocio ocupado, no a un contador.

---

## 3. Funcionalidades completas (todo lo que ofrece al usuario)

Agrupadas por área. Todo esto está implementado en el producto.

### 3.1 Ventas
- Crear ventas con múltiples productos (carrito).
- **Moneda por venta** (CUP, USD, EUR, MLC, etc.).
- **Pagos multimoneda:** registrar pagos parciales o completos en distintas monedas; el sistema convierte con la tasa del negocio y marca la venta como *pendiente / parcialmente pagada / pagada*.
- **Tipos de venta:** en tienda (`in_store`), entrega a domicilio (`delivery`) y recogida (`pickup`), con datos de entrega (dirección, contacto, teléfono).
- **Factura PDF:** descargar y regenerar la factura de ventas pagadas.
- **Cancelar venta** con motivo/razón y registro de la cancelación.
- Detalle de venta con estado de pago, items y método.

### 3.2 Inventario
- Stock actual por producto y por negocio.
- **Entradas de compra** (registro de reabastecimiento) con **costo en divisa** (multimoneda) y previsualización del costo convertido.
- Stock inicial al asignar producto.
- **Cantidades decimales** para productos por peso/volumen (kg, lb, g, L, mL) — además de unidades enteras (ud).
- **Historial de inventario** con línea de tiempo completa y filtrado por producto.
- **Alertas de stock bajo / agotado:** umbral configurable por producto, badges visuales ("Stock bajo" / "Sin stock") y banner-resumen en la página de inventario.

### 3.3 Productos
- **Catálogo global** de productos (CRUD completo) + **asignación de productos a cada negocio**.
- Precio de venta y precio de entrada (costo).
- **Categorías de producto** por negocio (un mismo producto puede tener categoría distinta en cada negocio).
- Editar precio y categoría de un producto dentro del negocio.
- Buscador de productos con scroll infinito y búsqueda en servidor.

### 3.4 Historial de precios
- Registro de la evolución del precio de venta y de entrada de cada producto.
- Página dedicada + **comparador multi-producto**.
- Especialmente útil en contextos de precios cambiantes.

### 3.5 Proveedores
- CRUD de proveedores (nombre, teléfono, descripción).
- Asociar entradas de inventario a un proveedor.
- Tabla de productos por proveedor + auto-completar precio de entrada desde el proveedor.
- Historial de compras a cada proveedor.

### 3.6 Gastos
- Registro de gastos (CRUD) **filtrados por negocio activo**.
- **Categorías de gasto** (Suministros, Servicios, Personal, Transporte, Otros…).
- **Gastos en múltiples monedas**.
- **Reporte consolidado** "Todos los negocios" (función Pro).

### 3.7 Cierres contables
- **Cierre diario:** resumen de ventas, gastos, balance y stock del día.
- **Cierre mensual** (función Pro).
- **Exportación a PDF y Excel** del cierre (función Pro).

### 3.8 Analítica y Dashboard
- Dashboard con KPIs de ventas y gastos recientes.
- **Analytics:** ingresos, beneficio, ticket promedio, cancelaciones, valor de inventario; tendencias; top de productos.
- (En roadmap Pro: rentabilidad por producto, comparativas de períodos, ventas por trabajador.)

### 3.9 Multi-negocio
- Administrar varios negocios desde una cuenta (1 en Básico, varios en Pro).
- Switcher de negocio; detalles de cada negocio.
- **Geolocalización** del negocio con mapa (MapLibre).
- **Horario de atención** configurable por día de la semana (abrir/cerrar, días cerrados).

### 3.10 Equipo / Trabajadores (Pro)
- Invitar empleados por email.
- **Permisos granulares por módulo/sección** (controlar qué ve y qué puede hacer cada trabajador).
- Gestión de roles y visibilidad dinámica del menú según permisos.

### 3.11 Tasas de cambio / Multimoneda
- Configurar tasas de cambio por negocio (USD, EUR, CUP, MLC, MXN, CAD, GBP, CHF, JPY…).
- Las monedas disponibles se derivan de las tasas activas del negocio (no es una lista fija).
- Toda la app (ventas, pagos, compras, gastos) respeta la moneda y la tasa configurada.

### 3.12 Notificaciones
- **Campana de notificaciones in-app** en la barra superior con contador de no leídas.
- Página de notificaciones dedicada con pestañas (incluye pestaña de **Soporte**).
- **Ajustes de alertas multi-canal por negocio:** stock bajo, agotado, cierre diario, cierre mensual — por email (todos los planes) y SMS/WhatsApp (Pro).

### 3.13 Soporte (dentro de la app)
- **Tickets de soporte** con conversación tipo chat.
- Crear ticket, responder, cerrar y reabrir.
- Notificaciones de soporte integradas en la campana.
- (Lado admin: bandeja de tickets, asignación de agentes, gestión por estado.)

### 3.14 Cuenta y perfil
- Perfil de usuario y edición de datos.
- Cambio de plan y **historial de planes**.
- Búsqueda global dentro de la app.

### 3.15 Autenticación
- Registro, login, verificación de email, recuperación/reset de contraseña.
- Aceptar invitación (para trabajadores).
- Logout seguro (invalida el token en el servidor).
- (En desarrollo: inicio de sesión con Google.)

---

## 4. Planes y precios

> Hay dos planes de suscripción, con facturación **mensual o anual** (selector). Los precios vigentes en el producto son **Básico $5/mes** y **Pro $15/mes**.

| Característica | **Básico — $5/mes** | **Pro — $15/mes** |
|---|---|---|
| Negocios | 1 | 3 (o más) |
| Productos | 100 | 500 (o ilimitados) |
| Registro de ventas | ✓ | ✓ |
| Registro de compras / inventario | ✓ | ✓ |
| Gastos | ✓ | ✓ |
| Cierre contable diario | ✓ | ✓ |
| Tasas de cambio multimoneda | ✓ | ✓ |
| Alertas de stock bajo | ✓ | ✓ |
| Notificaciones por email | ✓ | ✓ |
| **Cierre contable mensual** | ✗ | ✓ |
| **Exportar a Excel / PDF** | ✗ | ✓ |
| **Equipo / trabajadores con permisos** | ✗ | ✓ |
| **Reporte consolidado de todos los negocios** | ✗ | ✓ |
| **Notificaciones SMS / WhatsApp** | ✗ | ✓ |
| **Soporte** | WhatsApp / Email | 24/7 Prioritario |

**Notas de diseño para la sección de precios:**
- Mostrar el **toggle mensual/anual** (la app lo tiene).
- Destacar visualmente el plan **Pro** como recomendado.
- Usar el verde de marca para el plan recomendado y los checks (✓).
- Comunicar el precio como accesible: "desde $5 al mes".

---

## 5. Soporte al cliente
- **Soporte dentro de la app** mediante tickets con chat (todos los planes).
- **Canales:** WhatsApp y Email (Básico) · **24/7 prioritario** (Pro).
- Notificaciones de soporte integradas en la app.

---

## 6. Identidad visual (colores, tipografía, tema)

> La landing debe sentirse parte del mismo producto. Respetar estos tokens.

### 6.1 Color
- **Color primario (alma de la marca): verde esmeralda** → `hsl(160 84% 39%)` (≈ emerald-600, hex aprox. `#10b981` / `#0fa968`). Se usa para CTAs clave, links, acentos, badges "Pro", iconos protagonistas.
- **Neutros:** grises azulados.
  - Fondo claro general: `hsl(210 20% 98%)` (gris muy claro, casi blanco).
  - Texto principal: `hsl(215 25% 10%)` (casi negro azulado).
  - Tarjetas: blanco puro `#ffffff`.
  - Texto secundario / apoyo: `hsl(215 12% 50%)`.
  - Bordes: `hsl(214 20% 88%)`.
- **Color destructivo / error:** rojo `hsl(0 72% 51%)`.
- **Paleta para gráficos / acentos secundarios:**
  - Verde `hsl(160 84% 39%)` · Azul cielo `hsl(199 89% 48%)` · Amarillo `hsl(43 96% 56%)` · Rojo `hsl(0 72% 51%)` · Violeta `hsl(262 83% 58%)`.

### 6.2 Modo oscuro (la app lo soporta — ofrecer landing con dark mode)
- Fondo: `hsl(215 28% 7%)` (azul muy oscuro).
- Texto: `hsl(210 20% 95%)`.
- Tarjetas: `hsl(215 25% 10%)`.
- El **verde primario se mantiene igual** en oscuro (es el ancla de marca).

### 6.3 Tipografía
- **Fuente única: Poppins** (Google Fonts).
- Pesos: 400 (regular), 500 (medium), 600 (semibold), 700 (bold).
- Jerarquía sugerida para la landing:
  - Hero / H1: Poppins **700**, grande, `tracking-tight`.
  - Títulos de sección (H2): Poppins **600/700**.
  - Subtítulos / lead: color texto secundario (`muted-foreground`).
  - Cuerpo: Poppins **400**.
- Cuerpo con `antialiased`.

### 6.4 Formas, radios y sombras
- **Radio base:** `0.5rem`. Tarjetas redondeadas `rounded-xl` (12px); botones `rounded-md` (6px); badges/pills `rounded-full`.
- **Sombras suaves:** `shadow-sm` en tarjetas, `shadow-xs` en inputs/botones outline. Estética limpia, nada de sombras dramáticas.
- Iconografía: **lucide-react** (línea fina, moderna). Iconos representativos del producto: `Store`, `LayoutDashboard`, `Package`, `ShoppingCart`, `Users`, `Wallet`/`Coins` (multimoneda), `BarChart`, `Bell`, `FileText` (facturas).

### 6.5 Estilo general / mood
- **Limpio, moderno, profesional pero cálido.** SaaS confiable, no corporativo frío.
- Mucho espacio en blanco, tarjetas con borde sutil, acentos verdes puntuales (no saturar de verde).
- Sensación de "ligero y rápido", coherente con la promesa de simplicidad.

---

## 7. Estructura sugerida de la landing (secciones)

1. **Hero:** titular con la propuesta de valor + subtítulo + CTA principal ("Empieza gratis" / "Crear cuenta") + CTA secundario ("Ver planes"). Mockup/captura del dashboard. Resaltar el multimoneda.
2. **Logos de confianza / tipo de negocios** (MIPYMEs, mercados, agromarkets, tiendas) — opcional.
3. **Problema → Solución:** el caos de llevar cuentas a mano vs. tenerlo todo en un lugar.
4. **Funcionalidades destacadas** (grid de tarjetas con icono): Ventas multimoneda, Inventario con alertas, Cierres contables, Analítica, Multi-negocio, Equipo con permisos, Proveedores, Facturas PDF.
5. **El diferenciador multimoneda** (sección propia, es el gancho): explicar ventas y pagos en varias monedas con tasas configurables.
6. **Capturas / demo del producto** (dashboard, ventas, inventario, analítica).
7. **Planes y precios** (tabla de la sección 4, con toggle mensual/anual).
8. **Soporte** (tickets en la app + canales).
9. **FAQ** (¿necesito conocimientos de contabilidad? ¿funciona en móvil? ¿puedo manejar varios negocios? ¿qué monedas soporta? ¿cómo cambio de plan?).
10. **CTA final** + footer.

**Mensajes/claims que sí podemos hacer (verificados con el producto):**
- "Maneja varias monedas sin enredos."
- "Sabe exactamente cuánto vendiste, gastaste y ganaste — cada día."
- "Invita a tu equipo y controla qué puede hacer cada uno."
- "Tu inventario te avisa antes de quedarte sin stock."
- "Cierra el día y el mes, exporta a PDF y Excel."
- "Administra todos tus negocios desde una sola cuenta."

**Evitar prometer** (aún no existe / en roadmap): facturación electrónica/fiscal (CFDI, timbrado), conciliación bancaria, nóminas, integración e-commerce, app móvil nativa (es web; PWA está en roadmap), inicio de sesión con Google (en desarrollo).

---

## 8. Stack técnico (referencia, por si la landing se construye igual al producto)
- **Next.js 16** (App Router) + **React 19** + **TypeScript**.
- **Tailwind CSS v4** (sintaxis CSS-first con `@theme`, sin `tailwind.config.js`).
- **shadcn/ui** estilo **new-york** + Radix UI.
- **lucide-react** (iconos), **next-themes** (claro/oscuro), **recharts** (gráficos).
- Fuente **Poppins** vía Google Fonts.
- Gestor de paquetes: **pnpm**.

> Si la landing se hace en el mismo repo/stack, el archivo `docs/DESIGN_SYSTEM_GUIDE.md` contiene el `globals.css` completo con todos los tokens listos para copiar.

---

*Fin del brief. Fuente: documentación interna del proyecto (`docs/estado-proyecto.md`, `docs/análisis-planes/`, `docs/DESIGN_SYSTEM_GUIDE.md`, `docs/new-functionality.md`) y código de `src/`.*
