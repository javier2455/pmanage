import { defineSuite, expect } from "@/testing/harness";
import {
  BASE_CURRENCY,
  convertBetween,
  convertFromBase,
  convertToBase,
  currencyLabel,
  formatMoney,
  fromBackendCurrency,
  getAvailableCurrencies,
  getCurrencyRate,
  toBackendCurrency,
} from "@/lib/currency";

// Tasas típicas: cuántos CUP vale 1 unidad de cada moneda. CUP_TRANSFERENCIA se
// trata igual que el resto: su tasa 0.8 significa que 1 transferencia = 0.8 CUP,
// es decir un recargo del 25% (100 CUP / 0.8 = 125 transferencia).
const rates = {
  USD: 400,
  EURO: 420,
  MLC: 250,
  CAD: 0,
  CLASICA: "120",
  CUP_TRANSFERENCIA: 0.8,
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
      "convertFromBase divide para CUP transferencia igual que el resto",
      () => {
        expect(convertFromBase(100, "CUP_TRANSFERENCIA", rates)).toBeCloseTo(125, 6); // 100 / 0.8
      },
      "CUP_TRANSFERENCIA convierte como cualquier moneda: divide por la tasa. Con tasa 0.8 (1 transferencia = 0.8 CUP), un producto de 100 CUP se cobra 100 / 0.8 = 125 transferencia (recargo del 25%). Antes se multiplicaba por una tasa invertida; esta es la corrección de la issue del backend.",
    );

    test(
      "convertToBase invierte convertFromBase multiplicando por la tasa",
      () => {
        expect(convertToBase(2, "USD", rates)).toBe(800); // 2 × 400
        expect(convertToBase(125, "CUP_TRANSFERENCIA", rates)).toBeCloseTo(100, 6); // 125 × 0.8
      },
      "convertToBase es la inversa de convertFromBase y multiplica por la tasa para toda moneda: 2 USD → 800 CUP; 125 transferencia → 125 × 0.8 = 100 CUP base.",
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
      "convertBetween trata CUP transferencia como una moneda más",
      () => {
        // CUP → transferencia: 100 / 0.8 = 125. Transferencia → CUP: 125 × 0.8 = 100.
        expect(convertBetween(100, "CUP", "CUP_TRANSFERENCIA", rates)).toBeCloseTo(125, 6);
        expect(convertBetween(125, "CUP_TRANSFERENCIA", "CUP", rates)).toBeCloseTo(100, 6);
      },
      "convertBetween se apoya en convertToBase/convertFromBase, que ahora convierten toda moneda por igual vía CUP: 100 CUP → 125 transferencia (÷0.8) y 125 transferencia → 100 CUP (×0.8).",
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
      "toBackendCurrency traduce CUP_TRANSFERENCIA al enum del backend",
      () => {
        expect(toBackendCurrency("CUP_TRANSFERENCIA")).toBe("cup_transferencia");
        expect(toBackendCurrency("USD")).toBe("USD");
        expect(toBackendCurrency("CUP")).toBe("CUP");
      },
      "El backend espera recibir la transferencia en CUP como el enum snake_case 'cup_transferencia'. La UI solo conoce la forma interna 'CUP_TRANSFERENCIA' (mostrada como 'CUP Transferencia'); al enviar ventas/pagos se traduce solo esa moneda a 'cup_transferencia'; el resto (USD, CUP…) viaja sin cambios.",
    );

    test(
      "fromBackendCurrency invierte el mapeo a la forma interna",
      () => {
        expect(fromBackendCurrency("cup_transferencia")).toBe("CUP_TRANSFERENCIA");
        expect(fromBackendCurrency("USD")).toBe("USD");
        expect(fromBackendCurrency(toBackendCurrency("CUP_TRANSFERENCIA"))).toBe(
          "CUP_TRANSFERENCIA",
        );
      },
      "Al leer respuestas del backend convertimos 'cup_transferencia' de vuelta a la clave interna 'CUP_TRANSFERENCIA' para que la UI (tasas, recargo, conversión) la reconozca. Es la inversa exacta de toBackendCurrency.",
    );

    test(
      "fromBackendCurrency normaliza la transferencia truncada por el backend",
      () => {
        expect(fromBackendCurrency("cup_transf")).toBe("CUP_TRANSFERENCIA");
        expect(fromBackendCurrency("cup_transfer")).toBe("CUP_TRANSFERENCIA");
        expect(fromBackendCurrency("CUP_TRANSF")).toBe("CUP_TRANSFERENCIA");
      },
      "El backend devuelve la transferencia en CUP TRUNCADA al largo de su columna: en la práctica vuelve como 'cup_transf' (10 chars), no 'cup_transferencia'. Sin normalizarla, la moneda base de la venta no coincide con la clave interna 'CUP_TRANSFERENCIA' del selector: se muestra cruda, aparece duplicada y su conversión queda en 0 (la tasa se indexa por la clave canónica), bloqueando el cobro. Por eso cualquier prefijo 'cup_transf…' colapsa a la misma forma interna.",
    );

    test(
      "fromBackendCurrency pasa a mayúsculas las monedas en minúsculas del cierre",
      () => {
        expect(fromBackendCurrency("cup")).toBe("CUP");
        expect(fromBackendCurrency("usd")).toBe("USD");
        expect(fromBackendCurrency("euro")).toBe("EURO");
        expect(fromBackendCurrency("mlc")).toBe("MLC");
      },
      "El cierre diario/mensual normaliza toda moneda a minúsculas antes de responder (normalizeCurrency en sale.service.ts), así que llegan como 'cup'/'usd'/'euro'. Cuando fromBackendCurrency las devolvía sin tocar, getCurrencyRate comparaba 'cup' === 'CUP' (falso) e indexaba exchangeRate['usd'] cuando las tasas van en mayúsculas: ninguna moneda resultaba convertible, el equivalente en CUP salía 0 y aparecía el aviso de 'sin tasa configurada' con las tasas bien puestas.",
    );

    test(
      "getCurrencyRate resuelve la tasa partiendo de la forma del backend",
      () => {
        expect(getCurrencyRate(rates, fromBackendCurrency("cup"))).toBe(1);
        expect(getCurrencyRate(rates, fromBackendCurrency("usd"))).toBe(
          getCurrencyRate(rates, "USD"),
        );
      },
      "Cierra el bucle del bug anterior: normalizar la moneda del backend debe bastar para que la tasa se encuentre. 'cup' tiene que resolver a la tasa base 1 y 'usd' a la misma tasa que 'USD'; si alguna devolviera null, la moneda quedaría fuera del consolidado en CUP.",
    );

    test(
      "currencyLabel muestra 'CUP Transferencia' para cualquier forma de la moneda",
      () => {
        expect(currencyLabel("CUP_TRANSFERENCIA")).toBe("CUP Transferencia");
        expect(currencyLabel("cup_transferencia")).toBe("CUP Transferencia");
        expect(currencyLabel("cup_transfer")).toBe("CUP Transferencia");
        expect(currencyLabel("cup_transf")).toBe("CUP Transferencia");
        expect(currencyLabel("USD")).toBe("USD");
        expect(currencyLabel("CUP")).toBe("CUP");
      },
      "La etiqueta normaliza primero a la clave interna, así una venta que vuelva con el enum del backend ('cup_transfer'/'cup_transferencia') se muestra como 'CUP Transferencia' aunque el código no se haya normalizado aguas arriba; nunca se enseña el enum crudo al usuario. El resto de monedas se muestran con su código.",
    );

    test(
      "formatMoney: 2 decimales + sufijo de moneda",
      () => {
        expect(formatMoney(1234.5, "USD")).toBe("1,234.50 USD");
        expect(formatMoney(1000)).toBe("1,000.00 CUP");
        expect(formatMoney(1000, "cup_transfer")).toBe("1,000.00 CUP Transferencia");
      },
      "Formatea con separador de miles y exactamente 2 decimales, añadiendo la moneda como sufijo (vía currencyLabel, así el enum del backend nunca se filtra). Sin moneda explícita usa CUP por defecto. No usa Intl currency porque EURO/MLC no son ISO 4217.",
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
