"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Store, Building2, MapPin, Phone, Mail } from "lucide-react";
import { useBusiness } from "@/context/business-context";

const businessTypeLabels: Record<string, string> = {
  mipyme: "MiPyme",
  agromarket: "Agromercado",
  market: "Mercado",
};

export default function BusinessDetailsPage() {
  const { activeBusiness } = useBusiness();

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Detalles del negocio
        </h1>
        <p className="text-muted-foreground">
          Información del negocio actual
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">
                Datos del negocio
              </CardTitle>
              <CardDescription>
                Información registrada de tu negocio
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className="text-card-foreground">
                  Nombre del negocio
                </Label>
                <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <span className="pl-6 text-sm text-foreground">
                    {activeBusiness?.name ?? "-"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-card-foreground">
                  Tipo de negocio
                </Label>
                <div className="flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                  <span className="text-sm text-foreground">
                    {activeBusiness?.type
                      ? businessTypeLabels[activeBusiness.type] ?? activeBusiness.type
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-card-foreground">
                Dirección
              </Label>
              <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <span className="pl-6 text-sm text-foreground">
                  {activeBusiness?.address ?? "-"}
                </span>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className="text-card-foreground">
                  Provincia
                </Label>
                <div className="flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                  <span className="text-sm text-foreground">-</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-card-foreground">
                  Municipio
                </Label>
                <div className="flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                  <span className="text-sm text-foreground">-</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-card-foreground">
                Descripción
              </Label>
              <div className="flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                <span className="text-sm text-foreground">
                  {activeBusiness?.description ?? "-"}
                </span>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className="text-card-foreground">
                  Teléfono
                </Label>
                <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <span className="pl-6 text-sm text-foreground">
                    {activeBusiness?.phone ?? "-"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-card-foreground">
                  Correo
                </Label>
                <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <span className="pl-6 text-sm text-foreground">
                    {activeBusiness?.email ?? "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
