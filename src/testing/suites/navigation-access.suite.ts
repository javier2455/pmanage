import { defineSuite, expect } from "@/testing/harness";
import { collectAllowedUrls, isVisibleForRole } from "@/lib/navigation-access";
import type {
  SectionApiMenu,
  SectionApiNode,
  SectionApiSubmenu,
} from "@/lib/types/navigation";

const ADMIN = "5";
const OWNER = "4";

function submenu(p: Partial<SectionApiSubmenu> & { url: string }): SectionApiSubmenu {
  return {
    id: p.url,
    icon: "Circle",
    name: p.url,
    badge: null,
    active: true,
    roles: [],
    plans: null,
    ...p,
  };
}

function menu(p: Partial<SectionApiMenu> & { url: string }): SectionApiMenu {
  return {
    id: p.url,
    icon: "Circle",
    name: p.url,
    badge: null,
    active: true,
    roles: [],
    plans: null,
    submenus: [],
    ...p,
  };
}

function section(p: Partial<SectionApiNode> & { menus: SectionApiMenu[] }): SectionApiNode {
  return {
    id: "sec",
    icon: "Circle",
    name: "sec",
    badge: null,
    active: true,
    roles: [],
    plans: null,
    ...p,
  };
}

export const navigationAccessSuite = defineSuite(
  "navigation-access · visibilidad por rol",
  ({ test }) => {
    test(
      "isVisibleForRole: roles vacío/null → visible para todos",
      () => {
        expect(isVisibleForRole([], ADMIN)).toBe(true);
        expect(isVisibleForRole(null, ADMIN)).toBe(true);
        expect(isVisibleForRole(undefined, ADMIN)).toBe(true);
      },
      "Regla de negocio: un elemento de menú sin roles asignados (lista vacía, null o undefined) es visible para todos los roles. La ausencia de restricción significa 'sin restricción'.",
    );

    test(
      "isVisibleForRole: respeta la lista de roles",
      () => {
        expect(isVisibleForRole([ADMIN], ADMIN)).toBe(true);
        expect(isVisibleForRole([OWNER], ADMIN)).toBe(false);
      },
      "Si hay roles asignados, el elemento solo es visible para los roles de la lista. roleId '5' (admin) ve un menú [admin], pero no uno restringido a [owner].",
    );

    test(
      "collectAllowedUrls: sin secciones → []",
      () => {
        expect(collectAllowedUrls(null, ADMIN)).toEqual([]);
        expect(collectAllowedUrls(undefined, ADMIN)).toEqual([]);
      },
      "Sin árbol de secciones (null/undefined, p. ej. aún cargando), no hay ninguna URL permitida: devuelve lista vacía sin romper.",
    );

    test(
      "collectAllowedUrls: recoge urls de menús y submenús",
      () => {
        const sections = [
          section({
            menus: [
              menu({ url: "/dashboard/a" }),
              menu({
                url: "/dashboard/b",
                submenus: [submenu({ url: "/dashboard/b/x" })],
              }),
            ],
          }),
        ];
        expect(collectAllowedUrls(sections, ADMIN)).toEqual([
          "/dashboard/a",
          "/dashboard/b",
          "/dashboard/b/x",
        ]);
      },
      "Aplana el árbol de navegación (sección → menús → submenús) en una lista de URLs navegables, incluyendo tanto las URLs de menús como las de sus submenús.",
    );

    test(
      "collectAllowedUrls: omite secciones/menús inactivos",
      () => {
        const sections = [
          section({ active: false, menus: [menu({ url: "/oculto" })] }),
          section({
            menus: [
              menu({ url: "/activo" }),
              menu({ url: "/inactivo", active: false }),
            ],
          }),
        ];
        expect(collectAllowedUrls(sections, ADMIN)).toEqual(["/activo"]);
      },
      "Los elementos con active=false se omiten en cualquier nivel: una sección inactiva oculta todos sus menús, y un menú inactivo se salta aunque su sección esté activa.",
    );

    test(
      "collectAllowedUrls: filtra por rol en cada nivel",
      () => {
        const sections = [
          section({
            menus: [
              menu({ url: "/solo-admin", roles: [ADMIN] }),
              menu({ url: "/solo-owner", roles: [OWNER] }),
            ],
          }),
        ];
        expect(collectAllowedUrls(sections, ADMIN)).toEqual(["/solo-admin"]);
      },
      "Aplica el filtro de rol al recolectar: un admin solo obtiene las URLs visibles para su rol. /solo-owner se excluye. Garantiza que 'lo que se ve en el menú' == 'lo que se puede abrir por URL'.",
    );

    test(
      "collectAllowedUrls: ignora url vacía o '#'",
      () => {
        const sections = [
          section({
            menus: [
              menu({
                url: "#",
                submenus: [submenu({ url: "/dashboard/real" })],
              }),
            ],
          }),
        ];
        expect(collectAllowedUrls(sections, ADMIN)).toEqual(["/dashboard/real"]);
      },
      "Un menú con url '#' (placeholder de menú contenedor, sin destino propio) no aporta URL, pero sus submenús sí se recolectan. Resultado: solo /dashboard/real.",
    );
  },
  { description: "Deriva qué URLs puede abrir un rol (sidebar = guard)." },
);
