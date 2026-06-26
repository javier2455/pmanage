import { defineSuite, expect } from "@/testing/harness";
import { normalizePlanKey } from "@/lib/plans-data";
import { roleIdFromName } from "@/lib/roles";

export const normalizationSuite = defineSuite(
  "normalization · roles y claves de plan",
  ({ test }) => {
    test(
      "normalizePlanKey: minúsculas y sin tildes",
      () => {
        expect(normalizePlanKey("Básico")).toBe("basico");
        expect(normalizePlanKey("PRO")).toBe("pro");
        expect(normalizePlanKey("Gratuito")).toBe("gratuito");
      },
      "Normaliza el nombre/tipo de plan para comparar sin depender de mayúsculas ni tildes: 'Básico' → 'basico', 'PRO' → 'pro'. Permite comparar planes que el backend escribe de formas distintas.",
    );

    test(
      "normalizePlanKey: recorta espacios",
      () => {
        expect(normalizePlanKey("  premium  ")).toBe("premium");
      },
      "Recorta espacios al inicio/fin antes de normalizar, para que '  premium  ' coincida con 'premium'.",
    );

    test(
      "normalizePlanKey: null/undefined → cadena vacía",
      () => {
        expect(normalizePlanKey(null)).toBe("");
        expect(normalizePlanKey(undefined)).toBe("");
      },
      "Entrada ausente (null/undefined) produce cadena vacía en vez de romper: permite usar la función sobre datos opcionales sin chequeos previos.",
    );

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
  { description: "Normalización de strings de plan y mapeo de roles." },
);
