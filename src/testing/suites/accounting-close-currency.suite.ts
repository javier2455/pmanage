import { defineSuite, expect } from "@/testing/harness";
import {
  consolidateClosing,
  groupClosingByCurrency,
  hasUnconvertibleFor,
  normalizeCurrency,
  resolveConsolidation,
  type ClosingServerTotals,
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

    // --- resolveConsolidation: prefiere el consolidado del backend, cae al client ---

    test(
      "resolveConsolidation usa el consolidado del backend cuando llega",
      () => {
        const rows = groupClosingByCurrency([sale(1000, "CUP"), sale(10, "USD")], []);
        const client = consolidateClosing(rows, rates); // incomeBase = 5000
        const server: ClosingServerTotals = {
          consolidatedBase: { income: 5123, expense: 40, balance: 5083 },
          unconvertedCurrencies: [],
        };
        const r = resolveConsolidation(client, server);
        expect(r.source).toBe("server");
        expect(r.incomeBase).toBe(5123); // gana el backend, no el 5000 local
        expect(r.expenseBase).toBe(40);
        expect(r.balanceBase).toBe(5083);
        expect(r.hasUnconvertible).toBe(false);
      },
      "El backend es la fuente de verdad (coincide con PDF/Excel y usa las tasas del snapshot del cierre). Cuando trae consolidatedBase válido, resolveConsolidation devuelve esas cifras aunque difieran del cálculo local con tasas vivas.",
    );

    test(
      "resolveConsolidation cae al cálculo client si el backend no trae consolidatedBase",
      () => {
        const rows = groupClosingByCurrency([sale(1000, "CUP"), sale(10, "USD")], []);
        const client = consolidateClosing(rows, rates);
        expect(resolveConsolidation(client, undefined).source).toBe("client");
        expect(resolveConsolidation(client, {}).source).toBe("client");
        expect(resolveConsolidation(client, undefined).incomeBase).toBe(5000);
      },
      "Compatibilidad hacia atrás: cierres antiguos u otros endpoints pueden no enviar consolidatedBase. Sin él, la UI no se queda sin cifras: reusa el cálculo client-side (5000) en vez de mostrar ceros.",
    );

    test(
      "resolveConsolidation ignora un consolidatedBase inválido (NaN/incompleto)",
      () => {
        const rows = groupClosingByCurrency([sale(1000, "CUP")], []);
        const client = consolidateClosing(rows, rates);
        const bad = { income: Number.NaN, expense: 0, balance: 0 };
        // @ts-expect-error probamos a propósito un objeto incompleto del backend
        const worse: ClosingServerTotals = { consolidatedBase: { income: 5 } };
        expect(resolveConsolidation(client, { consolidatedBase: bad }).source).toBe("client");
        expect(resolveConsolidation(client, worse).source).toBe("client");
      },
      "Si el backend manda un consolidado corrupto (NaN o sin todos los campos), no lo usamos: caemos al cálculo local para no mostrar cifras rotas.",
    );

    test(
      "resolveConsolidation deriva hasUnconvertible de unconvertedCurrencies (global)",
      () => {
        const rows = groupClosingByCurrency([sale(1000, "CUP")], []);
        const client = consolidateClosing(rows, rates);
        const server: ClosingServerTotals = {
          consolidatedBase: { income: 1000, expense: 0, balance: 1000 },
          unconvertedCurrencies: ["mlc"],
        };
        expect(resolveConsolidation(client, server).hasUnconvertible).toBe(true);
      },
      "Con datos del backend, el aviso sale de unconvertedCurrencies (lista global ventas+gastos): si trae alguna moneda, hasUnconvertible es true. Es el aviso correcto para el resumen financiero.",
    );

    // --- hasUnconvertibleFor: aviso preciso por tabla (solo ventas o solo gastos) ---

    test(
      "hasUnconvertibleFor distingue la cara de ventas de la de gastos",
      () => {
        const server: ClosingServerTotals = {
          totalsByCurrency: {
            cup: { income: 1000, expense: 100, balance: 900 },
            usd: { income: 50, expense: 0, balance: 50 }, // venta USD sin tasa
            mlc: { income: 0, expense: 30, balance: -30 }, // gasto MLC sin tasa
          },
          exchangeRateSnapshot: { cup: 1 }, // ni USD ni MLC tienen tasa
        };
        // La tabla de ventas solo debe avisar por USD (movió en ventas); MLC no.
        expect(hasUnconvertibleFor("income", server)).toBe(true);
        // La tabla de gastos solo debe avisar por MLC (movió en gastos); USD no.
        expect(hasUnconvertibleFor("expense", server)).toBe(true);
      },
      "unconvertedCurrencies del backend es global y marcaría ambas tablas por igual. hasUnconvertibleFor mira totalsByCurrency por cara: una moneda solo cuenta si movió en esa cara y no tiene tasa en el snapshot, evitando avisar en la tabla de ventas por un gasto (o al revés).",
    );

    test(
      "hasUnconvertibleFor no marca si la moneda movida sí tiene tasa",
      () => {
        const server: ClosingServerTotals = {
          totalsByCurrency: {
            cup: { income: 1000, expense: 0, balance: 1000 },
            usd: { income: 50, expense: 0, balance: 50 },
          },
          exchangeRateSnapshot: { cup: 1, usd: 400 },
        };
        expect(hasUnconvertibleFor("income", server)).toBe(false);
        // CUP nunca cuenta como no convertible (es la base).
        expect(
          hasUnconvertibleFor("income", {
            totalsByCurrency: { cup: { income: 1, expense: 0, balance: 1 } },
            exchangeRateSnapshot: {},
          }),
        ).toBe(false);
      },
      "Si toda moneda con ventas tiene tasa en el snapshot, no hay aviso. CUP se ignora siempre porque es la base (tasa 1 implícita), aunque no aparezca en el snapshot.",
    );

    test(
      "hasUnconvertibleFor devuelve null sin totalsByCurrency (deja decidir al client)",
      () => {
        expect(hasUnconvertibleFor("income", undefined)).toBeNull();
        expect(hasUnconvertibleFor("income", {})).toBeNull();
      },
      "Sin datos del backend no puede afirmar nada: devuelve null para que el componente use su flag client-side por tabla como respaldo (?? clientConsolidation.hasUnconvertible).",
    );
  },
  { description: "Agrupa el cierre por moneda y consolida a CUP con la tasa." },
);
