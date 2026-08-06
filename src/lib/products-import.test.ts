import { describe, expect, it } from "vitest";
import {
  validateHeaders,
  validateRow,
  buildTemplateCsv,
  IMPORT_COLUMNS,
} from "./products-import";

describe("validateHeaders · estructura de la plantilla", () => {
  it("acepta encabezados canónicos (con acentos/mayúsculas y alias)", () => {
    const hv = validateHeaders(
      ["Nombre", "Descripción", "unidad", "categoria", "precio", "stock"],
      "catalog+sale",
    );
    expect(hv.ok).toBe(true);
    expect(hv.missingRequired).toHaveLength(0);
    expect(hv.unknown).toHaveLength(0);
  });

  it("marca columnas requeridas faltantes según el destino (venta)", () => {
    const hv = validateHeaders(["nombre", "unidad"], "catalog+sale");
    expect(hv.ok).toBe(false);
    const missingKeys = hv.missingRequired.map((c) => c.key);
    expect(missingKeys).toContain("price");
    expect(missingKeys).toContain("stock");
  });

  it("no exige precio/stock cuando el destino es solo catálogo", () => {
    const hv = validateHeaders(["nombre", "unidad"], "catalog");
    expect(hv.ok).toBe(true);
  });

  it("reconoce la columna de moneda del precio por su alias", () => {
    const hv = validateHeaders(
      ["nombre", "unidad", "precio", "moneda_venta", "stock"],
      "catalog+sale",
    );
    expect(hv.ok).toBe(true);
    expect(hv.unknown).toHaveLength(0);
  });

  it("sugiere el encabezado correcto ante un typo", () => {
    const hv = validateHeaders(
      ["nombre", "unidad", "precoi", "stock"],
      "catalog+sale",
    );
    expect(hv.unknown[0]?.header).toBe("precoi");
    expect(hv.unknown[0]?.suggestion).toBe("precio");
  });
});

describe("validateRow · validación por celda", () => {
  it("valida una fila correcta y coacciona números", () => {
    const { item, errors } = validateRow(
      { productName: "Arroz", productUnit: "kg", price: "150", stock: "100" },
      "catalog+sale",
    );
    expect(errors).toEqual({});
    expect(item.price).toBe(150);
    expect(item.stock).toBe(100);
    expect(item.productUnit).toBe("kg");
  });

  it("acepta coma decimal (formato ES)", () => {
    const { item, errors } = validateRow(
      { productName: "Aceite", productUnit: "l", price: "600,50", stock: "40" },
      "catalog+sale",
    );
    expect(errors.price).toBeUndefined();
    expect(item.price).toBe(600.5);
    expect(item.productUnit).toBe("L"); // "l" → canónico "L"
  });

  it("rechaza unidad inválida con mensaje accionable", () => {
    const { errors } = validateRow(
      { productName: "X", productUnit: "cajas", price: "10", stock: "1" },
      "catalog+sale",
    );
    expect(errors.productUnit).toContain("no es una unidad válida");
  });

  it("exige precio/stock solo en modo venta", () => {
    const sale = validateRow(
      { productName: "X", productUnit: "kg" },
      "catalog+sale",
    );
    expect(sale.errors.price).toBeDefined();
    expect(sale.errors.stock).toBeDefined();

    const catalog = validateRow(
      { productName: "X", productUnit: "kg" },
      "catalog",
    );
    expect(catalog.errors.price).toBeUndefined();
    expect(catalog.errors.stock).toBeUndefined();
  });

  it("rechaza precio <= 0", () => {
    const { errors } = validateRow(
      { productName: "X", productUnit: "kg", price: "0", stock: "1" },
      "catalog+sale",
    );
    expect(errors.price).toContain("mayor que 0");
  });

  it("normaliza la moneda del costo (alias y mayúsculas)", () => {
    const { item, errors } = validateRow(
      {
        productName: "X",
        productUnit: "kg",
        price: "10",
        stock: "1",
        entryPrice: "8",
        currency: "usd",
      },
      "catalog+sale",
    );
    expect(errors.currency).toBeUndefined();
    expect(item.currency).toBe("USD");

    const eur = validateRow(
      { productName: "X", productUnit: "kg", price: "10", stock: "1", currency: "eur" },
      "catalog+sale",
    );
    expect(eur.item.currency).toBe("EURO"); // alias EUR → EURO
  });

  it("rechaza una moneda no válida con mensaje accionable", () => {
    const { errors } = validateRow(
      { productName: "X", productUnit: "kg", price: "10", stock: "1", currency: "pesos" },
      "catalog+sale",
    );
    expect(errors.currency).toContain("no es una moneda válida");
  });

  it("normaliza la moneda del precio de venta, independiente de la del costo", () => {
    // Se compra en USD y se cotiza en EURO: son dos columnas distintas y ninguna
    // debe pisar a la otra.
    const { item, errors } = validateRow(
      {
        productName: "X",
        productUnit: "kg",
        price: "20",
        priceCurrency: "eur",
        stock: "1",
        entryPrice: "8",
        currency: "usd",
      },
      "catalog+sale",
    );
    expect(errors.priceCurrency).toBeUndefined();
    expect(item.priceCurrency).toBe("EURO");
    expect(item.currency).toBe("USD");
  });

  it("deja la moneda del precio sin definir cuando la columna viene vacía", () => {
    // Ausente = CUP; es lo que mantiene compatibles las plantillas anteriores.
    const { item, errors } = validateRow(
      { productName: "X", productUnit: "kg", price: "10", stock: "1" },
      "catalog+sale",
    );
    expect(errors.priceCurrency).toBeUndefined();
    expect(item.priceCurrency).toBeUndefined();
  });

  it("rechaza una moneda de precio no válida", () => {
    const { errors } = validateRow(
      {
        productName: "X",
        productUnit: "kg",
        price: "10",
        priceCurrency: "dolares",
        stock: "1",
      },
      "catalog+sale",
    );
    expect(errors.priceCurrency).toContain("no es una moneda válida");
  });
});

describe("buildTemplateCsv · plantilla descargable", () => {
  it("incluye BOM y todos los encabezados canónicos", () => {
    const csv = buildTemplateCsv();
    expect(csv.charCodeAt(0)).toBe(0xfeff); // BOM UTF-8
    const firstLine = csv.replace(/^﻿/, "").split("\r\n")[0];
    for (const col of IMPORT_COLUMNS) {
      expect(firstLine).toContain(col.header);
    }
  });
});
