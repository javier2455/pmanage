import { defineSuite, expect } from "@/testing/harness";
import { consolidateBalances, mergeAccountsByCurrency } from "@/lib/cash-flow";
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

    test(
      "transferencia truncada/minúsculas se normaliza y sí convierte",
      () => {
        const ratesConTransf = { ...rates, CUP_TRANSFERENCIA: 700 };
        const result = consolidateBalances(
          [account("cup_transf", 100)],
          ratesConTransf,
        );
        // 100 × 700 = 70000 CUP. No debe quedar como "sin tasa".
        expect(result.totalBase).toBe(70000);
        expect(result.hasUnconvertible).toBe(false);
        const row = result.rows[0];
        expect(row.currency).toBe("CUP_TRANSFERENCIA");
        expect(row.convertible).toBe(true);
        expect(row.rate).toBe(700);
        expect(row.baseEquivalent).toBe(70000);
      },
      "La cuenta de transferencia puede llegar con la moneda truncada/en minúsculas ('cup_transf') mientras la tasa se indexa por la clave canónica 'CUP_TRANSFERENCIA'. La consolidación normaliza el código antes de buscar la tasa, así que la moneda SÍ convierte (100 × 700 = 70000) y no se marca como 'sin tasa'. Regresión del bug del consolidado.",
    );

    test(
      "funde cuentas duplicadas de la misma moneda en una sola fila",
      () => {
        const ratesConTransf = { ...rates, CUP_TRANSFERENCIA: 700 };
        const result = consolidateBalances(
          [account("cup_transf", 100), account("CUP_TRANSFERENCIA", 50)],
          ratesConTransf,
        );
        // Una sola fila canónica con el saldo sumado: (100 + 50) × 700.
        expect(result.rows.length).toBe(1);
        expect(result.rows[0].currency).toBe("CUP_TRANSFERENCIA");
        expect(result.rows[0].balance).toBe(150);
        expect(result.totalBase).toBe(105000);
      },
      "El backend puede tener dos cuentas para la misma moneda con el código en variantes distintas ('cup_transf' truncada y 'CUP_TRANSFERENCIA' completa). La consolidación las funde en una sola fila canónica con el saldo sumado (150 × 700 = 105000), evitando la fila duplicada y la colisión de key de React.",
    );

    test(
      "mergeAccountsByCurrency suma saldo y presupuesto de duplicados",
      () => {
        const merged = mergeAccountsByCurrency([
          account("cup_transf", 100),
          account("cup_transferencia", 50),
          account("USD", 10),
        ]);
        expect(merged.length).toBe(2);
        const transfer = merged.find((a) => a.currency === "CUP_TRANSFERENCIA");
        expect(Number(transfer?.currentBalance)).toBe(150);
        const usd = merged.find((a) => a.currency === "USD");
        expect(Number(usd?.currentBalance)).toBe(10);
      },
      "mergeAccountsByCurrency agrupa por moneda canónica: 'cup_transf' y 'cup_transferencia' se funden en una CUP_TRANSFERENCIA con los saldos sumados (150); las demás monedas (USD) quedan intactas.",
    );
  },
  { description: "Convierte saldos por moneda a un total único en CUP." },
);
