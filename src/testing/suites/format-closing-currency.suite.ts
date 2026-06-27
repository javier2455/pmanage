import { defineSuite, expect } from "@/testing/harness";
import { formatClosingCurrency } from "@/components/accounting-close/format-closing-currency";

export const formatClosingCurrencySuite = defineSuite(
  "format-closing-currency · formato de cierre",
  ({ test }) => {
    test(
      "siempre muestra 2 decimales",
      () => {
        expect(formatClosingCurrency(1000)).toBe("1,000.00");
        expect(formatClosingCurrency(5.5)).toBe("5.50");
      },
      "El cierre contable siempre muestra exactamente 2 decimales: un entero (1000) se muestra como '1,000.00' y un decimal corto (5.5) se completa a '5.50'. Mantiene las columnas de dinero alineadas.",
    );

    test(
      "agrega separador de miles",
      () => {
        expect(formatClosingCurrency(1234567.89)).toBe("1,234,567.89");
      },
      "Usa el separador de miles en-US (coma) para que las cifras grandes sean legibles: 1234567.89 → '1,234,567.89'.",
    );

    test(
      "redondea a 2 decimales",
      () => {
        expect(formatClosingCurrency(2.005)).toBe("2.01");
        expect(formatClosingCurrency(2.004)).toBe("2.00");
      },
      "toLocaleString redondea al segundo decimal: 2.005 → '2.01' (hacia arriba) y 2.004 → '2.00' (hacia abajo). Evita mostrar más decimales de los debidos en un cierre.",
    );

    test(
      "maneja cero y negativos",
      () => {
        expect(formatClosingCurrency(0)).toBe("0.00");
        expect(formatClosingCurrency(-1500.5)).toBe("-1,500.50");
      },
      "El cero se muestra como '0.00' y los negativos conservan el signo y el formato: -1500.5 → '-1,500.50' (útil para diferencias o faltantes en el cierre).",
    );
  },
  { description: "Formatea importes del cierre contable diario." },
);
