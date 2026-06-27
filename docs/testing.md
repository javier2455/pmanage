# Guía de Testing — pmanage

> Documento de referencia sobre los tests del sistema: qué aportan, por qué son
> necesarios, cómo están organizados, cómo añadir nuevos (frontend y backend) y
> qué buenas prácticas seguir.

---

## 1. ¿Por qué tests? (el porqué antes del cómo)

Un test es código que **verifica automáticamente que otro código hace lo que
debe**. En vez de abrir la app, navegar y comprobar a mano que "la conversión de
moneda da bien", escribes una vez la comprobación y se ejecuta en segundos,
siempre igual, para siempre.

En un sistema de **gestión de negocios** como este, donde se maneja **dinero,
stock, planes y permisos**, un error silencioso cuesta caro:

- Una conversión de moneda mal hecha → cobras o reportas cifras incorrectas.
- Un stock que no redondea bien → inventario que no cuadra.
- Un gate de plan Pro mal evaluado → un usuario free entra a una función que no pagó.
- Un mensaje de error sin traducir → el usuario ve `MONEDA_NO_CONFIGURADA` y se bloquea.

Los tests aportan, en concreto:

1. **Red de seguridad ante cambios (regresión).** Cuando modificas una función,
   los tests te dicen al instante si rompiste algo que antes funcionaba. Sin
   ellos, cada cambio es una apuesta.
2. **Documentación viva.** Cada test describe con un ejemplo real qué hace la
   función y qué reglas de negocio respeta. No se desactualiza como un comentario,
   porque si miente, falla.
3. **Diseño más limpio.** Para que algo sea fácil de testear suele tener que ser
   una función pura, con entradas y salidas claras. Testear empuja a separar la
   lógica de negocio de la UI.
4. **Confianza para refactorizar.** Puedes reescribir el interior de una función
   sabiendo que, si los tests siguen verdes, el comportamiento se mantiene.
5. **Menos miedo al desplegar.** `pnpm test` en verde antes de subir reduce la
   probabilidad de llevar un bug a producción.

> Regla de oro: **cada vez que arreglas un bug, escribe primero un test que lo
> reproduzca.** Así garantizas que ese bug exacto no vuelve nunca.

---

## 2. Qué tests existen hoy

Hay **11 suites / 84 tests** cubriendo la lógica de negocio pura más crítica del
frontend. Todas viven en [`src/testing/suites/`](../src/testing/suites/).

| Suite | Qué protege | Por qué importa |
|-------|-------------|-----------------|
| `currency` | Conversión y formato multimoneda (CUP ↔ USD/EURO/MLC…) | El corazón de ventas y pagos: una tasa mal aplicada es dinero mal contado |
| `units` | Normalización de stock (entero vs decimal) y formato | Inventario correcto: "ud" no admite fracciones, kg/L sí |
| `pro-gates` | Detección de plan Pro/Free, límite de negocios, rutas gateadas | Control de acceso a features de pago |
| `cash-flow` | Consolidación de saldos por moneda a un total en CUP | El total de caja: excluye monedas sin tasa para no mentir |
| `navigation-access` | Qué URLs puede abrir cada rol | "Lo que se ve en el menú == lo que se puede abrir por URL" |
| `validations` | Schemas Zod de formularios (login, registro, planes, workers…) | Lo que se acepta/rechaza antes de mandar al backend |
| `phone` | Validación de teléfono E.164 (prefijo solo, completo, vacío) | Evita guardar teléfonos a medias |
| `normalization` | Normalización de nombres de plan y mapeo de roles | Comparaciones robustas pese a tildes/mayúsculas |
| `format-closing-currency` | Formato de importes del cierre contable | Columnas de dinero alineadas y con 2 decimales |
| `currency-errors` | Traducción de códigos de error del backend a español | El usuario entiende el problema y sabe qué hacer |
| `icon-map` | Resolución de nombre de icono → componente | El menú nunca queda sin icono aunque el backend mande uno raro |

Puedes ejecutarlas y verlas en dos sitios:

- **Terminal / CI:** `pnpm test`
- **UI admin:** menú **Test** (`/dashboard/admin/test`) — corre en el navegador,
  con cada test desplegable y su descripción detallada.

---

## 3. Cómo están organizados (y por qué así)

```
src/testing/
├── harness.ts              # micro-framework: defineSuite() + expect()
├── run-suites.ts           # ejecuta suites con timings (navegador + Node)
├── registry.ts             # registro central → allSuites
├── run-all.test.ts         # ÚNICO archivo Vitest: envuelve todas las suites
└── suites/
    ├── currency.suite.ts
    ├── units.suite.ts
    └── ... (una suite por dominio)
```

### El detalle clave: export estático

La app compila como **export estático** (`output: "export"` en
`next.config.ts`). Eso significa que **no hay servidor propio** donde ejecutar
Vitest cuando el admin pulsa "Ejecutar" en la UI. Vitest corre en Node, no en el
navegador.

La solución es definir cada suite **una sola vez** con un harness propio y
ejecutarla en **dos entornos**:

- `pnpm test` → un único wrapper (`run-all.test.ts`) la corre dentro de **Vitest
  real** (terminal/CI).
- La vista admin → el **runner del navegador** (`run-suites.ts`) la ejecuta en
  vivo, sin servidor.

Así no se duplican los tests y la UI muestra resultados **reales del momento**,
no un JSON viejo.

> El `expect` del harness ([`harness.ts`](../src/testing/harness.ts)) implementa
> un subconjunto de la API de Vitest (`toBe`, `toEqual`, `toBeNull`, `toBeNaN`,
> `toBeCloseTo`, `toContain`, `.not`). Cubre lo que usan estas suites; si
> necesitas matchers avanzados (mocks, `toThrow`, async), eso va en un test
> Vitest normal (ver §5).

---

## 4. Cómo añadir una suite nueva (frontend)

Tres pasos:

### Paso 1 — Crea el archivo de suite

`src/testing/suites/mi-cosa.suite.ts`:

```ts
import { defineSuite, expect } from "@/testing/harness";
import { miFuncion } from "@/lib/mi-cosa";

export const miCosaSuite = defineSuite(
  "mi-cosa · descripción corta del dominio",
  ({ test }) => {
    test(
      "nombre legible de lo que se prueba",
      () => {
        expect(miFuncion(2, 3)).toBe(5);
      },
      "Descripción detallada: con entrada (2, 3) se espera 5, porque la función suma. Aparece al hacer click en el test en la UI admin.",
    );
  },
  { description: "Aparece bajo el título de la tarjeta en la UI." },
);
```

La firma de cada caso es `test(nombre, fn, detalle?)`:
- **nombre** — qué se prueba, legible.
- **fn** — el test; debe lanzar (vía `expect`) si falla.
- **detalle** (opcional pero recomendado) — explicación que se muestra en la UI
  al expandir el test.

### Paso 2 — Regístrala

En [`src/testing/registry.ts`](../src/testing/registry.ts), impórtala y añádela
al array `allSuites`. Con eso aparece **automáticamente** en `pnpm test` y en la
vista admin.

### Paso 3 — Verifica

```bash
pnpm test            # debe seguir en verde
pnpm exec tsc --noEmit   # sin errores de tipos
```

### ¿Qué funciones son buenas candidatas?

✅ **Sí**: funciones **puras** — mismas entradas producen siempre la misma salida,
sin tocar red, DOM, fechas/aleatorios ni almacenamiento. Cálculos, formato,
validaciones, normalización, mapeos.

❌ **No (en esta capa)**: cosas con **efectos secundarios** o dependencias del
entorno:
- Lectura/escritura de `sessionStorage`/cookies (p. ej. `plan-session.ts`) →
  mutaría el estado real del navegador al ejecutarse en la UI admin.
- Llamadas a la API (axios) → necesitan mock de red.
- Componentes React → necesitan un DOM virtual (ver §5).
- Constantes de estilo (clases CSS, p. ej. `daily-close-table-layout.ts`) →
  testear strings de Tailwind es frágil y aporta poco.

> Truco: si una función "casi pura" mezcla un cálculo con un efecto, **extrae el
> cálculo** a su propia función pura y testea esa. Mejora el diseño y la
> testabilidad a la vez.

---

## 5. La pirámide de tests (y qué falta por cubrir)

No todos los tests son iguales. De más a menos y de más rápido a más lento:

```
        ╱╲        E2E (Playwright) — flujos completos en navegador real
       ╱  ╲       · pocos, lentos, caros. Solo caminos críticos.
      ╱────╲
     ╱      ╲     Integración / componentes (Vitest + Testing Library + MSW)
    ╱        ╲    · formularios, hooks de react-query, render con estados.
   ╱──────────╲
  ╱            ╲  Unitarios (lo que tenemos hoy)
 ╱______________╲ · funciones puras. Muchos, rapidísimos, baratos.
```

La base — **unitarios de lógica pura** — es lo que ya está montado y donde está
el mejor retorno por esfuerzo. Las capas superiores se añaden cuando hagan falta:

### Tests de componentes / integración (siguiente capa, frontend)

Para testear formularios, hooks de `@tanstack/react-query` o render con estados
de carga/error, necesitas un DOM virtual y utilidades extra. Cuando llegue el
momento:

```bash
pnpm add -D jsdom @testing-library/react @testing-library/user-event msw
```

- En `vitest.config.ts`, cambia `environment: "node"` por `"jsdom"`.
- Usa **Testing Library** para renderizar y consultar el DOM como lo haría un
  usuario.
- Usa **MSW** (Mock Service Worker) para simular las respuestas del backend sin
  pegarle al backend real.

Estos tests corren **solo con `pnpm test`**, no en la UI admin (que solo ejecuta
lógica pura síncrona).

---

## 6. Cómo testear el backend

> El backend de pmanage es un **servicio aparte** (esta app es solo el frontend y
> lo consume por axios). Esta sección es una guía general; los comandos exactos
> dependen del stack del backend (NestJS, Express, Fastify…). Cuando tengamos
> acceso a ese repo, se adapta al detalle.

### Por qué el backend es donde más importan los tests

La regla práctica: **la lógica de negocio crítica se prueba donde vive**. El
frontend orquesta y muestra; el **backend es la autoridad** sobre dinero, stock,
permisos y persistencia. Un test en el frontend comprueba que el formulario
valida; un test en el backend comprueba que **el stock nunca queda negativo** o
que **un usuario no puede ver datos de otro negocio**. Esto último es lo que de
verdad protege el negocio.

### Los tres niveles en el backend

1. **Unitarios** — funciones/servicios puros, sin base de datos. Igual que en el
   frontend: cálculo de tasas, reglas de descuento, validaciones. Rápidos.
2. **De integración** — un endpoint con su base de datos (normalmente una BD de
   test o en memoria). Verifican que la ruta, el servicio y la persistencia
   funcionan juntos.
3. **End-to-end / de contrato** — el API arrancado de verdad, golpeando endpoints
   por HTTP, comprobando códigos de estado y forma de la respuesta.

### Herramientas habituales (Node/TypeScript)

- **Runner:** Vitest o Jest (si es NestJS, viene con Jest configurado).
- **HTTP:** `supertest` para llamar endpoints sin levantar un puerto real.
- **BD:** una base de datos de test (Docker), SQLite en memoria, o
  `testcontainers` para levantar una real efímera.

### Ejemplo: unitario de un servicio (NestJS + Jest/Vitest)

```ts
describe("VentaService.calcularTotal", () => {
  it("suma líneas y aplica descuento", () => {
    const service = new VentaService();
    const total = service.calcularTotal([
      { precio: 100, cantidad: 2 }, // 200
      { precio: 50, cantidad: 1 },  // 50
    ], { descuentoPct: 10 });
    expect(total).toBe(225); // (250) - 10%
  });
});
```

### Ejemplo: integración de un endpoint (supertest)

```ts
import request from "supertest";

describe("POST /ventas", () => {
  it("rechaza vender más stock del disponible (409)", async () => {
    await seedProducto({ id: "p1", stock: 3 });

    const res = await request(app.getHttpServer())
      .post("/ventas")
      .set("Authorization", `Bearer ${tokenValido}`)
      .send({ productoId: "p1", cantidad: 5 });

    expect(res.status).toBe(409);
    expect(res.body.codigo).toBe("STOCK_INSUFICIENTE");
  });
});
```

### Qué priorizar en el backend (alto retorno)

- **Reglas de dinero:** totales, descuentos, conversiones, impuestos, redondeo.
- **Invariantes de stock:** nunca negativo, descuento atómico al vender.
- **Permisos y aislamiento:** un negocio/usuario no accede a datos de otro.
- **Códigos de error:** que devuelva el `codigo` correcto (el frontend depende de
  ellos — ver la suite `currency-errors`). Esto es un **test de contrato**: si el
  backend renombra un código, el frontend deja de traducirlo. Conviene testearlo
  en ambos lados.

### El contrato frontend ↔ backend

Muchos bugs viven en la **frontera**: el frontend espera un campo y el backend
manda otro. Dos defensas:

- En el frontend, validar la respuesta con **Zod** al recibirla (no solo al
  enviar).
- En el backend, tests que fijen la **forma exacta** de la respuesta de cada
  endpoint. Si cambia sin querer, el test falla antes de que lo note el usuario.

---

## 7. Buenas prácticas (válidas en front y back)

- **Un test, una idea.** Cada test comprueba un comportamiento. Si el nombre
  necesita un "y", probablemente son dos tests.
- **Nombres que describen el comportamiento**, no la implementación: "rechaza
  vender más stock del disponible", no "test función X".
- **Patrón AAA:** *Arrange* (prepara datos), *Act* (ejecuta), *Assert*
  (comprueba). Mantenlo visible.
- **Prueba los bordes**, no solo el camino feliz: vacío, null, 0, negativos,
  máximos, valores no parseables. Ahí viven la mayoría de los bugs.
- **Tests deterministas.** Nada de fechas reales, aleatorios o red sin
  controlar — producen fallos intermitentes ("flaky") que erosionan la confianza.
- **Rápidos.** La base de la pirámide debe correr en segundos para que se ejecute
  a menudo.
- **Cobertura con criterio.** No persigas el 100%: cubre bien la lógica crítica
  (dinero, stock, permisos) y deja fuera lo trivial. Un 100% de getters no protege
  nada.
- **El test falla primero.** Cuando arregles un bug, escribe el test, míralo
  fallar (rojo), arregla, míralo pasar (verde). Si nunca lo viste rojo, no sabes
  si prueba algo.

---

## 8. Comandos

```bash
pnpm test            # corre todas las suites una vez (CI/terminal)
pnpm test:watch      # modo watch: re-ejecuta al guardar
pnpm exec tsc --noEmit   # verifica tipos
pnpm exec eslint src/testing   # linta la infraestructura de tests
```

Y en la app: menú **Test** (solo admin) para correrlos visualmente en el
navegador.

---

## 9. Resumen en una frase

Los tests existentes blindan la **lógica pura crítica del frontend** (dinero,
stock, permisos, validaciones) con una red de seguridad rápida que corre en
terminal y en una UI admin. El siguiente paso natural es subir la pirámide
(componentes e integración) y, sobre todo, **replicar esta disciplina en el
backend**, que es la autoridad real sobre el negocio.
