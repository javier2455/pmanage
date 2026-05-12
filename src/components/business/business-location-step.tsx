"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LocationMap } from "./location-map";
import { LocationInfoCard } from "./location-info-card";
import { resolveAddressFromCoords } from "@/lib/utils/reverse-geocode";

interface BusinessLocationStepProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
  manualAddress?: string;
  provinceName?: string | null;
  municipalityName?: string | null;
  onAddressSuggestion?: (address: string) => void;
}

function normalize(text: string | undefined | null) {
  return (text ?? "").trim().toLowerCase();
}

export function BusinessLocationStep({
  lat,
  lng,
  onLocationChange,
  manualAddress,
  provinceName,
  municipalityName,
  onAddressSuggestion,
}: BusinessLocationStepProps) {
  const requestIdRef = useRef(0);
  const [suggestedAddress, setSuggestedAddress] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  useEffect(() => {
    if (!suggestedAddress) return;
    if (normalize(suggestedAddress) === normalize(manualAddress)) {
      setSuggestedAddress(null);
      setIsDialogOpen(false);
    }
  }, [manualAddress, suggestedAddress]);

  const handleMapInteraction = (newLat: number, newLng: number) => {
    onLocationChange(newLat, newLng);

    if (!onAddressSuggestion) return;

    const requestId = ++requestIdRef.current;
    setIsResolvingAddress(true);
    void (async () => {
      const result = await resolveAddressFromCoords(newLat, newLng);
      if (requestId !== requestIdRef.current) return;
      setIsResolvingAddress(false);
      if (!result?.address) return;

      const detected = result.address;

      if (!manualAddress?.trim()) {
        onAddressSuggestion(detected);
        setSuggestedAddress(null);
        return;
      }

      if (normalize(detected) === normalize(manualAddress)) {
        setSuggestedAddress(null);
        return;
      }

      setSuggestedAddress(detected);
    })();
  };

  const handleAcceptSuggestion = () => {
    if (suggestedAddress && onAddressSuggestion) {
      onAddressSuggestion(suggestedAddress);
    }
    setSuggestedAddress(null);
    setIsDialogOpen(false);
  };

  const handleDismissSuggestion = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <LocationMap
          lat={lat}
          lng={lng}
          onLocationChange={handleMapInteraction}
        />
        <LocationInfoCard
          manualAddress={manualAddress}
          provinceName={provinceName}
          municipalityName={municipalityName}
          hasAddressSuggestion={!!suggestedAddress}
          isResolvingAddress={isResolvingAddress}
          onShowAddressSuggestion={() => setIsDialogOpen(true)}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <DialogTitle>Actualizar dirección</DialogTitle>
            </div>
            <DialogDescription>
              La dirección detectada en el mapa no coincide con la que escribiste.
              ¿Quieres reemplazarla por la sugerencia?
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Dirección actual
              </span>
              <div className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground">
                {manualAddress}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                Sugerencia del mapa
              </span>
              <div className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-foreground">
                {suggestedAddress}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleDismissSuggestion}>
              Mantener la mía
            </Button>
            <Button type="button" onClick={handleAcceptSuggestion}>
              Usar la sugerencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
