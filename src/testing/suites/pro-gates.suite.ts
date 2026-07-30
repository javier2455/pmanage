import { defineSuite, expect } from "@/testing/harness";
import {
  getMaxBusinesses,
  getProRedirect,
  isFreePlan,
  isProPlan,
  isProRoute,
  requiredFeatureFor,
  PLAN_BUSINESS_LIMIT,
} from "@/lib/pro-gates";
import {
  hasFeature,
  normalizeFeatures,
  PLAN_FEATURE_KEYS,
} from "@/lib/plan-features";
import {
  applySelectedPlanToSession,
  subscribeToPlanSession,
} from "@/lib/plan-session";

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

    test(
      "requiredFeatureFor nombra la capacidad que exige cada ruta",
      () => {
        expect(requiredFeatureFor("/dashboard/business/workers")).toBe("team");
        expect(requiredFeatureFor("/dashboard/business/providers")).toBe("providers");
        expect(requiredFeatureFor("/dashboard/accounting-close/monthly")).toBe("monthlyClose");
        expect(requiredFeatureFor("/dashboard/analytics")).toBe("analytics");
      },
      "Cada ruta protegida declara QUÉ capacidad exige, no solo que es 'Pro'. Es lo que permite que un plan nuevo abra una sección con solo marcar la casilla, sin tocar código.",
    );

    test(
      "requiredFeatureFor: rutas libres no exigen capacidad",
      () => {
        expect(requiredFeatureFor("/dashboard")).toBeNull();
        expect(requiredFeatureFor("/dashboard/business/sales")).toBeNull();
      },
      "Las rutas que no están en PRO_ROUTES devuelven null: cualquier plan entra sin comprobar capacidades.",
    );

    test(
      "hasFeature: manda lo que el plan declara",
      () => {
        const features = { monthlyClose: true, providers: false };
        expect(hasFeature(features, "monthlyClose")).toBe(true);
        expect(hasFeature(features, "providers")).toBe(false);
      },
      "Cuando el plan trae sus capacidades, gobiernan ellas: una en true concede, una en false niega.",
    );

    test(
      "hasFeature: capacidad ausente o sin plan no concede nada",
      () => {
        expect(hasFeature({ monthlyClose: true }, "providers")).toBe(false);
        expect(hasFeature(null, "monthlyClose")).toBe(false);
        expect(hasFeature(undefined, "sales")).toBe(false);
      },
      "Una clave que no aparece en el objeto es una capacidad no concedida, no una a deducir. Y sin capacidades (null/undefined) esta función no concede: el respaldo por plan Pro lo aplica el hook, no ella.",
    );

    test(
      "normalizeFeatures completa el catálogo para el formulario",
      () => {
        const normalized = normalizeFeatures({ monthlyClose: true });
        expect(normalized.monthlyClose).toBe(true);
        expect(normalized.providers).toBe(false);
        expect(Object.keys(normalized).length).toBe(PLAN_FEATURE_KEYS.length);
      },
      "El formulario necesita un booleano por casilla. Lo que llega del backend puede ser parcial, así que se completa con false: lo no declarado no está concedido.",
    );

    test(
      "applySelectedPlanToSession avisa del cambio de plan",
      () => {
        let avisos = 0;
        const baja = subscribeToPlanSession(() => {
          avisos += 1;
        });

        applySelectedPlanToSession({ type: "premium", features: { providers: true } });
        expect(avisos).toBe(1);

        baja();
        applySelectedPlanToSession({ type: "basic" });
        expect(avisos).toBe(1);
      },
      "sessionStorage no emite eventos en la misma pestaña: sin este aviso, los componentes ya renderizados seguían usando el plan viejo y un cambio de plan no surtía efecto hasta recargar. La baja debe dejar de recibirlos para no filtrar suscriptores al desmontar.",
    );

  },
  { description: "Detección de plan Pro/Free, límites, capacidades y gating de rutas." },
);
