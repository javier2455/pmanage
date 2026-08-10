import { describe, expect, it } from "vitest";
import {
  assignProductToBusinessSchema,
  MAX_PRODUCT_PRICE,
} from "./products";
import { makeInventoryUpdateStockSchema } from "./inventory";

/**
 * Los importes se teclean en la moneda de la compra: exigir "≥ 1" al número
 * escrito equivalía a exigir 1 USD (~440 CUP) de mínimo. El límite inferior
 * pasa a ser "> 0" y el mínimo real (0,01 CUP) lo comprueba el formulario sobre
 * el equivalente convertido.
 */
const assignBase = {
  productId: "p1",
  price: 100,
  entryPrice: 60,
  stock: 24,
};

describe("assignProductToBusinessSchema — importes", () => {
  it("acepta un costo unitario menor que 1 (0,60 USD por bolsa)", () => {
    const result = assignProductToBusinessSchema.safeParse({
      ...assignBase,
      entryPrice: 0.6,
      currency: "USD",
    });
    expect(result.success).toBe(true);
  });

  it("acepta un precio de venta menor que 1 en divisa", () => {
    const result = assignProductToBusinessSchema.safeParse({
      ...assignBase,
      price: 0.8,
      priceInputCurrency: "USD",
    });
    expect(result.success).toBe(true);
  });

  it("sigue rechazando cero y negativos", () => {
    expect(
      assignProductToBusinessSchema.safeParse({ ...assignBase, entryPrice: 0 })
        .success,
    ).toBe(false);
    expect(
      assignProductToBusinessSchema.safeParse({ ...assignBase, price: -1 })
        .success,
    ).toBe(false);
  });

  it("mantiene el tope de ambos importes", () => {
    expect(
      assignProductToBusinessSchema.safeParse({
        ...assignBase,
        price: MAX_PRODUCT_PRICE + 1,
      }).success,
    ).toBe(false);
    expect(
      assignProductToBusinessSchema.safeParse({
        ...assignBase,
        entryPrice: MAX_PRODUCT_PRICE + 1,
      }).success,
    ).toBe(false);
  });
});

describe("makeInventoryUpdateStockSchema — costo del lote", () => {
  const base = {
    quantity: 24,
    entryPrice: 60,
    productId: "p1",
    description: "Compra del mes",
  };

  it("acepta un costo unitario menor que 1", () => {
    const result = makeInventoryUpdateStockSchema(false).safeParse({
      ...base,
      entryPrice: 0.6,
      currency: "USD",
    });
    expect(result.success).toBe(true);
  });

  it("sigue rechazando cero", () => {
    expect(
      makeInventoryUpdateStockSchema(false).safeParse({
        ...base,
        entryPrice: 0,
      }).success,
    ).toBe(false);
  });
});
