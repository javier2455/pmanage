/**
 * Micro-harness de testing agnóstico al entorno.
 *
 * Motivo: la app compila como export estático (`output: "export"`), así que no
 * hay servidor donde ejecutar Vitest al hacer clic en la UI admin. La lógica
 * pura (moneda, stock, gates) sí puede correr en el navegador, así que
 * definimos cada suite UNA sola vez con este harness y la ejecutamos en dos
 * sitios:
 *   - `pnpm test` → un wrapper la corre dentro de Vitest real (terminal/CI).
 *   - `/dashboard/admin/test` → el runner del navegador la ejecuta en vivo.
 *
 * No reemplaza a Vitest: para tests que necesiten mocks, async o el navegador
 * (componentes), usa archivos `*.test.ts` normales — corren con `pnpm test`
 * pero NO aparecen en la UI admin (que solo ejecuta lógica pura síncrona).
 */

export type TestCase = {
  name: string;
  fn: () => void;
  /** Descripción detallada de qué se prueba (se muestra al hacer click en la UI). */
  details?: string;
};

export type Suite = {
  name: string;
  /** Descripción corta opcional que se muestra en la UI admin. */
  description?: string;
  tests: TestCase[];
};

type SuiteBuilder = (api: {
  test: (name: string, fn: () => void, details?: string) => void;
}) => void;

/**
 * Define una suite de tests reutilizable. El callback recibe `test(name, fn)`
 * para registrar casos; cada `fn` debe lanzar (vía `expect`) si falla.
 */
export function defineSuite(
  name: string,
  build: SuiteBuilder,
  options: { description?: string } = {},
): Suite {
  const tests: TestCase[] = [];
  build({
    test: (caseName, fn, details) =>
      tests.push({ name: caseName, fn, details }),
  });
  return { name, description: options.description, tests };
}

/* ------------------------------------------------------------------ */
/* Aserciones — subconjunto compatible con la API de Vitest que usamos.  */
/* ------------------------------------------------------------------ */

function format(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "bigint") return `${value}n`;
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null)
    return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) =>
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
}

class Assertion {
  constructor(
    private readonly received: unknown,
    private readonly negated = false,
  ) {}

  /** Versión negada: `expect(x).not.toBe(y)`. */
  get not(): Assertion {
    return new Assertion(this.received, !this.negated);
  }

  private check(pass: boolean, message: string) {
    if (pass === this.negated) {
      throw new Error(this.negated ? `not: ${message}` : message);
    }
  }

  toBe(expected: unknown) {
    this.check(
      Object.is(this.received, expected),
      `expected ${format(this.received)} to be ${format(expected)}`,
    );
  }

  toEqual(expected: unknown) {
    this.check(
      deepEqual(this.received, expected),
      `expected ${format(this.received)} to equal ${format(expected)}`,
    );
  }

  toBeNull() {
    this.check(
      this.received === null,
      `expected ${format(this.received)} to be null`,
    );
  }

  toBeNaN() {
    this.check(
      typeof this.received === "number" && Number.isNaN(this.received),
      `expected ${format(this.received)} to be NaN`,
    );
  }

  toBeCloseTo(expected: number, numDigits = 2) {
    const received = this.received as number;
    const tolerance = Math.pow(10, -numDigits) / 2;
    this.check(
      Math.abs(received - expected) < tolerance,
      `expected ${format(received)} to be close to ${format(expected)} (±${tolerance})`,
    );
  }

  toContain(item: unknown) {
    const received = this.received;
    let pass = false;
    if (Array.isArray(received)) pass = received.includes(item);
    else if (typeof received === "string") pass = received.includes(String(item));
    this.check(pass, `expected ${format(received)} to contain ${format(item)}`);
  }
}

export function expect(received: unknown): Assertion {
  return new Assertion(received);
}
