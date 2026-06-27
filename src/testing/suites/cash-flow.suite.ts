import { defineSuite, expect } from "@/testing/harness";
import { consolidateBalances } from "@/lib/cash-flow";
import type { CurrencyAccount } from "@/lib/types/currency-account";

// Tasas: cuántos CUP vale 1 unidad. CUP es base (=1) implícito.
const rates = { USD: 400, EURO: 420 };

/** Construye una CurrencyAccount mínima para los tests. */
function account(
  currency: string,
  currentBalance: number | string,
): CurrencyAccount {
  return {
    id: `acc-${currency}`,
    businessId: "biz-1",
    currency,
    currentBalance,
    initialBudget: 0,
    createdAt: "",
    updatedAt: "",
  };
}

export const cashFlowSuite = defineSuite(
  "cash-flow · consolidación de caja",
  ({ test }) => {
    test(
      "sin cuentas → total 0, sin filas, sin no-convertibles",
      () => {
        const result = consolidateBalances([], rates);
        expect(result.totalBase).toBe(0);
        expect(result.rows).toEqual([]);
        expect(result.hasUnconvertible).toBe(false);
      },
      "Caso base: sin cuentas de moneda, el total consolidado es 0, no hay filas y no hay monedas sin convertir. La caja vacía no debe romper ni reportar avisos falsos.",
    );

    test(
      "CUP se cuenta a su valor (tasa 1)",
      () => {
        const result = consolidateBalances([account("CUP", 5000)], rates);
        expect(result.totalBase).toBe(5000);
        expect(result.rows[0].convertible).toBe(true);
        expect(result.rows[0].rate).toBe(1);
        expect(result.rows[0].baseEquivalent).toBe(5000);
      },
      "Una cuenta en CUP (moneda base) entra al total a su valor nominal: tasa 1, equivalente = saldo. 5000 CUP → totalBase 5000.",
    );

    test(
      "convierte moneda extranjera a CUP usando la tasa",
      () => {
        const result = consolidateBalances([account("USD", 10)], rates);
        expect(result.totalBase).toBe(4000); // 10 × 400
        expect(result.rows[0].baseEquivalent).toBe(4000);
      },
      "Una cuenta en USD se convierte multiplicando saldo × tasa: 10 USD × 400 = 4000 CUP. El equivalente en base queda registrado en la fila.",
    );

    test(
      "suma solo las monedas convertibles",
      () => {
        const result = consolidateBalances(
          [account("CUP", 1000), account("USD", 5), account("EURO", 2)],
          rates,
        );
        // 1000 + (5×400) + (2×420) = 1000 + 2000 + 840
        expect(result.totalBase).toBe(3840);
        expect(result.hasUnconvertible).toBe(false);
      },
      "Con varias monedas con tasa, el total es la suma de todos los equivalentes en CUP: 1000 (CUP) + 2000 (5 USD) + 840 (2 EURO) = 3840. Ninguna queda sin convertir.",
    );

    test(
      "moneda sin tasa con saldo → no convertible y excluida del total",
      () => {
        const result = consolidateBalances(
          [account("CUP", 1000), account("MLC", 50)],
          rates,
        );
        expect(result.totalBase).toBe(1000); // MLC excluido
        expect(result.hasUnconvertible).toBe(true);
        const mlc = result.rows.find((r) => r.currency === "MLC");
        expect(mlc?.convertible).toBe(false);
        expect(mlc?.baseEquivalent).toBeNull();
        expect(mlc?.rate).toBeNull();
      },
      "MLC tiene saldo (50) pero no hay tasa configurada para ella. Se marca como no convertible (rate/baseEquivalent null) y se EXCLUYE del total para no reportar una cifra de caja incorrecta. Se activa el flag hasUnconvertible.",
    );

    test(
      "moneda sin tasa pero saldo 0 NO marca no-convertibles",
      () => {
        const result = consolidateBalances([account("MLC", 0)], rates);
        expect(result.hasUnconvertible).toBe(false);
      },
      "Una moneda sin tasa pero con saldo 0 no genera aviso: no tiene dinero que reportar, así que no tiene sentido alertar de que 'no se pudo convertir'.",
    );

    test(
      "coerciona currentBalance string del backend",
      () => {
        const result = consolidateBalances([account("USD", "10")], rates);
        expect(result.totalBase).toBe(4000);
      },
      "Algunos endpoints monetarios devuelven el saldo como string ('10'). La función lo coerciona con Number() antes de calcular: '10' USD × 400 = 4000.",
    );
  },
  { description: "Convierte saldos por moneda a un total único en CUP." },
);
