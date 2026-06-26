import { defineSuite, expect } from "@/testing/harness";
import {
  formatStockWithUnit,
  isIntegerUnit,
  normalizeStock,
  parseDecimalInput,
} from "@/lib/units";

export const unitsSuite = defineSuite(
  "units · stock y unidades",
  ({ test }) => {
    test(
      "isIntegerUnit: 'ud' es entera",
      () => {
        expect(isIntegerUnit("ud")).toBe(true);
      },
      "La unidad 'ud' (unidades/piezas) no admite fracciones: no puedes vender media pieza. La función la clasifica como entera.",
    );

    test(
      "isIntegerUnit: peso/volumen admiten decimales",
      () => {
        expect(isIntegerUnit("kg")).toBe(false);
        expect(isIntegerUnit("L")).toBe(false);
        expect(isIntegerUnit("g")).toBe(false);
      },
      "Las unidades de peso (kg, g) y volumen (L) sí admiten decimales — puedes quedarte con 0,4 kg tras una venta. La función las clasifica como NO enteras.",
    );

    test(
      "isIntegerUnit: unidad nula/desconocida → entera (defensivo)",
      () => {
        expect(isIntegerUnit(null)).toBe(true);
        expect(isIntegerUnit(undefined)).toBe(true);
      },
      "Si la unidad es null/undefined (dato incompleto), se asume entera por seguridad: es preferible redondear que mostrar decimales sin sentido en un producto sin unidad definida.",
    );

    test(
      "normalizeStock redondea unidades enteras",
      () => {
        expect(normalizeStock(2.6, "ud")).toBe(3);
        expect(normalizeStock("4", "ud")).toBe(4);
      },
      "Para unidades enteras, normaliza con Math.round: 2.6 ud → 3. También coerciona strings del backend ('4' → 4).",
    );

    test(
      "normalizeStock conserva decimales en peso/volumen",
      () => {
        expect(normalizeStock("0.40", "kg")).toBe(0.4);
        expect(normalizeStock(2.5, "L")).toBe(2.5);
      },
      "Para peso/volumen NO redondea: '0.40' kg → 0.4, 2.5 L → 2.5. Conserva el decimal real del stock.",
    );

    test(
      "normalizeStock: valores no parseables → 0",
      () => {
        expect(normalizeStock(null, "kg")).toBe(0);
        expect(normalizeStock(undefined, "ud")).toBe(0);
        expect(normalizeStock("abc", "kg")).toBe(0);
      },
      "Si el valor no se puede convertir a número (null, undefined, 'abc'), devuelve 0 en vez de NaN. Es la fuente única de verdad del stock, así que nunca debe propagar NaN.",
    );

    test(
      "parseDecimalInput acepta coma o punto",
      () => {
        expect(parseDecimalInput("0,5")).toBe(0.5);
        expect(parseDecimalInput("0.5")).toBe(0.5);
        expect(parseDecimalInput(3.2)).toBe(3.2);
      },
      "El usuario en es-CO ve '0,5' pero con teclado físico suele teclear '0.5'. La función acepta ambos separadores. Si ya es número, lo devuelve tal cual.",
    );

    test(
      "parseDecimalInput: vacío o no numérico → NaN",
      () => {
        expect(parseDecimalInput("")).toBeNaN();
        expect(parseDecimalInput("   ")).toBeNaN();
        expect(parseDecimalInput(null)).toBeNaN();
        expect(parseDecimalInput("abc")).toBeNaN();
      },
      "Vacío, solo espacios, null o texto no numérico devuelven NaN — igual que valueAsNumber de react-hook-form, para que el schema Zod marque el error de campo requerido.",
    );

    test(
      "formatStockWithUnit: singular vs plural en unidades",
      () => {
        expect(formatStockWithUnit(1, "ud")).toBe("1 unidad");
        expect(formatStockWithUnit(12, "ud")).toBe("12 unidades");
        expect(formatStockWithUnit(2.6, "ud")).toBe("3 unidades");
      },
      "Para 'ud' muestra el texto correcto: 1 → '1 unidad' (singular), 12 → '12 unidades' (plural), y redondea antes de mostrar (2.6 → '3 unidades').",
    );

    test(
      "formatStockWithUnit: peso/volumen con la unidad como sufijo",
      () => {
        expect(formatStockWithUnit("0.4", "kg")).toBe("0,4 kg");
        expect(formatStockWithUnit(2.5, "L")).toBe("2,5 L");
      },
      "Para peso/volumen muestra el número en formato es-CO (coma decimal) con la unidad como sufijo: '0,4 kg', '2,5 L'. Hasta 3 decimales sin ceros sobrantes.",
    );
  },
  { description: "Normalización y formato de stock por tipo de unidad." },
);
