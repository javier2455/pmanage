import { defineSuite, expect } from "@/testing/harness";
import {
  BASE_CURRENCY,
  convertBetween,
  convertFromBase,
  convertToBase,
  formatMoney,
  getAvailableCurrencies,
  getCurrencyRate,
} from "@/lib/currency";

// Tasas típicas: cuántos CUP vale 1 unidad de cada moneda. CUP_TRANSFERENCIA es
// la excepción: su valor (1.1) es un multiplicador de recargo en CUP, no CUP/unidad.
const rates = {
  USD: 400,
  EURO: 420,
  MLC: 250,
  CAD: 0,
  CLASICA: "120",
  CUP_TRANSFERENCIA: 1.1,
};

export const currencySuite = defineSuite(
  "currency · moneda multimoneda",
  ({ test }) => {
    test(
      "getAvailableCurrencies siempre incluye la base (CUP)",
      () => {
        expect(getAvailableCurrencies(null)).toEqual([BASE_CURRENCY]);
      },
      "Sin objeto de tasas (null), la función debe devolver únicamente ['CUP']. CUP es la moneda base del sistema y siempre está disponible para operar, aunque no haya ninguna tasa de cambio configurada.",
    );

    test(
      "getAvailableCurrencies incluye solo monedas con tasa > 0",
      () => {
        const result = getAvailableCurrencies(rates);
        expect(result).toContain("USD");
        expect(result).toContain("EURO");
        expect(result).toContain("MLC");
        expect(result).not.toContain("CAD"); // tasa 0 → no operable
      },
      "Con tasas {USD:400, EURO:420, MLC:250, CAD:0}, solo las monedas con tasa mayor que 0 se consideran operables. USD/EURO/MLC entran; CAD (tasa 0) se excluye porque el usuario no la ha activado dándole una tasa.",
    );

    test(
      "getAvailableCurrencies acepta tasas como string del backend",
      () => {
        expect(getAvailableCurrencies(rates)).toContain("CLASICA");
      },
      "El backend a veces envía las tasas como string ('120') en vez de número. CLASICA:'120' debe interpretarse como tasa válida (> 0) y aparecer en la lista de monedas disponibles.",
    );

    test(
      "getAvailableCurrencies ignora códigos desconocidos",
      () => {
        expect(getAvailableCurrencies({ DOGE: 999 })).toEqual([BASE_CURRENCY]);
      },
      "Solo se consideran los códigos de la lista KNOWN_CURRENCY_CODES. Una moneda no reconocida (DOGE) se ignora aunque tenga tasa, devolviendo solo ['CUP'].",
    );

    test(
      "getCurrencyRate: CUP siempre vale 1",
      () => {
        expect(getCurrencyRate(rates, "CUP")).toBe(1);
        expect(getCurrencyRate(null, "CUP")).toBe(1);
      },
      "La tasa de CUP contra sí misma es siempre 1, sin importar el objeto de tasas (incluso null). Es el ancla del sistema de conversión.",
    );

    test(
      "getCurrencyRate devuelve la tasa configurada",
      () => {
        expect(getCurrencyRate(rates, "USD")).toBe(400);
      },
      "Para una moneda con tasa configurada, devuelve cuántos CUP vale 1 unidad. 1 USD = 400 CUP → devuelve 400.",
    );

    test(
      "getCurrencyRate devuelve null sin tasas o con tasa 0",
      () => {
        expect(getCurrencyRate(null, "USD")).toBeNull();
        expect(getCurrencyRate(rates, "CAD")).toBeNull();
        expect(getCurrencyRate(rates, "GBP")).toBeNull();
      },
      "Devuelve null cuando no se puede operar: sin objeto de tasas (null), con tasa 0 (CAD) o cuando la moneda no está en el objeto (GBP). null es la señal de 'moneda no convertible'.",
    );

    test(
      "convertFromBase convierte CUP dividiendo por la tasa",
      () => {
        expect(convertFromBase(800, "USD", rates)).toBe(2); // 800 / 400
      },
      "Convierte un precio guardado en CUP a la moneda de la venta dividiendo por la tasa: 800 CUP ÷ 400 (tasa USD) = 2 USD.",
    );

    test(
      "convertFromBase multiplica para CUP transferencia (recargo en CUP)",
      () => {
        expect(convertFromBase(3600, "CUP_TRANSFERENCIA", rates)).toBeCloseTo(3960, 6); // 3600 × 1.1
      },
      "CUP_TRANSFERENCIA no es moneda extranjera: su tasa (1.1) es un recargo del 10% sobre el precio en CUP. Un producto de 3600 CUP pagado por transferencia cuesta 3600 × 1.1 = 3960, no 3600 ÷ 1.1. Caso de la issue de cálculo incorrecto.",
    );

    test(
      "convertToBase invierte convertFromBase según la moneda",
      () => {
        expect(convertToBase(2, "USD", rates)).toBe(800); // extranjera: 2 × 400
        expect(convertToBase(3960, "CUP_TRANSFERENCIA", rates)).toBeCloseTo(3600, 6); // recargo: 3960 ÷ 1.1
      },
      "convertToBase es la inversa de convertFromBase. Extranjera multiplica (2 USD → 800 CUP); CUP con recargo divide (3960 transferencia → 3600 CUP base).",
    );

    test(
      "convertFromBase es defensivo (CUP, sin tasa)",
      () => {
        expect(convertFromBase(800, "CUP", rates)).toBe(800);
        expect(convertFromBase(800, "CAD", rates)).toBe(800);
        expect(convertFromBase(800, "USD", null)).toBe(800);
      },
      "Comportamiento defensivo: si la moneda destino es CUP, no hay tasa (CAD) o no hay objeto de tasas (null), devuelve el monto sin convertir en vez de romper o devolver NaN.",
    );

    test(
      "convertBetween usa CUP como puente",
      () => {
        expect(convertBetween(1, "USD", "EURO", rates)).toBeCloseTo(400 / 420, 6);
        expect(convertBetween(2, "USD", "CUP", rates)).toBe(800);
        expect(convertBetween(800, "CUP", "USD", rates)).toBe(2);
      },
      "Convierte entre dos monedas pasando por CUP: equivalente = (monto × tasa_origen) ÷ tasa_destino. 1 USD→EURO ≈ 400/420; 2 USD→CUP = 800; 800 CUP→USD = 2.",
    );

    test(
      "convertBetween respeta la dirección de CUP transferencia",
      () => {
        // CUP → transferencia: recargo (×1.1). Transferencia → CUP: ÷1.1.
        expect(convertBetween(3600, "CUP", "CUP_TRANSFERENCIA", rates)).toBeCloseTo(3960, 6);
        expect(convertBetween(3960, "CUP_TRANSFERENCIA", "CUP", rates)).toBeCloseTo(3600, 6);
      },
      "convertBetween se apoya en convertToBase/convertFromBase, así que respeta que CUP_TRANSFERENCIA multiplica al venir de CUP (3600 → 3960) y divide al volver a CUP (3960 → 3600), en vez de tratarla como extranjera.",
    );

    test(
      "convertBetween devuelve null si falta alguna tasa",
      () => {
        expect(convertBetween(1, "USD", "CAD", rates)).toBeNull();
        expect(convertBetween(1, "CAD", "USD", rates)).toBeNull();
      },
      "Si falta la tasa de origen o de destino (CAD tiene tasa 0), no se puede calcular un equivalente fiable, así que devuelve null en ambas direcciones.",
    );

    test(
      "formatMoney: 2 decimales + sufijo de moneda",
      () => {
        expect(formatMoney(1234.5, "USD")).toBe("1,234.50 USD");
        expect(formatMoney(1000)).toBe("1,000.00 CUP");
      },
      "Formatea con separador de miles y exactamente 2 decimales, añadiendo el código de moneda como sufijo. Sin moneda explícita usa CUP por defecto. No usa Intl currency porque EURO/MLC no son ISO 4217.",
    );

    test(
      "formatMoney trata valores no finitos como 0",
      () => {
        expect(formatMoney(Number.NaN, "USD")).toBe("0.00 USD");
        expect(formatMoney(Number.POSITIVE_INFINITY)).toBe("0.00 CUP");
      },
      "Defensa contra valores corruptos: NaN o Infinity se muestran como '0.00' para no enseñar 'NaN' o '∞' al usuario en una pantalla de dinero.",
    );
  },
  { description: "Conversión y formato de moneda para ventas/pagos." },
);
