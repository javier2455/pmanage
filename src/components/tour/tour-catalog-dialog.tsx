"use client";

import * as React from "react";
import { Compass, LayoutGrid, Search, Wrench } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TourDefinition, TourKind } from "@/lib/tour/types";

const GROUPS: { kind: TourKind; label: string; hint: string }[] = [
  {
    kind: "completo",
    label: "Recorrido completo",
    hint: "Te llevamos por todo el sistema, pantalla por pantalla.",
  },
  {
    kind: "seccion",
    label: "Por sección",
    hint: "Una sola pantalla explicada a fondo.",
  },
  {
    kind: "funcionalidad",
    label: "Cómo hago…",
    hint: "Pasos concretos para resolver algo puntual.",
  },
];

const GROUP_ICON = {
  completo: Compass,
  seccion: LayoutGrid,
  funcionalidad: Wrench,
} as const;

/**
 * Quita tildes y pasa a minúsculas para que "categorias" encuentre
 * "Categorías". Mismo criterio que `normalizePlan` en `pro-gates.ts`.
 */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Texto sobre el que busca cada guía: su título y descripción, más los títulos
 * y descripciones de sus pasos. Buscar dentro de los pasos es lo que permite
 * llegar a una guía escribiendo la funcionalidad concreta ("transferencia",
 * "excel") aunque esa palabra no esté en el título.
 */
function searchableText(tour: TourDefinition): string {
  return normalize(
    [
      tour.title,
      tour.description,
      ...tour.steps.map((step) => `${step.title} ${step.description}`),
    ].join(" "),
  );
}

export function TourCatalogDialog({
  open,
  onOpenChange,
  tours,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tours: TourDefinition[];
  onSelect: (tourId: string) => void;
}) {
  const [query, setQuery] = React.useState("");

  /* Al cerrar se limpia la búsqueda: reabrir el catálogo debe mostrar todo. */
  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const haystacks = React.useMemo(
    () => new Map(tours.map((tour) => [tour.id, searchableText(tour)])),
    [tours],
  );

  const visibleTours = React.useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return tours;
    /* Todas las palabras deben aparecer: escribir "cerrar dia" no debe traer
       todo lo que mencione "día". */
    return tours.filter((tour) => {
      const haystack = haystacks.get(tour.id) ?? "";
      return terms.every((term) => haystack.includes(term));
    });
  }, [tours, query, haystacks]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Guías de uso</DialogTitle>
          <DialogDescription>
            Elige qué quieres aprender. Puedes salir de la guía en cualquier
            momento.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4">
          <InputGroup>
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busca una sección o algo que quieras hacer…"
              aria-label="Buscar guías"
            />
          </InputGroup>
        </div>

        <ScrollArea className="max-h-[60vh] border-t">
          <div className="flex flex-col gap-6 p-6">
            {GROUPS.map((group) => {
              const items = visibleTours.filter(
                (tour) => tour.kind === group.kind,
              );
              if (items.length === 0) return null;
              const Icon = GROUP_ICON[group.kind];

              return (
                <section key={group.kind} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">{group.label}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{group.hint}</p>

                  <div className="flex flex-col gap-1.5">
                    {items.map((tour) => (
                      <button
                        key={tour.id}
                        type="button"
                        onClick={() => onSelect(tour.id)}
                        className="flex cursor-pointer flex-col gap-0.5 rounded-md border border-transparent bg-muted/40 p-3 text-left transition-all hover:border-primary hover:shadow-md hover:shadow-primary/20"
                      >
                        <span className="text-sm font-medium">
                          {tour.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {tour.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}

            {tours.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no hay guías disponibles para tu cuenta.
              </p>
            ) : visibleTours.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No encontramos ninguna guía para «{query}». Prueba con otra
                palabra, como «vender», «stock» o «cierre».
              </p>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
