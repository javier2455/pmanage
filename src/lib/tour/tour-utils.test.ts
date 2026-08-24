import { describe, expect, it } from "vitest";
import {
  filterSteps,
  isAdminRoute,
  isSameRoute,
  isTourAvailable,
  normalizeRoute,
  routeForStep,
  sectionTourFor,
  sidebarItemSelector,
  type TourFilterContext,
} from "./tour-utils";
import { TOURS, closingStepFor } from "./tours";
import type { PlanFeatureKey } from "@/lib/plan-features";
import { requiredFeatureFor } from "@/lib/pro-gates";
import type { TourDefinition, TourStep } from "./types";

/**
 * Tests de la lógica pura de las guías. Lo que toca el DOM (esperar al ancla,
 * pintar el popover) vive en el motor y no se prueba aquí.
 */

function contextWith(overrides: Partial<TourFilterContext> = {}): TourFilterContext {
  return {
    hasFeature: () => true,
    allowsSidebarSteps: true,
    isRouteAllowed: () => true,
    ...overrides,
  };
}

function step(id: string, extra: Partial<TourStep> = {}): TourStep {
  return { id, title: id, description: id, ...extra };
}

describe("normalizeRoute · barra final de trailingSlash", () => {
  it("quita la barra final", () => {
    expect(normalizeRoute("/dashboard/business/sales/")).toBe(
      "/dashboard/business/sales",
    );
  });

  it("deja la raíz intacta", () => {
    expect(normalizeRoute("/")).toBe("/");
  });

  it("considera iguales la ruta con y sin barra", () => {
    expect(isSameRoute("/dashboard/", "/dashboard")).toBe(true);
    expect(isSameRoute("/dashboard", "/dashboard/business")).toBe(false);
  });
});

describe("routeForStep · herencia de ruta", () => {
  const steps = [
    step("a", { route: "/dashboard" }),
    step("b"),
    step("c", { route: "/dashboard/business/sales" }),
    step("d"),
  ];

  it("usa la ruta declarada por el paso", () => {
    expect(routeForStep(steps, 2, "/fallback")).toBe(
      "/dashboard/business/sales",
    );
  });

  it("hereda la del paso anterior que la declaró", () => {
    expect(routeForStep(steps, 1, "/fallback")).toBe("/dashboard");
    expect(routeForStep(steps, 3, "/fallback")).toBe(
      "/dashboard/business/sales",
    );
  });

  it("cae al fallback si ningún paso declara ruta", () => {
    expect(routeForStep([step("x")], 0, "/fallback")).toBe("/fallback");
  });
});

describe("sidebarItemSelector · anclaje por href", () => {
  it("acepta la url con y sin barra final y no usa prefijo", () => {
    const selector = sidebarItemSelector("/dashboard/business/products");
    expect(selector).toContain('[href="/dashboard/business/products"]');
    expect(selector).toContain('[href="/dashboard/business/products/"]');
    /* `href^=` haría que products/import también encajara con products. */
    expect(selector).not.toContain("href^=");
  });
});

describe("filterSteps · capacidades del plan", () => {
  const steps = [
    step("libre", { route: "/dashboard" }),
    step("exportar", { route: "/dashboard", feature: "exports" }),
    /* Sin `feature`: la capacidad la exige la ruta vía PRO_ROUTES. */
    step("equipo", { route: "/dashboard/business/workers" }),
  ];

  it("deja pasar todo cuando el plan lo concede", () => {
    expect(filterSteps(steps, "/dashboard", contextWith())).toHaveLength(3);
  });

  it("descarta el paso cuya capacidad explícita falta", () => {
    const ctx = contextWith({ hasFeature: (k) => k !== "exports" });
    const ids = filterSteps(steps, "/dashboard", ctx).map((s) => s.id);
    expect(ids).toEqual(["libre", "equipo"]);
  });

  it("descarta el paso por la capacidad implícita de su ruta", () => {
    const ctx = contextWith({ hasFeature: (k) => k !== "team" });
    const ids = filterSteps(steps, "/dashboard", ctx).map((s) => s.id);
    expect(ids).toEqual(["libre", "exportar"]);
  });

  it("hereda la ruta al derivar la capacidad implícita", () => {
    const heredado = [
      step("entrada", { route: "/dashboard/business/workers" }),
      step("hijo"),
    ];
    const ctx = contextWith({ hasFeature: (k) => k !== "team" });
    expect(filterSteps(heredado, "/dashboard", ctx)).toHaveLength(0);
  });
});

describe("filterSteps · permisos y contexto", () => {
  it("descarta las rutas que el trabajador no tiene permitidas", () => {
    const steps = [
      step("permitido", { route: "/dashboard" }),
      step("bloqueado", { route: "/dashboard/business/sales" }),
    ];
    const ctx = contextWith({
      isRouteAllowed: (route) => route === "/dashboard",
    });
    const ids = filterSteps(steps, "/dashboard", ctx).map((s) => s.id);
    expect(ids).toEqual(["permitido"]);
  });

  it("descarta los pasos de menú lateral cuando no se permiten (móvil)", () => {
    const steps = [
      step("menu", { route: "/dashboard", needsSidebar: true }),
      step("normal", { route: "/dashboard" }),
    ];
    const ctx = contextWith({ allowsSidebarSteps: false });
    const ids = filterSteps(steps, "/dashboard", ctx).map((s) => s.id);
    expect(ids).toEqual(["normal"]);
  });
});

describe("isTourAvailable", () => {
  const tour: TourDefinition = {
    id: "x",
    kind: "seccion",
    title: "x",
    description: "x",
    entryRoute: "/dashboard/business/workers",
    steps: [step("a", { route: "/dashboard/business/workers" })],
  };

  it("oculta el tour cuando su ruta de entrada no está concedida", () => {
    const ctx = contextWith({ hasFeature: (k) => k !== "team" });
    expect(isTourAvailable(tour, ctx)).toBe(false);
  });

  it("oculta el tour que se queda sin pasos", () => {
    const vacio: TourDefinition = {
      ...tour,
      entryRoute: "/dashboard",
      steps: [step("a", { route: "/dashboard", feature: "analytics" })],
    };
    const ctx = contextWith({ hasFeature: (k) => k !== "analytics" });
    expect(isTourAvailable(vacio, ctx)).toBe(false);
  });

  it("ofrece el tour cuando todo está concedido", () => {
    expect(isTourAvailable(tour, contextWith())).toBe(true);
  });
});

describe("sectionTourFor · guía de la vista actual", () => {
  it("encuentra el tour de la ruta, con o sin barra final", () => {
    const found = sectionTourFor("/dashboard/business/products/", TOURS);
    expect(found?.id).toBe("seccion-productos");
  });

  it("prefiere la entrada más específica", () => {
    const found = sectionTourFor("/dashboard/business/products/create", TOURS);
    expect(found?.id).toBe("seccion-producto-crear");
  });

  it("devuelve null si la vista no tiene guía", () => {
    expect(sectionTourFor("/dashboard/no-access", TOURS)).toBeNull();
  });

  it("no devuelve tours que no sean de sección", () => {
    const found = sectionTourFor("/dashboard", TOURS);
    expect(found?.kind).toBe("seccion");
  });
});

describe("catálogo · invariantes", () => {
  const ALL_FEATURES = contextWith();

  it("ningún tour lleva a la sección de administración", () => {
    for (const tour of TOURS) {
      expect(isAdminRoute(tour.entryRoute)).toBe(false);
      tour.steps.forEach((_, index) => {
        const route = routeForStep(tour.steps, index, tour.entryRoute);
        expect(isAdminRoute(route)).toBe(false);
      });
    }
  });

  it("no hay tours con id repetido", () => {
    const ids = TOURS.map((tour) => tour.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todos los pasos declaran una ruta resoluble dentro del dashboard", () => {
    for (const tour of TOURS) {
      tour.steps.forEach((_, index) => {
        const route = routeForStep(tour.steps, index, tour.entryRoute);
        expect(route.startsWith("/dashboard")).toBe(true);
        expect(route.endsWith("/")).toBe(false);
      });
    }
  });

  it("todos los tours siguen teniendo pasos con el plan completo", () => {
    for (const tour of TOURS) {
      expect(filterSteps(tour.steps, tour.entryRoute, ALL_FEATURES).length)
        .toBeGreaterThan(0);
    }
  });

  it("el tour completo existe y cruza varias rutas", () => {
    const full = TOURS.find((tour) => tour.kind === "completo");
    expect(full).toBeDefined();
    const routes = new Set(
      full!.steps.map((_, index) =>
        routeForStep(full!.steps, index, full!.entryRoute),
      ),
    );
    expect(routes.size).toBeGreaterThan(5);
  });

  it("toda guía abre presentando la vista, sin ancla", () => {
    /* El primer paso explica para qué sirve la pantalla y se pinta centrado;
       los detalles vienen después. Un `element` aquí sería un paso específico
       colado al principio. */
    for (const tour of TOURS) {
      expect(tour.steps[0]?.element, `${tour.id} empieza anclado`).toBeUndefined();
    }
  });

  it("toda guía cierra con una despedida centrada y en su misma ruta", () => {
    for (const tour of TOURS) {
      const cierre = closingStepFor(tour);
      /* Sin ancla se pinta centrado, y sin ruta hereda la del último paso: la
         despedida no debe provocar una navegación extra al terminar. */
      expect(cierre.element).toBeUndefined();
      expect(cierre.route).toBeUndefined();
      const conCierre = [...tour.steps, cierre];
      expect(
        routeForStep(conCierre, conCierre.length - 1, tour.entryRoute),
      ).toBe(routeForStep(tour.steps, tour.steps.length - 1, tour.entryRoute));
    }
  });

  it("las guías de sección van en el orden del menú lateral", () => {
    /* El catálogo lista el array tal cual, así que buscar una guía se parece a
       buscar la sección en el menú. Si alguien reordena, este test lo obliga a
       decidirlo a conciencia. */
    const ORDEN_MENU = [
      "/dashboard",
      "/dashboard/business/categories",
      "/dashboard/business/products",
      "/dashboard/business/sales",
      "/dashboard/business/expenses",
      "/dashboard/business/inventory",
      "/dashboard/business/workers",
      "/dashboard/business/providers",
      "/dashboard/business/currency-accounts",
      "/dashboard/accounting-close/daily",
      "/dashboard/accounting-close/monthly",
      "/dashboard/exchange-rate",
    ];
    const secciones = TOURS.filter((tour) => tour.kind === "seccion");
    const posiciones = ORDEN_MENU.map((route) =>
      secciones.findIndex((tour) => tour.entryRoute === route),
    );
    expect(posiciones.every((index) => index >= 0)).toBe(true);
    for (let i = 1; i < posiciones.length; i++) {
      expect(
        posiciones[i],
        `${ORDEN_MENU[i]} debe ir después de ${ORDEN_MENU[i - 1]}`,
      ).toBeGreaterThan(posiciones[i - 1]);
    }
  });

  it("solo declara capacidades del catálogo de planes", () => {
    const known = new Set<PlanFeatureKey>([
      "sales",
      "expenses",
      "dailyClose",
      "exchangeRates",
      "priceHistory",
      "inventoryHistory",
      "globalSearch",
      "statsPanel",
      "emailNotifications",
      "smsNotifications",
      "monthlyClose",
      "exports",
      "providers",
      "team",
      "priceComparator",
      "whatsappNotifications",
      "analytics",
      "stockAlerts",
      "prioritySupport",
    ]);
    for (const tour of TOURS) {
      if (tour.feature) expect(known.has(tour.feature)).toBe(true);
      for (const s of tour.steps) {
        if (s.feature) expect(known.has(s.feature)).toBe(true);
      }
    }
  });
});

describe("pasos promocionales", () => {
  const SIN_NADA = contextWith({ hasFeature: () => false });
  const CON_TODO = contextWith();

  it("solo se muestran a quien NO tiene la capacidad", () => {
    const steps = [
      step("normal", { route: "/dashboard" }),
      step("promo", { upsellFor: "team" }),
    ];
    expect(
      filterSteps(steps, "/dashboard", SIN_NADA).map((s) => s.id),
    ).toEqual(["normal", "promo"]);
    expect(
      filterSteps(steps, "/dashboard", CON_TODO).map((s) => s.id),
    ).toEqual(["normal", "promo"].filter((id) => id !== "promo"));
  });

  it("ninguno hereda una ruta protegida por plan", () => {
    /* Es el fallo que rompería el recorrido: si un paso promocional cayera en
       una ruta Pro, se filtraría junto a ella y quien no tiene el plan no
       llegaría a enterarse de que esa sección existe. Peor aún, si se colara,
       `RouteGuard` expulsaría al usuario a mitad del tour. */
    for (const tour of TOURS) {
      tour.steps.forEach((s, index) => {
        if (!s.upsellFor) return;
        expect(s.route, `${s.id} no debe declarar ruta propia`).toBeUndefined();
        const route = routeForStep(tour.steps, index, tour.entryRoute);
        expect(
          requiredFeatureFor(route),
          `${s.id} hereda la ruta protegida ${route}`,
        ).toBeNull();
      });
    }
  });

  it("un plan sin capacidades recorre el sistema y ve qué se está perdiendo", () => {
    const completo = TOURS.find((tour) => tour.kind === "completo")!;
    const pasos = filterSteps(completo.steps, completo.entryRoute, SIN_NADA);
    const promocionales = pasos.filter((s) => s.upsellFor);
    expect(pasos.length).toBeGreaterThan(20);
    expect(promocionales.length).toBeGreaterThan(0);
    /* Y no queda ningún paso que exija algo que ese plan no concede. */
    for (const s of pasos) {
      if (s.upsellFor) continue;
      expect(s.feature).toBeUndefined();
    }
  });

  it("un plan completo no ve ningún paso promocional", () => {
    const completo = TOURS.find((tour) => tour.kind === "completo")!;
    const pasos = filterSteps(completo.steps, completo.entryRoute, CON_TODO);
    expect(pasos.some((s) => s.upsellFor)).toBe(false);
  });
});

describe("cobertura del sistema", () => {
  it("hay guía para la difusión del listado de productos", () => {
    const guia = TOURS.find(
      (tour) => tour.entryRoute === "/dashboard/broadcast/product-list",
    );
    expect(guia).toBeDefined();
    expect(guia!.kind).toBe("seccion");
  });

  it("cada guía de sección cubre una ruta distinta", () => {
    const rutas = TOURS.filter((tour) => tour.kind === "seccion").map(
      (tour) => tour.entryRoute,
    );
    expect(new Set(rutas).size).toBe(rutas.length);
  });
});
