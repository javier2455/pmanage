import { describe, expect, it } from "vitest";
import { categorySelectionForInput } from "./category-selection";

const CATEGORIES = [
  { id: "c1", name: "Bebidas" },
  { id: "c2", name: "Snacks" },
];

describe("categorySelectionForInput", () => {
  it("sin categorías, lo escrito se toma como categoría nueva", () => {
    expect(categorySelectionForInput("Bebidas", [], null)).toEqual({
      categoryId: null,
      categoryName: "Bebidas",
    });
  });

  it("no elige nada mientras el texto coincide parcialmente (está buscando)", () => {
    expect(categorySelectionForInput("Beb", CATEGORIES, null)).toEqual({
      categoryId: null,
      categoryName: null,
    });
  });

  it("elige la categoría existente cuando el nombre coincide exacto", () => {
    expect(categorySelectionForInput("  bebidas ", CATEGORIES, null)).toEqual({
      categoryId: "c1",
      categoryName: null,
    });
  });

  it("propone crear cuando no coincide con ninguna", () => {
    expect(categorySelectionForInput("Postres", CATEGORIES, null)).toEqual({
      categoryId: null,
      categoryName: "Postres",
    });
  });

  it("conserva la selección cuando el texto es el de la opción elegida", () => {
    expect(categorySelectionForInput("Bebidas", CATEGORIES, "Bebidas")).toBe(
      "keep",
    );
    // Caso de una categoría nueva ya confirmada con «Crear …».
    expect(categorySelectionForInput("Postres", CATEGORIES, "Postres")).toBe(
      "keep",
    );
  });

  it("limpia la selección al vaciar el input", () => {
    expect(categorySelectionForInput("   ", CATEGORIES, "Bebidas")).toEqual({
      categoryId: null,
      categoryName: null,
    });
  });
});
