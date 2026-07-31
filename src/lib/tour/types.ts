/**
 * Modelo de datos de las guías interactivas.
 *
 * Un tour es una lista de pasos que puede atravesar VARIAS rutas: el motor
 * (`components/tour/tour-provider.tsx`) navega solo cuando el paso siguiente
 * vive en otra vista. Por eso el paso declara su ruta y no al revés.
 *
 * Sin React ni APIs de navegador: lo consumen tanto el motor como la lógica
 * pura de filtrado (`tour-utils.ts`), que sí tiene tests.
 */

import type { PlanFeatureKey } from "@/lib/plan-features";

export type TourStep = {
  /** Identificador estable del paso. Para depurar y como clave de React. */
  id: string;
  /**
   * Ruta del dashboard donde vive el paso, SIN barra final y SIN basePath
   * (`usePathname` no lo lleva y `router.push` lo añade solo).
   * Si se omite, el paso se pinta en la ruta del paso anterior.
   */
  route?: string;
  /**
   * Selector CSS del ancla. Si se omite, el popover se muestra centrado, que es
   * lo que queremos en los pasos narrativos (bienvenida y despedida).
   */
  element?: string;
  title: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /**
   * Capacidad que el paso exige. La capacidad implícita de la ruta
   * (`requiredFeatureFor`) se deriva sola, así que para las rutas de
   * `PRO_ROUTES` no hace falta declararla aquí.
   */
  feature?: PlanFeatureKey;
  /**
   * El ancla está en el menú lateral: hay que expandirlo antes de resaltarla.
   * En móvil estos pasos se descartan (el sidebar es un Sheet modal que
   * neutraliza el resto de la página, incluido el popover del tour).
   */
  needsSidebar?: boolean;
  /**
   * Qué hacer si el ancla no aparece antes del timeout. Por defecto "center":
   * se pinta el popover sin ancla y el usuario lee la explicación igual. Con
   * "skip" el paso se descarta, para anclas cuyo valor es solo visual.
   */
  onMissing?: "skip" | "center";
};

export type TourKind = "completo" | "seccion" | "funcionalidad";

export type TourDefinition = {
  id: string;
  kind: TourKind;
  title: string;
  /** Una línea; es lo que se lee en el catálogo de guías. */
  description: string;
  /** Ruta donde arranca. Sirve para ofrecer el tour de la vista actual. */
  entryRoute: string;
  /** Capacidad exigida para ofrecer el tour entero. */
  feature?: PlanFeatureKey;
  steps: TourStep[];
};
