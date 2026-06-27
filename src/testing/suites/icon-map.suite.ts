import { defineSuite, expect } from "@/testing/harness";
import { ICON_MAP, resolveIcon } from "@/lib/icon-map";

export const iconMapSuite = defineSuite(
  "icon-map · resolución de iconos",
  ({ test }) => {
    test(
      "resuelve un nombre conocido a su icono",
      () => {
        expect(resolveIcon("Wallet")).toBe(ICON_MAP.Wallet);
        expect(resolveIcon("Home")).toBe(ICON_MAP.Home);
      },
      "Para un nombre presente en ICON_MAP (como llega desde el backend en el menú), devuelve exactamente ese componente de icono. Así el sidebar pinta el icono correcto por nombre.",
    );

    test(
      "nombre desconocido → icono de fallback",
      () => {
        const fallback = resolveIcon(null);
        expect(resolveIcon("NoExisteEsteIcono")).toBe(fallback);
      },
      "Un nombre que no está en el mapa devuelve el mismo icono de fallback (Circle) que un valor nulo. El menú nunca queda sin icono aunque el backend mande un nombre no soportado.",
    );

    test(
      "null/undefined → fallback",
      () => {
        const fallback = resolveIcon(null);
        expect(resolveIcon(undefined)).toBe(fallback);
        expect(resolveIcon("")).toBe(fallback);
      },
      "Sin nombre (null, undefined o cadena vacía) devuelve el icono de fallback en vez de romper el render del menú.",
    );

    test(
      "el icono conocido NO es el fallback",
      () => {
        expect(resolveIcon("Wallet")).not.toBe(resolveIcon(null));
      },
      "Verifica que un icono real resuelto es distinto del fallback: confirma que la resolución por nombre realmente funciona y no cae siempre al icono por defecto.",
    );
  },
  { description: "Mapea nombres de icono del backend a componentes Lucide." },
);
