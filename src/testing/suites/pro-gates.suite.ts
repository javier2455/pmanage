import { defineSuite, expect } from "@/testing/harness";
import {
  getMaxBusinesses,
  getProRedirect,
  isFreePlan,
  isProPlan,
  isProRoute,
  PLAN_BUSINESS_LIMIT,
} from "@/lib/pro-gates";

export const proGatesSuite = defineSuite(
  "pro-gates · planes y rutas Pro",
  ({ test }) => {
    test(
      "isProPlan reconoce variantes Pro (tildes/mayúsculas)",
      () => {
        expect(isProPlan("pro")).toBe(true);
        expect(isProPlan("Profesional")).toBe(true);
        expect(isProPlan("premium")).toBe(true);
        expect(isProPlan("Plus")).toBe(true);
        expect(isProPlan("ENTERPRISE")).toBe(true);
      },
      "Detecta plan Pro normalizando (sin tildes, minúsculas) y buscando palabras clave: 'pro', 'profesional', 'premium', 'plus', 'enterprise'. Tolera mayúsculas y acentos para no fallar por cómo lo escriba el backend.",
    );

    test(
      "isProPlan: free/básico/undefined no son Pro",
      () => {
        expect(isProPlan("free")).toBe(false);
        expect(isProPlan("basic")).toBe(false);
        expect(isProPlan(undefined)).toBe(false);
      },
      "Los planes gratuito/básico no son Pro. undefined (plan aún no cargado) devuelve false para no conceder acceso Pro por error durante la carga.",
    );

    test(
      "isFreePlan reconoce variantes gratuitas",
      () => {
        expect(isFreePlan("free")).toBe(true);
        expect(isFreePlan("Gratis")).toBe(true);
        expect(isFreePlan("gratuito")).toBe(true);
      },
      "Detecta el plan gratuito por palabras clave: 'free', 'gratis', 'gratuito', con la misma normalización tolerante a tildes/mayúsculas.",
    );

    test(
      "isFreePlan: Pro/undefined no son free",
      () => {
        expect(isFreePlan("premium")).toBe(false);
        expect(isFreePlan(undefined)).toBe(false);
      },
      "Un plan Pro (premium) no es free, y undefined tampoco se clasifica como free: ante la duda no se asume ningún plan concreto.",
    );

    test(
      "getMaxBusinesses: Pro permite 3, resto 1",
      () => {
        expect(getMaxBusinesses("premium")).toBe(PLAN_BUSINESS_LIMIT.pro);
        expect(getMaxBusinesses("free")).toBe(PLAN_BUSINESS_LIMIT.default);
        expect(getMaxBusinesses(undefined)).toBe(PLAN_BUSINESS_LIMIT.default);
      },
      "Tope de negocios activos según el plan: Pro permite 3, el resto (free/básico/desconocido) permite 1. Fuente única usada por el switcher de negocios y la detección de exceso.",
    );

    test(
      "isProRoute detecta rutas Pro por prefijo",
      () => {
        expect(isProRoute("/dashboard/business/workers")).toBe(true);
        expect(isProRoute("/dashboard/business/workers/create")).toBe(true);
        expect(isProRoute("/dashboard/analytics")).toBe(true);
      },
      "Una ruta está gateada por Pro si empieza por algún prefijo de PRO_ROUTES (workers, providers, cierre mensual, analytics). Coincide tanto la ruta base como sus subrutas (/workers/create).",
    );

    test(
      "isProRoute: rutas no gateadas → false",
      () => {
        expect(isProRoute("/dashboard")).toBe(false);
        expect(isProRoute("/dashboard/business/sales")).toBe(false);
      },
      "Las rutas que no están detrás del gate Pro (dashboard principal, ventas) devuelven false: son accesibles para cualquier plan.",
    );

    test(
      "getProRedirect devuelve la redirección o null",
      () => {
        expect(getProRedirect("/dashboard/analytics")).toBe("/dashboard");
        expect(getProRedirect("/dashboard/business/sales")).toBeNull();
      },
      "Para una ruta Pro devuelve a dónde redirigir a un usuario sin plan Pro (/dashboard). Para una ruta no gateada devuelve null (no hay que redirigir).",
    );
  },
  { description: "Detección de plan Pro/Free, límites y gating de rutas." },
);
