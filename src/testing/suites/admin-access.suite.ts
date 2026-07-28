import { defineSuite, expect } from "@/testing/harness";
import {
  filterAssignableSections,
  isAdminOnlyNode,
  isAdminOnlyRoles,
  isAdminRoute,
} from "@/lib/admin-access";
import { buildPermSections } from "@/lib/worker-permissions";
import { canAccessNode, collectAllowedUrls } from "@/lib/navigation-access";
import type {
  SectionApiMenu,
  SectionApiNode,
  SectionApiSubmenu,
} from "@/lib/types/navigation";

const ADMIN = "5";
const OWNER = "4";

function submenu(
  p: Partial<SectionApiSubmenu> & { url: string },
): SectionApiSubmenu {
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

function section(
  p: Partial<SectionApiNode> & { menus: SectionApiMenu[] },
): SectionApiNode {
  return {
    id: p.name ?? "sec",
    icon: "Circle",
    name: "sec",
    badge: null,
    active: true,
    roles: [],
    plans: null,
    ...p,
  };
}

export const adminAccessSuite = defineSuite(
  "admin-access · aislamiento del panel de Administración",
  ({ test }) => {
    test(
      "isAdminRoute: detecta el segmento admin en cualquier prefijo",
      () => {
        expect(isAdminRoute("/dashboard/admin/menus")).toBe(true);
        expect(isAdminRoute("/admin/assign-plans")).toBe(true);
        expect(isAdminRoute("/dashboard/admin")).toBe(true);
        expect(isAdminRoute("/dashboard/admin/lo-que-sea/futuro")).toBe(true);
      },
      "La frontera es el segmento de ruta `admin`, no una lista de rutas conocidas: cualquier módulo que se cree mañana bajo /dashboard/admin queda detectado sin tocar código.",
    );

    test(
      "isAdminRoute: no confunde segmentos que solo empiezan por 'admin'",
      () => {
        expect(isAdminRoute("/dashboard/administradores")).toBe(false);
        expect(isAdminRoute("/dashboard/business/admin-notes")).toBe(false);
        expect(isAdminRoute("")).toBe(false);
        expect(isAdminRoute(null)).toBe(false);
      },
      "Se compara el segmento completo, así que una ruta legítima llamada 'administradores' o 'admin-notes' no se bloquea por accidente.",
    );

    test(
      "isAdminOnlyRoles: solo cuando TODOS los roles son admin",
      () => {
        expect(isAdminOnlyRoles([ADMIN])).toBe(true);
        expect(isAdminOnlyRoles([ADMIN, ADMIN])).toBe(true);
        expect(isAdminOnlyRoles([ADMIN, OWNER])).toBe(false);
        expect(isAdminOnlyRoles([])).toBe(false);
        expect(isAdminOnlyRoles(null)).toBe(false);
      },
      "roles=['5'] restringe a admin; roles=['4','5'] no, porque también habilita al dueño de negocio. Sin roles = sin restricción (visible para todos), igual que en isVisibleForRole.",
    );

    test(
      "isAdminOnlyNode: basta con uno de los dos criterios",
      () => {
        expect(isAdminOnlyNode({ roles: [ADMIN], url: "/dashboard/x" })).toBe(
          true,
        );
        expect(isAdminOnlyNode({ roles: [], url: "/dashboard/admin/x" })).toBe(
          true,
        );
        expect(isAdminOnlyNode({ roles: [OWNER], url: "/dashboard/x" })).toBe(
          false,
        );
      },
      "Rol declarado y ruta son criterios independientes: si al crear un módulo admin se olvida marcar el rol, la URL lo delata, y viceversa.",
    );

    test(
      "filterAssignableSections: descarta la sección admin con TODO su contenido",
      () => {
        const sections = [
          section({
            name: "Administración",
            roles: [ADMIN],
            menus: [
              // Menú sin roles ni URL admin: sería asignable si no heredara.
              menu({ url: "/dashboard/reportes-internos" }),
            ],
          }),
          section({ name: "Negocio", menus: [menu({ url: "/dashboard/ventas" })] }),
        ];

        const result = filterAssignableSections(sections);
        expect(result.length).toBe(1);
        expect(result[0].name).toBe("Negocio");
      },
      "Caso central: un menú creado dentro de la sección Administración queda fuera aunque no tenga roles propios ni URL /admin. La restricción se hereda de la sección, así que no hay que acordarse de configurar cada menú nuevo.",
    );

    test(
      "filterAssignableSections: poda menús y submenús admin dentro de una sección normal",
      () => {
        const sections = [
          section({
            name: "Negocio",
            menus: [
              menu({ url: "/dashboard/admin/menus" }),
              menu({ url: "/dashboard/config", roles: [ADMIN] }),
              menu({
                url: "/dashboard/ventas",
                submenus: [
                  submenu({ url: "/dashboard/ventas/lista" }),
                  submenu({ url: "/dashboard/admin/support" }),
                ],
              }),
            ],
          }),
        ];

        const result = filterAssignableSections(sections);
        expect(result[0].menus.length).toBe(1);
        expect(result[0].menus[0].url).toBe("/dashboard/ventas");
        expect(result[0].menus[0].submenus.length).toBe(1);
        expect(result[0].menus[0].submenus[0].url).toBe("/dashboard/ventas/lista");
      },
      "El filtro también actúa nivel a nivel: un menú o submenú administrativo colgado de una sección normal se poda igual, por rol o por ruta.",
    );

    test(
      "filterAssignableSections: descarta secciones que quedan vacías",
      () => {
        const sections = [
          section({
            name: "Solo admin dentro",
            menus: [menu({ url: "/dashboard/admin/assign-plans" })],
          }),
        ];
        expect(filterAssignableSections(sections)).toEqual([]);
      },
      "Si al podar no queda ningún menú asignable, la sección entera desaparece del selector en vez de pintar un grupo vacío.",
    );

    test(
      "buildPermSections: el selector de permisos no ofrece nada de Administración",
      () => {
        const sections = [
          section({
            id: "sec-admin",
            name: "Administración",
            roles: [ADMIN],
            menus: [menu({ id: "m-nuevo", url: "/dashboard/admin/lo-nuevo" })],
          }),
          section({
            id: "sec-negocio",
            name: "Negocio",
            menus: [menu({ id: "m-ventas", url: "/dashboard/ventas" })],
          }),
        ];

        const result = buildPermSections(sections);
        expect(result.length).toBe(1);
        expect(result[0].idSection).toBe("sec-negocio");
        expect(result[0].menus[0].idMenu).toBe("m-ventas");
      },
      "Comprobación de extremo a extremo del formulario de trabajadores: por más módulos que se agreguen a Administración, el acordeón de permisos solo lista lo asignable.",
    );

    test(
      "canAccessNode: la ruta /admin bloquea aunque no haya roles marcados",
      () => {
        const nodo = { roles: [], url: "/dashboard/admin/lo-nuevo" };
        expect(canAccessNode(nodo, OWNER)).toBe(false);
        expect(canAccessNode(nodo, ADMIN)).toBe(true);
      },
      "Red de seguridad del sidebar: si al crear un menú administrativo se olvida marcar el rol, su ruta lo oculta igual para el dueño, y el admin lo sigue viendo con normalidad.",
    );

    test(
      "collectAllowedUrls: un dueño no puede abrir rutas admin sin roles marcados",
      () => {
        const sections = [
          section({
            name: "Negocio",
            menus: [
              menu({ url: "/dashboard/ventas" }),
              menu({ url: "/dashboard/admin/lo-nuevo" }),
            ],
          }),
        ];
        expect(collectAllowedUrls(sections, OWNER)).toEqual([
          "/dashboard/ventas",
        ]);
        expect(collectAllowedUrls(sections, ADMIN)).toEqual([
          "/dashboard/ventas",
          "/dashboard/admin/lo-nuevo",
        ]);
      },
      "Lo que alimenta al guard de rutas y al aterrizaje post-login usa el mismo criterio, así que 'lo que se ve en el menú' sigue siendo igual a 'lo que se puede abrir por URL'.",
    );
  },
  {
    description:
      "Administración es solo-admin: nada de esa sección puede asignarse a trabajadores.",
  },
);
