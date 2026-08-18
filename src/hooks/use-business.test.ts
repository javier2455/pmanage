// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { filterCatalogBySearch } from "./use-business";
import type { BusinessWithProducts } from "@/lib/types/business";

const product = (name: string, category?: string) =>
  ({
    id: name,
    businessId: "b1",
    price: "100",
    productId: name,
    stock: 1,
    updatedAt: new Date(),
    category: category ? { id: "c", name: category } : null,
    product: { id: name, name },
  }) as unknown as BusinessWithProducts;

const names = (list: BusinessWithProducts[]) => list.map((bp) => bp.product.name);

describe("búsqueda en el catálogo guardado", () => {
  it("encuentra por una parte del nombre", () => {
    const catalog = [product("Café molido"), product("Azúcar")];

    expect(names(filterCatalogBySearch(catalog, "caf"))).toEqual(["Café molido"]);
  });

  /**
   * Quien vende escribe con la prisa del mostrador: ni mayúsculas ni espacios
   * cuidados. Que eso decida si aparece el producto sería absurdo.
   */
  it("no distingue mayúsculas ni espacios de sobra", () => {
    const catalog = [product("Café molido")];

    expect(names(filterCatalogBySearch(catalog, "  CAFÉ "))).toEqual([
      "Café molido",
    ]);
  });

  it("también encuentra por categoría", () => {
    const catalog = [product("Café molido", "Bebidas"), product("Pan")];

    expect(names(filterCatalogBySearch(catalog, "bebida"))).toEqual([
      "Café molido",
    ]);
  });

  /**
   * Borrar lo tecleado devuelve el catálogo entero. Devolver una lista vacía
   * dejaría la pantalla de venta en blanco al vaciar el buscador.
   */
  it("sin término devuelve todo", () => {
    const catalog = [product("Café molido"), product("Azúcar")];

    expect(filterCatalogBySearch(catalog, "   ")).toHaveLength(2);
  });
});
