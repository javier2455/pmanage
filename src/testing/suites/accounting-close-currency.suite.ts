import { defineSuite, expect } from "@/testing/harness";
import {
  consolidateClosing,
  groupClosingByCurrency,
  normalizeCurrency,
} from "@/lib/accounting-close-currency";
import type { SaleWithProductAndBusiness } from "@/lib/types/sales";
import type { ExpenseInAccountingClose } from "@/lib/types/accounting-close";

// Tasas: cuántos CUP vale 1 unidad (CUP base = 1 implícito). CUP_TRANSFERENCIA se
// trata como una moneda más: tasa 0.8 = 1 transferencia vale 0.8 CUP (recargo 25%).
const rates = { USD: 400, EURO: 420, CUP_TRANSFERENCIA: 0.8 };

/** Venta mínima para los tests: solo importan `total` y `currency`. */
function sale(
  total: number | string,
  currency?: string,
): SaleWithProductAndBusiness {
  return {
    id: `sale-${currency ?? "none"}-${total}`,
    idbusiness: "biz-1",
    total: String(total),
    descripcion: "",
    isCancelled: false,
    cancelledReason: null,
    createdAt: new Date(0),
    createdBy: "u1",
    userName: "u1",
    items: [],
    currency,
  };
}

/** Gasto mínimo del cierre: solo importan `amount` y `currency`. */
function expense(
  amount: number,
  currency?: string,
): ExpenseInAccountingClose {
  return {
    id: `exp-${currency ?? "none"}-${amount}`,
    title: "gasto",
    amount,
    description: "",
    createdAt: "1970-01-01",
    currency,
  };
}

export const accountingCloseCurrencySuite = defineSuite(
  "accounting-close · desglose por moneda",
  ({ test }) => {
    test(
      "moneda ausente cae a CUP (base)",
      () => {
        expect(normalizeCurrency(undefined)).toBe("CUP");
        expect(normalizeCurrency("")).toBe("CUP");
        expect(normalizeCurrency("cup_transf")).toBe("CUP_TRANSFERENCIA");
        expect(normalizeCurrency("USD")).toBe("USD");
      },
      "Sin moneda (backend aún no la envía) tratamos la transacción como CUP para no perderla. Las formas del backend se normalizan a la clave interna (cup_transf → CUP_TRANSFERENCIA).",
    );

    test(
      "agrupa ventas y gastos por moneda con balance por moneda",
      () => {
        const rows = groupClosingByCurrency(
          [sale(1000, "CUP"), sale(500, "CUP"), sale(10, "USD")],
          [expense(200, "CUP"), expense(2, "USD")],
        );
        const cup = rows.find((r) => r.currency === "CUP");
        const usd = rows.find((r) => r.currency === "USD");
        expect(cup?.income).toBe(1500);
        expect(cup?.expense).toBe(200);
        expect(cup?.balance).toBe(1300);
        expect(usd?.income).toBe(10);
        expect(usd?.expense).toBe(2);
        expect(usd?.balance).toBe(8);
      },
      "Cada moneda mantiene su propio subtotal de ventas, gastos y balance. CUP: 1500 ventas − 200 gastos = 1300. USD: 10 − 2 = 8. No se mezclan monedas distintas.",
    );

    test(
      "CUP va primero y el resto alfabético",
      () => {
        const rows = groupClosingByCurrency(
          [sale(1, "USD"), sale(1, "EURO"), sale(1, "CUP")],
          [],
        );
        expect(rows.map((r) => r.currency)).toEqual(["CUP", "EURO", "USD"]);
      },
      "Orden de presentación estable: la moneda base (CUP) encabeza y las demás quedan ordenadas alfabéticamente.",
    );

    test(
      "ventas sin moneda se agrupan bajo CUP",
      () => {
        const rows = groupClosingByCurrency([sale(300)], [expense(100)]);
        expect(rows.length).toBe(1);
        expect(rows[0].currency).toBe("CUP");
        expect(rows[0].balance).toBe(200);
      },
      "Mientras el backend no envíe la moneda, ventas y gastos sin moneda caen todos bajo CUP: la vista sigue funcionando (fallback) sin descartar datos.",
    );

    test(
      "coerciona total/amount string del backend",
      () => {
        const rows = groupClosingByCurrency([sale("10", "USD")], [expense(2, "USD")]);
        expect(rows[0].income).toBe(10);
        expect(rows[0].balance).toBe(8);
      },
      "El backend devuelve `total` como string; se coerciona con Number() antes de sumar.",
    );

    test(
      "consolida a CUP usando la tasa de cada moneda",
      () => {
        const rows = groupClosingByCurrency(
          [sale(1000, "CUP"), sale(10, "USD")],
          [expense(200, "CUP"), expense(2, "USD")],
        );
        const c = consolidateClosing(rows, rates);
        // income: 1000 + 10×400 = 5000 ; expense: 200 + 2×400 = 1000
        expect(c.incomeBase).toBe(5000);
        expect(c.expenseBase).toBe(1000);
        expect(c.balanceBase).toBe(4000);
        expect(c.hasUnconvertible).toBe(false);
      },
      "El consolidado convierte cada moneda a CUP y suma: ventas 1000 CUP + (10 USD×400)=5000; gastos 200 + (2×400)=1000; balance 4000. Es el balance único con sentido contable.",
    );

    test(
      "CUP_TRANSFERENCIA convierte multiplicando por la tasa como el resto",
      () => {
        const rows = groupClosingByCurrency([sale(1250, "CUP_TRANSFERENCIA")], []);
        const c = consolidateClosing(rows, rates);
        // monto × tasa → 1250 × 0.8 = 1000 CUP reales
        expect(c.incomeBase).toBeCloseTo(1000, 4);
      },
      "CUP_TRANSFERENCIA se consolida como cualquier moneda: `convertToBase` multiplica por la tasa. Con tasa 0.8, 1250 cobrados por transferencia equivalen a 1250 × 0.8 = 1000 CUP reales (el recargo del 25% ya venía incluido en los 1250).",
    );

    test(
      "moneda sin tasa con movimiento → no convertible y excluida del consolidado",
      () => {
        const rows = groupClosingByCurrency(
          [sale(1000, "CUP"), sale(50, "MLC")],
          [],
        );
        const c = consolidateClosing(rows, rates);
        expect(c.incomeBase).toBe(1000); // MLC excluido
        expect(c.hasUnconvertible).toBe(true);
        const mlc = c.rows.find((r) => r.currency === "MLC");
        expect(mlc?.convertible).toBe(false);
        expect(mlc?.balanceBase).toBeNull();
        expect(mlc?.rate).toBeNull();
      },
      "MLC tuvo ventas pero no hay tasa configurada: se marca no convertible (rate/balanceBase null), se EXCLUYE del consolidado en CUP y se activa hasUnconvertible para avisar en la UI. El desglose por moneda sí la muestra.",
    );

    test(
      "moneda sin tasa pero sin movimiento NO marca aviso",
      () => {
        const rows = groupClosingByCurrency([], []);
        const c = consolidateClosing(rows, rates);
        expect(c.hasUnconvertible).toBe(false);
        expect(c.balanceBase).toBe(0);
      },
      "Sin transacciones no hay nada que consolidar ni avisos falsos: balance 0 y sin monedas no convertibles.",
    );
  },
  { description: "Agrupa el cierre por moneda y consolida a CUP con la tasa." },
);
