import { describe, it } from "vitest";
import { allSuites } from "./registry";

/**
 * Único punto de entrada de Vitest: envuelve todas las suites compartidas del
 * registro en `describe`/`it`. Cada caso ya lanza vía el `expect` del harness,
 * así que Vitest lo marca como fallo igual que una aserción nativa.
 *
 * Las suites se definen en `./suites/*.suite.ts` para poder ejecutarse también
 * en el navegador (ver `/dashboard/admin/test`).
 */
for (const suite of allSuites) {
  describe(suite.name, () => {
    for (const tc of suite.tests) {
      it(tc.name, tc.fn);
    }
  });
}
