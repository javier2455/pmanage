"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { CircleHelp, Compass, LayoutGrid } from "lucide-react";

import { useTour } from "@/components/tour/tour-provider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { hasSeenTourWelcome, markTourWelcomeSeen } from "@/lib/tour/storage";
import { isSameRoute } from "@/lib/tour/tour-utils";

const FULL_TOUR_ID = "completo";

/**
 * Ayuda contextual de la barra superior. Tiene dos caras:
 *
 * - "menu": el tour de la vista actual y el catálogo completo.
 * - "welcome": la invitación de la primera visita al panel. Se reutiliza el
 *   mismo popover a propósito, para que la invitación enseñe además DÓNDE vive
 *   la ayuda cuando el usuario quiera volver.
 */
export function TourHelpButton() {
  const pathname = usePathname();
  const { startTour, openCatalog, currentRouteTour, isReady, isRunning } =
    useTour();

  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"menu" | "welcome">("menu");

  /* localStorage se lee en efecto, no en la inicialización del estado: es la
     convención del proyecto para no romper la hidratación. */
  React.useEffect(() => {
    if (!isReady || isRunning) return;
    if (!isSameRoute(pathname, "/dashboard")) return;
    if (hasSeenTourWelcome()) return;
    setMode("welcome");
    setOpen(true);
  }, [isReady, isRunning, pathname]);

  function dismissWelcome() {
    markTourWelcomeSeen();
    setMode("menu");
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next && mode === "welcome") {
      /* Cerrar la invitación por fuera cuenta como "ahora no": si no, volvería
         a saltar en cada visita al panel. */
      dismissWelcome();
      return;
    }
    setOpen(next);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={!isReady}
          aria-label="Guías de uso"
        >
          <CircleHelp className="h-5 w-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-0">
        {mode === "welcome" ? (
          <div className="flex flex-col gap-3 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold">
                ¿Primera vez por aquí?
              </span>
              <p className="text-xs text-muted-foreground">
                Te enseñamos en unos minutos qué hace cada sección y por dónde
                empezar con tu negocio.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={dismissWelcome}>
                Ahora no
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  markTourWelcomeSeen();
                  setMode("menu");
                  setOpen(false);
                  startTour(FULL_TOUR_ID);
                }}
              >
                Ver la guía
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col p-1">
            {currentRouteTour ? (
              <button
                type="button"
                className="flex cursor-pointer items-start gap-2 rounded-md border border-transparent px-2 py-2 text-left transition-all hover:border-primary hover:shadow-md hover:shadow-primary/20"
                onClick={() => {
                  setOpen(false);
                  startTour(currentRouteTour.id);
                }}
              >
                <LayoutGrid className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Tour de esta vista</span>
                  <span className="text-xs text-muted-foreground">
                    {currentRouteTour.title}
                  </span>
                </span>
              </button>
            ) : null}

            <button
              type="button"
              className="flex cursor-pointer items-start gap-2 rounded-md border border-transparent px-2 py-2 text-left transition-all hover:border-primary hover:shadow-md hover:shadow-primary/20"
              onClick={() => {
                setOpen(false);
                openCatalog();
              }}
            >
              <Compass className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Ver todas las guías</span>
                <span className="text-xs text-muted-foreground">
                  El recorrido completo y las guías por sección.
                </span>
              </span>
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
