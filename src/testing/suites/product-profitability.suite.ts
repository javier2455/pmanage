import { defineSuite, expect } from "@/testing/harness";
import {
  buildRecoverySegments,
  excessPct,
  liveCostSpread,
  lotCostDelta,
  negativeMarginLot,
  recoveredLots,
  recoveryPct,
  resolveVerdict,
  toDisplayCurrency,
} from "@/lib/product-profitability";
import type {
  LotInvestmentStatus,
  ProductInvestmentStatusData,
} from "@/lib/types/inventory";

function makeLot(over: Partial<LotInvestmentStatus> = {}): LotInvestmentStatus {
  return {
    lotNumber: 1,
    layerId: "l-1",
    acquiredAt: "2026-01-01T10:00:00.000Z",
    providerName: null,
    unitCost: 600,
    currency: "CUP",
    unitCostBase: 600,
    originalQuantity: 20,
    remainingQuantity: 10,
    soldQuantity: 10,
    writtenOffQuantity: 0,
    investmentBase: 12000,
    liveInvestmentBase: 6000,
    costOfSoldBase: 6000,
    revenueBase: 9000,
    collectedBase: 9000,
    revenueByCurrency: { CUP: 9000 },
    pendingBase: 3000,
    profitBase: 3000,
    marginPct: 33.3,
    potentialRevenueBase: 9000,
    isDepleted: false,
    ...over,
  };
}

function makeData(
  over: Partial<ProductInvestmentStatusData> = {},
): ProductInvestmentStatusData {
  return {
    businessProductId: "bp-1",
    productId: "prod-1",
    effectivePrice: 900,
    isOnOffer: false,
    stockQuantity: 10,
    investment: {
      totalBase: 12000,
      liveBase: 6000,
      soldBase: 6000,
      writtenOffBase: 0,
      purchasedQuantity: 20,
      costedStockQuantity: 10,
      uncostedQuantity: 0,
      ...over.investment,
    },
    recovery: {
      revenueBase: 9000,
      collectedBase: 9000,
      revenueByCurrency: { CUP: 9000 },
      soldQuantity: 10,
      pendingBase: 3000,
      recoveredPct: 75,
      collectedPct: 75,
      profitBase: 3000,
      marginPct: 33.3,
      ...over.recovery,
    },
    potential: {
      revenueBase: 9000,
      costedRevenueBase: 9000,
      profitBase: 3000,
      marginPct: 33.3,
      unitsToBreakEven: 3.33,
      coverableWithStock: true,
      totalProfitIfSoldOutBase: 6000,
      ...over.potential,
    },
    lots: over.lots ?? [makeLot()],
    unconvertedCurrencies: [],
    hasConvertedRevenue: false,
    ...over,
  };
}

const segment = (data: ProductInvestmentStatusData, key: string) =>
  buildRecoverySegments(data).find((s) => s.key === key)!;

const totalPct = (data: ProductInvestmentStatusData) =>
  buildRecoverySegments(data).reduce((sum, s) => sum + s.pct, 0);

export const productProfitabilitySuite = defineSuite(
  "product-profitability · recuperación de la inversión",
  ({ test }) => {
    test(
      "la barra reparte lo invertido sin dejar nada fuera",
      () => {
        const data = makeData();
        expect(segment(data, "collected").amountBase).toBe(9000);
        expect(segment(data, "billed").amountBase).toBe(0);
        expect(segment(data, "stock").amountBase).toBe(3000);
        expect(segment(data, "uncovered").amountBase).toBe(0);
        expect(totalPct(data)).toBeCloseTo(100);
      },
      "Con 12.000 invertidos y 9.000 ya cobrados, los 3.000 que faltan siguen siendo mercancía en el almacén. La barra queda llena porque no se ha perdido nada: solo hay dinero que todavía no ha salido en forma de venta.",
    );

    test(
      "recomprar no abre hueco en la barra",
      () => {
        // El caso del arroz: compra 20, vende 10, vuelve a comprar 20 más caro
        // sin haber agotado el primer lote. La meta sube, pero también el
        // tramo de mercancía.
        const antes = makeData();
        const despues = makeData({
          investment: {
            totalBase: 25600,
            liveBase: 19600,
            soldBase: 6000,
            writtenOffBase: 0,
            purchasedQuantity: 40,
            costedStockQuantity: 30,
            uncostedQuantity: 0,
          },
          recovery: {
            revenueBase: 9000,
            collectedBase: 9000,
            revenueByCurrency: { CUP: 9000 },
            soldQuantity: 10,
            pendingBase: 16600,
            recoveredPct: 35.2,
            collectedPct: 35.2,
            profitBase: 3000,
            marginPct: 33.3,
          },
        });

        expect(segment(antes, "uncovered").amountBase).toBe(0);
        expect(segment(despues, "uncovered").amountBase).toBe(0);
        expect(totalPct(despues)).toBeCloseTo(100);
      },
      "Si la barra fuera 'recuperado / invertido', cada compra nueva la empujaría hacia atrás y nunca llegaría al 100 %. Al contar aparte la mercancía sin vender, reponer stock hace crecer ese tramo tanto como la meta: la barra sigue llena y no se lee como un retroceso.",
    );

    test(
      "el tramo rojo solo aparece cuando hay pérdida realizada",
      () => {
        // Vendió el lote entero por 600 lo que le costó 1.000.
        const data = makeData({
          investment: {
            totalBase: 1000,
            liveBase: 0,
            soldBase: 1000,
            writtenOffBase: 0,
            purchasedQuantity: 10,
            costedStockQuantity: 0,
            uncostedQuantity: 0,
          },
          recovery: {
            revenueBase: 600,
            collectedBase: 600,
            revenueByCurrency: { CUP: 600 },
            soldQuantity: 10,
            pendingBase: 400,
            recoveredPct: 60,
            collectedPct: 60,
            profitBase: -400,
            marginPct: -66.7,
          },
        });

        expect(segment(data, "uncovered").amountBase).toBe(400);
        expect(resolveVerdict(data)).toBe("en-riesgo");
      },
      "Vender por debajo del costo es lo único que deja dinero sin recuperar de verdad: no queda mercancía con la que compensarlo. Ese es el caso —y solo ese— en el que la barra debe abrir un hueco rojo.",
    );

    test(
      "una merma deja hueco cuando el margen no la ha compensado",
      () => {
        // Vendió a precio de costo, así que no hay ganancia con la que tapar
        // el lote que se perdió por un ajuste a la baja.
        const data = makeData({
          investment: {
            totalBase: 12000,
            liveBase: 5400,
            soldBase: 6000,
            writtenOffBase: 600,
            purchasedQuantity: 20,
            costedStockQuantity: 9,
            uncostedQuantity: 0,
          },
          recovery: {
            revenueBase: 6000,
            collectedBase: 6000,
            revenueByCurrency: { CUP: 6000 },
            soldQuantity: 10,
            pendingBase: 6000,
            recoveredPct: 50,
            collectedPct: 50,
            profitBase: 0,
            marginPct: 0,
          },
        });
        expect(segment(data, "uncovered").amountBase).toBe(600);

        // Con margen suficiente, esa misma merma queda absorbida y la barra
        // vuelve a estar llena: el dinero perdido ya se recuperó vendiendo.
        const conMargen = makeData({
          investment: {
            totalBase: 12000,
            liveBase: 5400,
            soldBase: 6000,
            writtenOffBase: 600,
            purchasedQuantity: 20,
            costedStockQuantity: 9,
            uncostedQuantity: 0,
          },
        });
        expect(segment(conMargen, "uncovered").amountBase).toBe(0);
      },
      "Un ajuste de stock a la baja consume lotes sin venta detrás: ese costo salió del almacén y no va a volver. Abre hueco solo si la ganancia de lo vendido no da para cubrirlo, que es cuando el dueño de verdad ha perdido dinero.",
    );

    test(
      "lo vendido pendiente de cobro va en su propio tramo",
      () => {
        const data = makeData({
          recovery: {
            revenueBase: 9000,
            collectedBase: 4000,
            revenueByCurrency: { CUP: 9000 },
            soldQuantity: 10,
            pendingBase: 3000,
            recoveredPct: 75,
            collectedPct: 33.3,
            profitBase: 3000,
            marginPct: 33.3,
          },
        });
        expect(segment(data, "collected").amountBase).toBe(4000);
        expect(segment(data, "billed").amountBase).toBe(5000);
        expect(totalPct(data)).toBeCloseTo(100);
      },
      "Una venta a crédito ya cuenta como recuperada de devengo pero no ha entrado en caja. Separar los dos tramos evita que la barra prometa un dinero que el dueño todavía no tiene.",
    );

    test(
      "la barra se capa al 100 % y el exceso se reporta aparte",
      () => {
        const data = makeData({
          investment: {
            totalBase: 1000,
            liveBase: 0,
            soldBase: 1000,
            writtenOffBase: 0,
            purchasedQuantity: 10,
            costedStockQuantity: 0,
            uncostedQuantity: 0,
          },
          recovery: {
            revenueBase: 1500,
            collectedBase: 1500,
            revenueByCurrency: { CUP: 1500 },
            soldQuantity: 10,
            pendingBase: 0,
            recoveredPct: 150,
            collectedPct: 150,
            profitBase: 500,
            marginPct: 33.3,
          },
        });

        expect(totalPct(data)).toBeCloseTo(100);
        expect(segment(data, "collected").amountBase).toBe(1000);
        expect(recoveryPct(data)).toBe(150);
        expect(excessPct(data)).toBe(50);
        expect(resolveVerdict(data)).toBe("recuperado");
      },
      "Recuperar de más es una buena noticia, pero una barra que se desborda geométricamente se lee como un fallo. El ancho se capa y el exceso se dice con un número.",
    );

    test(
      "un producto sin compras no lleva recuperado el 0 %",
      () => {
        const data = makeData({
          investment: {
            totalBase: 0,
            liveBase: 0,
            soldBase: 0,
            writtenOffBase: 0,
            purchasedQuantity: 0,
            costedStockQuantity: 0,
            uncostedQuantity: 0,
          },
          lots: [],
        });
        expect(recoveryPct(data)).toBeNull();
        expect(resolveVerdict(data)).toBe("sin-compras");
        expect(totalPct(data)).toBe(0);
      },
      "Sin ninguna compra registrada la pregunta no aplica, y un 0 % sugeriría que hay algo puesto que no se ha recuperado. `null` deja que la vista muestre un mensaje en vez de una cifra falsa.",
    );

    test(
      "sin ventas, todo lo invertido sigue siendo mercancía",
      () => {
        const data = makeData({
          recovery: {
            revenueBase: 0,
            collectedBase: 0,
            revenueByCurrency: {},
            soldQuantity: 0,
            pendingBase: 12000,
            recoveredPct: 0,
            collectedPct: 0,
            profitBase: 0,
            marginPct: null,
          },
          investment: {
            totalBase: 12000,
            liveBase: 12000,
            soldBase: 0,
            writtenOffBase: 0,
            purchasedQuantity: 20,
            costedStockQuantity: 20,
            uncostedQuantity: 0,
          },
        });
        expect(resolveVerdict(data)).toBe("sin-ventas");
        expect(segment(data, "stock").pct).toBeCloseTo(100);
        expect(segment(data, "uncovered").amountBase).toBe(0);
      },
      "Comprar y no haber vendido todavía no es un problema: el dinero está en el almacén, no perdido. La barra lo dice pintando el tramo de mercancía entero, sin rojo.",
    );

    test(
      "cambiar de moneda no toca los porcentajes",
      () => {
        const data = makeData();
        const rates = { USD: 400 };
        const pctAntes = buildRecoverySegments(data).map((s) => s.pct);

        expect(toDisplayCurrency(12000, "USD", rates)).toBe(30);
        expect(toDisplayCurrency(12000, "CUP", rates)).toBe(12000);
        // Los porcentajes son cocientes: la tasa se cancela arriba y abajo.
        expect(buildRecoverySegments(data).map((s) => s.pct)).toEqual(
          pctAntes,
        );
        expect(recoveryPct(data)).toBe(75);
      },
      "El selector de moneda solo cambia la escala de los importes. Convertir un margen o un porcentaje de recuperación sería un error de concepto: el cociente es el mismo en cualquier moneda.",
    );

    test(
      "la variación de costo compara cada lote con el anterior",
      () => {
        const lots = [
          makeLot({ lotNumber: 1, unitCostBase: 600 }),
          makeLot({ layerId: "l-2", lotNumber: 2, unitCostBase: 680 }),
        ];
        expect(lotCostDelta(lots, 0)).toBeNull();
        expect(lotCostDelta(lots, 1)).toBe(13.3);
      },
      "Enseñar que el proveedor subió un 13 % explica el estrechamiento del margen mejor que un párrafo. El primer lote no tiene con qué compararse, así que devuelve `null` en vez de un 0 % engañoso.",
    );

    test(
      "avisa cuando quedan lotes vivos a distinto costo",
      () => {
        const mezcla = liveCostSpread([
          makeLot({ unitCostBase: 600 }),
          makeLot({ layerId: "l-2", unitCostBase: 680 }),
        ]);
        expect(mezcla?.min.unitCostBase).toBe(600);
        expect(mezcla?.max.unitCostBase).toBe(680);

        expect(
          liveCostSpread([
            makeLot({ unitCostBase: 600 }),
            makeLot({ layerId: "l-2", unitCostBase: 600 }),
          ]),
        ).toBeNull();
        expect(
          liveCostSpread([
            makeLot({ unitCostBase: 600 }),
            makeLot({ layerId: "l-2", unitCostBase: 680, isDepleted: true }),
          ]),
        ).toBeNull();
      },
      "Con lotes a distinto costo, las próximas ventas salen del más antiguo y dejan SU margen, no el del último precio pagado. Si todos cuestan lo mismo no hay nada que advertir, y un lote agotado ya no surte ninguna venta.",
    );

    test(
      "detecta que el lote que sale primero cuesta más que el precio de venta",
      () => {
        const enPerdida = makeData({
          effectivePrice: 500,
          lots: [makeLot({ unitCostBase: 600 })],
        });
        expect(negativeMarginLot(enPerdida)?.unitCostBase).toBe(600);

        expect(negativeMarginLot(makeData())).toBeNull();
        // Sin precio configurado no hay nada que comparar.
        expect(
          negativeMarginLot(makeData({ effectivePrice: 0 })),
        ).toBeNull();
      },
      "La notificación de margen negativo que ya existe avisa al vender, o sea cuando la pérdida ya se produjo. Comparar el precio con el costo del lote que sale primero permite corregirlo antes.",
    );

    test(
      "cuenta los lotes que ya se pagaron solos",
      () => {
        const { recovered, total } = recoveredLots([
          makeLot({ pendingBase: 0 }),
          makeLot({ layerId: "l-2", pendingBase: 2400 }),
          makeLot({ layerId: "l-3", pendingBase: 0 }),
        ]);
        expect(recovered).toBe(2);
        expect(total).toBe(3);
      },
      "La lectura por lote no la sabotea recomprar: un lote agotado y cobrado queda al 100 % para siempre. Es el contrapeso honesto a una barra acumulada que sí se mueve con cada compra.",
    );
  },
);
