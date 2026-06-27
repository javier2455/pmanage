"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TriangleAlert, Trash2 } from "lucide-react";
import { DeleteDialog } from "@/components/delete-dialog";
import { useBusiness } from "@/context/business-context";
import { useDeleteBusinessMutation } from "@/hooks/use-business";
import { sileo } from "sileo";
import axios from "axios";

/** Zona de peligro del negocio: acciones irreversibles (eliminar negocio). */
export function BusinessDangerZone() {
  const { activeBusiness, activeBusinessId } = useBusiness();
  const deleteBusinessMutation = useDeleteBusinessMutation();

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10">
            <TriangleAlert className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-card-foreground">Zona de peligro</CardTitle>
            <CardDescription>
              Las acciones de esta sección son irreversibles
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div>
            <p className="text-sm font-medium text-card-foreground">
              Eliminar negocio
            </p>
            <p className="text-sm text-muted-foreground">
              Elimina permanentemente este negocio y todos sus datos asociados.
            </p>
          </div>
          <DeleteDialog
            deleteType="Negocio"
            name={activeBusiness?.name ?? ""}
            onConfirm={async () => {
              if (!activeBusinessId) return;
              try {
                await deleteBusinessMutation.mutateAsync(activeBusinessId);
                sileo.success({
                  title: "Negocio eliminado",
                  description: "El negocio ha sido eliminado correctamente",
                  fill: "",
                  styles: {
                    title: "text-white! text-[16px]! font-bold!",
                    description: "text-white/90! text-[15px]!",
                  },
                });
              } catch (error) {
                if (axios.isAxiosError(error)) {
                  sileo.error({
                    title: error.response?.data?.error ?? "Error",
                    description:
                      error.response?.data?.message ??
                      "No se pudo eliminar el negocio",
                    styles: { description: "text-[#dc2626]/90! text-[15px]!" },
                  });
                }
              }
            }}
            trigger={
              <Button variant="destructive" size="sm" className="shrink-0">
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
