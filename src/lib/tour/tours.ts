/**
 * Catálogo de guías interactivas.
 *
 * Es un array de TypeScript y no una tabla del backend a propósito: el
 * contenido cambia cuando cambia la interfaz, así que vive con ella. Si algún
 * día hay que configurarlo desde la gestión de menús, los tipos ya están y
 * basta sustituir este módulo por una query.
 */

import { FLOW_TOURS } from "@/lib/tour/tours/flows";
import { FULL_TOUR } from "@/lib/tour/tours/full";
import { SECTION_TOURS } from "@/lib/tour/tours/sections";
import type { TourDefinition, TourStep } from "@/lib/tour/types";

export const TOURS: TourDefinition[] = [
  FULL_TOUR,
  ...SECTION_TOURS,
  ...FLOW_TOURS,
];

export function getTour(id: string): TourDefinition | undefined {
  return TOURS.find((tour) => tour.id === id);
}

/**
 * Despedida que el motor añade al final de cualquier guía.
 *
 * Va aquí y no en cada tour para que las 38 cierren igual y no haya que
 * repetir el texto. Sin `route`, así que hereda la del último paso, y sin
 * `element`, para que se pinte centrado: es un mensaje, no un señalamiento.
 */
export function closingStepFor(tour: TourDefinition): TourStep {
  if (tour.kind === "completo") {
    return {
      id: "cierre-recorrido",
      title: "Listo, ya conoces Negora",
      description:
        "Ya sabes qué hace cada pantalla y en qué orden usarlas. Ahora lo que toca es lo de verdad: carga tus productos, anota cada venta y cada gasto, y cierra la caja al final del día. Con eso el sistema empieza a devolverte las cuentas hechas. Si en algún momento dudas, el botón de ayuda de arriba te trae de vuelta este recorrido y la guía de cada pantalla.",
    };
  }

  return {
    id: "cierre-guia",
    title: "Eso es todo",
    description:
      "Ya sabes cómo funciona esta pantalla. Puedes repetir esta guía —o ver la de cualquier otra sección— desde el botón de ayuda de la barra superior.",
  };
}
