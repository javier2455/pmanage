import { defineSuite, expect } from "@/testing/harness";
import { roleIdFromName } from "@/lib/roles";

export const normalizationSuite = defineSuite(
  "normalization · roles",
  ({ test }) => {
    test(
      "roleIdFromName: mapea nombres conocidos a su id",
      () => {
        expect(roleIdFromName("admin")).toBe("5");
        expect(roleIdFromName("business_owner")).toBe("4");
        expect(roleIdFromName("client")).toBe("6");
      },
      "getMe() devuelve el rol como nombre, pero las secciones del sidebar se filtran por id numérico. Esta función traduce nombre → id: admin→'5', business_owner→'4', client→'6'.",
    );

    test(
      "roleIdFromName: tolera mayúsculas y espacios",
      () => {
        expect(roleIdFromName(" ADMIN ")).toBe("5");
      },
      "Normaliza (trim + minúsculas) antes de mapear, para que ' ADMIN ' se traduzca igual que 'admin' → '5'.",
    );

    test(
      "roleIdFromName: rol desconocido → cadena vacía",
      () => {
        expect(roleIdFromName("superuser")).toBe("");
      },
      "Un rol no mapeado ('superuser') devuelve '' — un id que no coincidirá con ningún 'roles' de sección, así que no concede acceso por error.",
    );
  },
  { description: "Mapeo de nombres de rol a su id." },
);
