import type { Suite } from "./harness";
import { accountingCloseCurrencySuite } from "./suites/accounting-close-currency.suite";
import { adminAccessSuite } from "./suites/admin-access.suite";
import { cashFlowSuite } from "./suites/cash-flow.suite";
import { currencyErrorsSuite } from "./suites/currency-errors.suite";
import { currencySuite } from "./suites/currency.suite";
import { dateRangeSuite } from "./suites/date-range.suite";
import { formatClosingCurrencySuite } from "./suites/format-closing-currency.suite";
import { iconMapSuite } from "./suites/icon-map.suite";
import { navigationAccessSuite } from "./suites/navigation-access.suite";
import { normalizationSuite } from "./suites/normalization.suite";
import { phoneSuite } from "./suites/phone.suite";
import { planCatalogSuite } from "./suites/plan-catalog.suite";
import { proGatesSuite } from "./suites/pro-gates.suite";
import { unitsSuite } from "./suites/units.suite";
import { validationsSuite } from "./suites/validations.suite";

/**
 * Registro central de suites de lógica pura.
 *
 * Fuente única consumida por `run-all.test.ts` → Vitest (terminal/CI).
 *
 * Para añadir una suite nueva: créala con `defineSuite` en `./suites/` y
 * agrégala aquí. Correrá automáticamente con `pnpm test`.
 */
export const allSuites: Suite[] = [
  currencySuite,
  unitsSuite,
  proGatesSuite,
  cashFlowSuite,
  dateRangeSuite,
  accountingCloseCurrencySuite,
  navigationAccessSuite,
  adminAccessSuite,
  validationsSuite,
  phoneSuite,
  normalizationSuite,
  formatClosingCurrencySuite,
  currencyErrorsSuite,
  iconMapSuite,
  planCatalogSuite,
];
