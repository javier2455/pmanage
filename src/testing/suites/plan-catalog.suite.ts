import { defineSuite, expect } from "@/testing/harness";
import {
  fallbackCatalog,
  planToCatalogEntry,
  selectablePlans,
} from "@/lib/plan-catalog";
import { PLAN_FEATURES } from "@/lib/plan-features";
import type { PlanResponse } from "@/lib/types/plans";

/** Plan tal y como lo devuelve `GET /plans`; cada test altera lo que prueba. */
function apiPlan(overrides: Partial<PlanResponse> = {}): PlanResponse {
  return {
    id: "plan-1",
    code: "pro",
    name: "Pro",
    description: "Para negocios en crecimiento",
    type: "premium",
    tier: 2,
    price: 15,
    currency: "USD",
    priceMonthly: 15,
    priceYearly: 144,
    maxProducts: 500,
    maxBusinesses: 3,
    maxWorkers: 5,
    features: null,
    trialDays: null,
    isActive: true,
    isPublic: true,
    displayOrder: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export const planCatalogSuite = defineSuite(
  "plan-catalog · vitrina derivada del plan",
  ({ test }) => {
    test(
      "mensualiza el precio anual para poder compararlo con el mensual",
      () => {
        const entry = planToCatalogEntry(apiPlan({ priceYearly: 144 }));
        expect(entry.yearlyPricePerMonth).toBe(12);
        expect(entry.yearlyTotal).toBe(144);
      },
      "En la BD el precio anual es el importe total del año (144). La vitrina compara precios 'al mes' en ambas modalidades, así que muestra 12. Guardar el total es lo que permite registrar en el histórico lo realmente cobrado.",
    );

    test(
      "un plan sin precio anual no inventa un equivalente mensual",
      () => {
        const entry = planToCatalogEntry(apiPlan({ priceYearly: 0 }));
        expect(entry.yearlyPricePerMonth).toBe(0);
      },
      "Dividir 0 entre 12 daría 0, pero el guard explícito evita mostrar NaN si el campo llegara ausente o nulo desde una respuesta antigua.",
    );

    test(
      "la lista de la vitrina se deriva de las capacidades declaradas",
      () => {
        const entry = planToCatalogEntry(
          apiPlan({
            tier: 1,
            features: { monthlyClose: true, providers: false, sales: true },
          }),
        );

        const monthlyClose = entry.features.find(
          (f) => f.text === "Cierre contable mensual",
        );
        const providers = entry.features.find(
          (f) => f.text === "Gestión de proveedores",
        );

        expect(monthlyClose?.included).toBe(true);
        expect(providers?.included).toBe(false);
        // Lo anunciado y lo que se concede salen del mismo dato, así que no
        // pueden desviarse como pasaba con las listas escritas a mano.
        expect(entry.grantedFeatures.monthlyClose).toBe(true);
        expect(entry.grantedFeatures.providers).toBe(false);
      },
      "El texto de la vitrina se genera a partir de plan.features, el mismo objeto que decide el acceso real. Antes eran dos listas independientes que se desincronizaron (100/500 productos anunciados frente a 50/200 aplicados).",
    );

    test(
      "un plan sin capacidades declaradas las deduce de su nivel",
      () => {
        const pro = planToCatalogEntry(apiPlan({ tier: 2, features: null }));
        const basic = planToCatalogEntry(apiPlan({ tier: 1, features: null }));

        expect(pro.grantedFeatures.monthlyClose).toBe(true);
        expect(basic.grantedFeatures.monthlyClose).toBe(false);
        expect(basic.grantedFeatures.emailNotifications).toBe(true);
        expect(basic.grantedFeatures.sales).toBe(true);
      },
      "Los planes anteriores al modelo de capacidades llegan con features en null. Se deduce del nivel para reproducir el gate anterior en vez de dejar la vitrina vacía o negar accesos ya concedidos.",
    );

    test(
      "la vitrina enumera todas las capacidades del catálogo",
      () => {
        const entry = planToCatalogEntry(apiPlan());
        expect(entry.features.length).toBe(PLAN_FEATURES.length);
      },
      "Se listan también las no incluidas: la comparativa las pinta tachadas, que es lo que permite ver qué se gana al subir de plan.",
    );

    test(
      "expone el tope de negocios que decide si hay que reconciliar",
      () => {
        expect(planToCatalogEntry(apiPlan({ maxBusinesses: 3 })).maxBusinesses).toBe(3);
        expect(planToCatalogEntry(apiPlan({ maxBusinesses: null })).maxBusinesses).toBeNull();
      },
      "Al cambiar de plan, este tope decide si el usuario debe elegir qué negocios conserva. null es 'sin límite' y nunca obliga a reconciliar.",
    );

    test(
      "el icono acompaña al nivel, no al nombre del plan",
      () => {
        const nivel0 = planToCatalogEntry(apiPlan({ tier: 0, name: "Cualquiera" }));
        const nivel2 = planToCatalogEntry(apiPlan({ tier: 2, name: "Otro" }));
        expect(nivel0.icon).not.toBe(nivel2.icon);
      },
      "Un plan nuevo con nombre propio recibe el icono que le corresponde por nivel, sin necesidad de llamarse 'Pro' o 'Básico'.",
    );

    test(
      "selectablePlans deja fuera el nivel gratuito",
      () => {
        const catalog = [
          planToCatalogEntry(apiPlan({ tier: 0, code: "free" })),
          planToCatalogEntry(apiPlan({ tier: 1, code: "basic" })),
          planToCatalogEntry(apiPlan({ tier: 2, code: "pro" })),
        ];
        expect(selectablePlans(catalog).map((p) => p.code)).toEqual(["basic", "pro"]);
      },
      "El nivel gratuito es el periodo de prueba, no una opción a la que volver: ofrecerlo en el paywall permitiría renovar el trial indefinidamente.",
    );

    test(
      "el catálogo de respaldo no deja el paywall vacío",
      () => {
        const fallback = fallbackCatalog();
        expect(fallback.length > 0).toBe(true);
        expect(selectablePlans(fallback).length > 0).toBe(true);
        // Sin id no se puede enviar planId: el flujo recae en planType.
        expect(fallback.every((p) => p.id === null)).toBe(true);
      },
      "Si el backend no responde, la pantalla de selección de plan seguiría siendo el único camino del usuario tras vencer el trial. El respaldo local evita dejarlo sin salida, y al no traer id el envío recae en planType.",
    );
  },
  {
    description:
      "Traducción del catálogo de planes del backend a la vitrina, con respaldo local.",
  },
);
