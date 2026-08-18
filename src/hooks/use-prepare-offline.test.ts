// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { OFFLINE_RESOURCES, neededResources } from "./use-prepare-offline";

const ids = (list: { id: string }[]) => list.map((r) => r.id);

describe("qué se prepara para trabajar sin conexión", () => {
  it("al dueño se le prepara todo", () => {
    const result = neededResources(OFFLINE_RESOURCES, {
      enforce: false,
      allowedUrls: [],
    });

    expect(ids(result)).toEqual(ids(OFFLINE_RESOURCES));
  });

  it("a un trabajador que vende se le prepara el catálogo", () => {
    const result = neededResources(OFFLINE_RESOURCES, {
      enforce: true,
      allowedUrls: ["/dashboard/business/sales"],
    });

    expect(ids(result)).toContain("products");
    expect(ids(result)).toContain("sales");
  });

  /**
   * No es una optimización: descargarle a alguien datos de pantallas que no
   * puede abrir los deja guardados en su dispositivo, que es justo lo que el
   * control de accesos existe para evitar.
   */
  it("a un trabajador sin acceso a ventas no se le descarga el catálogo", () => {
    const result = neededResources(OFFLINE_RESOURCES, {
      enforce: true,
      allowedUrls: ["/dashboard/business/expenses"],
    });

    expect(ids(result)).not.toContain("products");
    expect(ids(result)).not.toContain("sales");
  });

  /**
   * Sin tasas no se puede cobrar en divisa, y eso hace falta en cualquier
   * pantalla donde se maneje dinero.
   */
  it("las tasas de cambio se preparan siempre", () => {
    const result = neededResources(OFFLINE_RESOURCES, {
      enforce: true,
      allowedUrls: [],
    });

    expect(ids(result)).toEqual(["rates"]);
  });
});
