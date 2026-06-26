import type { Suite } from "./harness";
import { cashFlowSuite } from "./suites/cash-flow.suite";
import { currencySuite } from "./suites/currency.suite";
import { navigationAccessSuite } from "./suites/navigation-access.suite";
import { normalizationSuite } from "./suites/normalization.suite";
import { phoneSuite } from "./suites/phone.suite";
import { proGatesSuite } from "./suites/pro-gates.suite";
import { unitsSuite } from "./suites/units.suite";
import { validationsSuite } from "./suites/validations.suite";

/**
 * Registro central de suites de lógica pura.
 *
 * Fuente única consumida por:
 *   - `run-all.test.ts` → Vitest (terminal/CI)
 *   - `/dashboard/admin/test` → runner del navegador (UI admin)
 *
 * Para añadir una suite nueva: créala con `defineSuite` en `./suites/` y
 * agrégala aquí. Aparecerá automáticamente en ambos lados.
 */
export const allSuites: Suite[] = [
  currencySuite,
  unitsSuite,
  proGatesSuite,
  cashFlowSuite,
  navigationAccessSuite,
  validationsSuite,
  phoneSuite,
  normalizationSuite,
];
