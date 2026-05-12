"use client";

import { Building2, Loader2, MapPin, RefreshCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface LocationInfoCardProps {
  manualAddress?: string;
  provinceName?: string | null;
  municipalityName?: string | null;
  hasAddressSuggestion?: boolean;
  isResolvingAddress?: boolean;
  onShowAddressSuggestion?: () => void;
}

export function LocationInfoCard({
  manualAddress,
  provinceName,
  municipalityName,
  hasAddressSuggestion = false,
  isResolvingAddress = false,
  onShowAddressSuggestion,
}: LocationInfoCardProps) {
  const locationParts = [municipalityName, provinceName].filter(Boolean);
  const locationLabel = locationParts.length > 0 ? locationParts.join(", ") : null;

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-card-foreground">
              Ubicación en el mapa
            </CardTitle>
            <CardDescription>
              Arrastra el marcador o haz clic en el mapa para ajustar la ubicación
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {locationLabel && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Provincia y municipio
            </span>
            <div className="flex items-start gap-2 text-sm text-card-foreground">
              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <span>{locationLabel}</span>
            </div>
          </div>
        )}

        {locationLabel && manualAddress && <Separator />}

        {manualAddress && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Dirección indicada
            </span>
            <div className="flex items-start gap-2 text-sm text-card-foreground">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <span>{manualAddress}</span>
            </div>
          </div>
        )}

        {isResolvingAddress && (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Analizando la ubicación seleccionada...
              </p>
              <div
                role="status"
                aria-live="polite"
                className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 text-sm font-medium text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Cargando nueva ubicación...</span>
              </div>
            </div>
          </>
        )}

        {!isResolvingAddress && hasAddressSuggestion && onShowAddressSuggestion && (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Detectamos una dirección distinta en el mapa.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onShowAddressSuggestion}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Actualizar dirección
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
