import type { Suite } from "./harness";

export type TestStatus = "passed" | "failed";

export type TestResult = {
  name: string;
  status: TestStatus;
  durationMs: number;
  error?: string;
  /** Descripción detallada de qué se probó (se muestra al expandir el test). */
  details?: string;
};

export type SuiteResult = {
  name: string;
  description?: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  durationMs: number;
};

export type RunSummary = {
  suites: SuiteResult[];
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  durationMs: number;
};

/** Reloj de alta resolución disponible tanto en navegador como en Node. */
const now = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

/**
 * Ejecuta las suites de forma síncrona y devuelve un resumen con timings y
 * mensajes de error. Cada caso se aísla en try/catch para que un fallo no
 * detenga al resto. Pensado para correr en el navegador (UI admin).
 */
export function runSuites(suites: Suite[]): RunSummary {
  const start = now();
  const results: SuiteResult[] = suites.map((suite) => {
    const tests: TestResult[] = suite.tests.map((tc) => {
      const t0 = now();
      try {
        tc.fn();
        return {
          name: tc.name,
          status: "passed",
          durationMs: now() - t0,
          details: tc.details,
        };
      } catch (error) {
        return {
          name: tc.name,
          status: "failed",
          durationMs: now() - t0,
          error: error instanceof Error ? error.message : String(error),
          details: tc.details,
        };
      }
    });

    const passed = tests.filter((t) => t.status === "passed").length;
    return {
      name: suite.name,
      description: suite.description,
      tests,
      passed,
      failed: tests.length - passed,
      durationMs: tests.reduce((acc, t) => acc + t.durationMs, 0),
    };
  });

  const totalTests = results.reduce((acc, s) => acc + s.tests.length, 0);
  const totalPassed = results.reduce((acc, s) => acc + s.passed, 0);

  return {
    suites: results,
    totalTests,
    totalPassed,
    totalFailed: totalTests - totalPassed,
    durationMs: now() - start,
  };
}
