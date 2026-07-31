"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver, type Driver } from "driver.js";
import { sileo } from "sileo";

import "driver.js/dist/driver.css";
import "@/components/tour/tour.css";

import { TourCatalogDialog } from "@/components/tour/tour-catalog-dialog";
import { isPathAllowed } from "@/components/auth/access-guard";
import { useSidebar } from "@/components/ui/sidebar";
import { useBusiness } from "@/context/business-context";
import { useAllowedNavigation } from "@/hooks/use-allowed-navigation";
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan";
import {
  clearActiveTour,
  readActiveTour,
  writeActiveTour,
} from "@/lib/tour/storage";
import {
  filterSteps,
  isSameRoute,
  isTourAvailable,
  routeForStep,
  sectionTourFor,
  type TourFilterContext,
} from "@/lib/tour/tour-utils";
import { TOURS, closingStepFor, getTour } from "@/lib/tour/tours";
import type { TourDefinition, TourStep } from "@/lib/tour/types";
import { waitForElement } from "@/lib/tour/wait-for-element";

/** Margen para que el ancla aparezca tras una navegación (React Query media). */
const ELEMENT_TIMEOUT_MS = 4000;

const BASE_CONFIG = {
  animate: true,
  smoothScroll: true,
  allowClose: true,
  overlayColor: "black",
  overlayOpacity: 0.55,
  stagePadding: 8,
  stageRadius: 8,
  popoverClass: "negora-tour",
  showProgress: true,
  nextBtnText: "Siguiente",
  prevBtnText: "Atrás",
  doneBtnText: "Listo",
} as const;

type ActiveTour = {
  tourId: string;
  entryRoute: string;
  /**
   * Pasos ya filtrados y CONGELADOS al arrancar. `PlanGuard` reescribe el plan
   * en sesión tras cada `/auth/me` y avisa a `useUserRoleAndPlan`: si el filtro
   * se recalculara en vivo, el array cambiaría bajo los pies y `stepIndex`
   * pasaría a señalar otro paso a mitad del recorrido.
   */
  steps: TourStep[];
  stepIndex: number;
};

type TourContextValue = {
  startTour: (tourId: string) => void;
  stopTour: () => void;
  openCatalog: () => void;
  isRunning: boolean;
  /** Tours ofrecibles ahora mismo (plan, permisos y negocio activo). */
  availableTours: TourDefinition[];
  /** Tour de sección de la vista actual, si existe y está disponible. */
  currentRouteTour: TourDefinition | null;
  /** Hasta que sea `true` no se ofrece ni se arranca ninguna guía. */
  isReady: boolean;
};

const TourContext = React.createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const context = React.useContext(TourContext);
  if (!context) {
    throw new Error("useTour debe usarse dentro de <TourProvider>");
  }
  return context;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, setOpen: setSidebarOpen } = useSidebar();
  const { planType, hasFeature } = useUserRoleAndPlan();
  const { businesses, isLoading: isLoadingBusinesses } = useBusiness();
  const { allowedUrls, enforce, isResolved } = useAllowedNavigation();

  const [active, setActive] = React.useState<ActiveTour | null>(null);
  const [catalogOpen, setCatalogOpen] = React.useState(false);

  const driverRef = React.useRef<Driver | null>(null);
  /** Ruta que hemos pedido nosotros; distingue nuestra navegación de la del usuario. */
  const navTargetRef = React.useRef<string | null>(null);
  const lastPathnameRef = React.useRef<string | null>(null);
  const resumedRef = React.useRef(false);

  /* `setOpen` de shadcn lleva `open` en sus dependencias, así que cambia de
     identidad cada vez que el menú se abre o se cierra —incluida la apertura
     que provoca el propio tour—. Si estuviera en las dependencias del bucle,
     cada expansión repintaría el paso y el popover parpadearía. */
  const setSidebarOpenRef = React.useRef(setSidebarOpen);
  React.useEffect(() => {
    setSidebarOpenRef.current = setSidebarOpen;
  }, [setSidebarOpen]);

  /* Mientras el plan no está resuelto `hasFeature` devuelve false para todo
     (decisión deliberada de `use-user-role-plan`), así que filtrar ahora
     mutilaría el tour de un usuario Pro. Se espera igual que hacen los guards. */
  const isReady =
    planType !== "" &&
    isResolved &&
    !isLoadingBusinesses &&
    businesses.length > 0;

  const isRouteAllowed = React.useCallback(
    (route: string) => !enforce || isPathAllowed(route, allowedUrls),
    [enforce, allowedUrls],
  );

  const filterContext = React.useMemo<TourFilterContext>(
    () => ({
      hasFeature,
      /* En móvil el menú lateral es un Sheet modal: neutraliza el resto de la
         página, incluido el popover del tour. Esos pasos se descartan. */
      allowsSidebarSteps: !isMobile,
      isRouteAllowed,
    }),
    [hasFeature, isMobile, isRouteAllowed],
  );

  const destroyDriver = React.useCallback(() => {
    driverRef.current?.destroy();
    driverRef.current = null;
  }, []);

  const stopTour = React.useCallback(() => {
    destroyDriver();
    navTargetRef.current = null;
    clearActiveTour();
    setActive(null);
  }, [destroyDriver]);

  const goToStep = React.useCallback((index: number) => {
    setActive((prev) => {
      if (!prev) return prev;
      const clamped = Math.max(0, index);
      writeActiveTour({ tourId: prev.tourId, stepIndex: clamped });
      return { ...prev, stepIndex: clamped };
    });
  }, []);

  const advance = React.useCallback(() => {
    setActive((prev) => {
      if (!prev) return prev;
      const next = prev.stepIndex + 1;
      if (next >= prev.steps.length) return prev;
      writeActiveTour({ tourId: prev.tourId, stepIndex: next });
      return { ...prev, stepIndex: next };
    });
  }, []);

  const goBack = React.useCallback(() => {
    setActive((prev) => {
      if (!prev) return prev;
      const previous = Math.max(0, prev.stepIndex - 1);
      writeActiveTour({ tourId: prev.tourId, stepIndex: previous });
      return { ...prev, stepIndex: previous };
    });
  }, []);

  const startTour = React.useCallback(
    (tourId: string, fromStep = 0) => {
      const tour = getTour(tourId);
      if (!tour) return;
      const visibleSteps = filterSteps(
        tour.steps,
        tour.entryRoute,
        filterContext,
      );
      if (visibleSteps.length === 0) return;
      /* La despedida se añade después de filtrar: no depende del plan y debe
         cerrar la guía aunque el filtro haya dejado un solo paso. */
      const steps = [...visibleSteps, closingStepFor(tour)];

      const stepIndex = Math.min(Math.max(0, fromStep), steps.length - 1);
      destroyDriver();
      navTargetRef.current = null;
      writeActiveTour({ tourId: tour.id, stepIndex });
      setActive({
        tourId: tour.id,
        entryRoute: tour.entryRoute,
        steps,
        stepIndex,
      });
    },
    [destroyDriver, filterContext],
  );

  /** Pinta un paso. `element` es null cuando el ancla no llegó a aparecer. */
  const showStep = React.useCallback(
    (step: TourStep, element: Element | null, index: number, total: number) => {
      const isFirst = index === 0;
      const isLast = index === total - 1;

      driverRef.current ??= driver({
        ...BASE_CONFIG,
        /* Solo se dispara en salidas iniciadas por el usuario (Esc, X, fondo).
           Un `destroy()` nuestro NO lo ejecuta, que es justo lo que permite
           destruir libremente al navegar sin matar el tour por el camino. */
        onDestroyStarted: () => stopTour(),
      });

      driverRef.current.highlight({
        element: element ?? undefined,
        /* En los pasos de menú no queremos que el usuario pulse el item: la
           navegación la hace el motor. Además evita el problema de interacción
           dentro del stacking context del sidebar. */
        disableActiveInteraction: step.needsSidebar === true,
        popover: {
          title: step.title,
          description: step.description,
          side: step.side ?? "bottom",
          align: step.align ?? "start",
          showButtons: isFirst
            ? ["next", "close"]
            : ["next", "previous", "close"],
          nextBtnText: isLast ? "Listo" : "Siguiente",
          /* Sin `{{current}}`/`{{total}}`: con `highlight()` no hay tour
             interno que los rellene, el progreso lo componemos nosotros. */
          progressText: `${index + 1} de ${total}`,
          onNextClick: isLast ? () => stopTour() : () => advance(),
          onPrevClick: () => goBack(),
          onCloseClick: () => stopTour(),
        },
      });
    },
    [advance, goBack, stopTour],
  );

  /* Bucle del motor: un solo efecto decide si pintar, esperar o navegar. */
  React.useEffect(() => {
    if (!active) {
      lastPathnameRef.current = pathname;
      return;
    }

    const previousPathname = lastPathnameRef.current;
    lastPathnameRef.current = pathname;

    const step = active.steps[active.stepIndex];
    if (!step) {
      stopTour();
      return;
    }

    const target = routeForStep(
      active.steps,
      active.stepIndex,
      active.entryRoute,
    );

    // A) Estamos en la ruta del paso: resolver el ancla y pintar.
    if (isSameRoute(pathname, target)) {
      navTargetRef.current = null;
      const controller = new AbortController();

      /* Expandir el menú es idempotente, así que no hace falta leer su estado.
         Los dos frames de más abajo dan tiempo a que termine la transición de
         ancho: si no, driver mide el recorte antes y queda descolocado. */
      if (step.needsSidebar && !isMobile) setSidebarOpenRef.current(true);

      void waitForElement(
        step.element ?? "body",
        ELEMENT_TIMEOUT_MS,
        controller.signal,
      ).then((element) => {
        if (controller.signal.aborted) return;
        if (!element && step.onMissing === "skip") {
          advance();
          return;
        }
        const anchor = step.element ? element : null;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (controller.signal.aborted) return;
            showStep(step, anchor, active.stepIndex, active.steps.length);
          });
        });
      });

      return () => controller.abort();
    }

    const pathnameChanged =
      previousPathname !== null && !isSameRoute(previousPathname, pathname);

    // B) La ruta cambió sin que el paso la pidiera.
    if (pathnameChanged) {
      const nextIndex = active.stepIndex + 1;
      const nextRoute =
        nextIndex < active.steps.length
          ? routeForStep(active.steps, nextIndex, active.entryRoute)
          : null;

      /* Si aterrizó justo donde va el paso siguiente, se ha adelantado (por
         ejemplo pulsando el item del menú que el tour estaba señalando). */
      if (nextRoute && isSameRoute(pathname, nextRoute)) {
        goToStep(nextIndex);
        return;
      }

      stopTour();
      sileo.info({
        title: "Guía cerrada",
        description: "Puedes retomarla desde el botón de ayuda.",
      });
      return;
    }

    // C) Ya vamos de camino: esperar a que llegue la nueva ruta.
    if (navTargetRef.current !== null) return;

    /* D) El paso vive en otra vista. Se destruye antes de navegar para no
       dejar el recorte sobre una página que se está reemplazando, y se empuja
       CON barra final: `trailingSlash: true` convierte una ruta sin ella en un
       308, que provoca navegación dura y mataría el tour. */
    destroyDriver();
    navTargetRef.current = target;
    router.push(`${target}/`);
  }, [
    active,
    pathname,
    router,
    isMobile,
    advance,
    goToStep,
    showStep,
    stopTour,
    destroyDriver,
  ]);

  /* Reanudar tras una recarga. Solo se intenta una vez y cuando el plan ya
     está resuelto, para que el filtrado de pasos sea el correcto. */
  React.useEffect(() => {
    if (resumedRef.current || !isReady || active) return;
    resumedRef.current = true;
    const cursor = readActiveTour();
    if (cursor) startTour(cursor.tourId, cursor.stepIndex);
  }, [isReady, active, startTour]);

  /* El overlay no debe sobrevivir al desmontaje del dashboard. */
  React.useEffect(() => destroyDriver, [destroyDriver]);

  const availableTours = React.useMemo(
    () =>
      isReady ? TOURS.filter((tour) => isTourAvailable(tour, filterContext)) : [],
    [isReady, filterContext],
  );

  const currentRouteTour = React.useMemo(
    () => sectionTourFor(pathname, availableTours),
    [pathname, availableTours],
  );

  const startTourById = React.useCallback(
    (tourId: string) => {
      if (!isReady) return;
      setCatalogOpen(false);
      startTour(tourId);
    },
    [isReady, startTour],
  );

  const openCatalog = React.useCallback(() => setCatalogOpen(true), []);

  const value = React.useMemo<TourContextValue>(
    () => ({
      startTour: startTourById,
      stopTour,
      openCatalog,
      isRunning: active !== null,
      availableTours,
      currentRouteTour,
      isReady,
    }),
    [
      startTourById,
      stopTour,
      openCatalog,
      active,
      availableTours,
      currentRouteTour,
      isReady,
    ],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {/* El catálogo lo monta el provider y no quien lo abre: dentro de un
          DropdownMenu se desmontaría al cerrarse el menú. */}
      <TourCatalogDialog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        tours={availableTours}
        onSelect={startTourById}
      />
    </TourContext.Provider>
  );
}
