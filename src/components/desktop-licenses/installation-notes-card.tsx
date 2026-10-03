"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toastError, toastSuccess } from "@/lib/toast";
import { licenseErrorMessage } from "@/lib/desktop-licenses";
import { useUpdateDesktopInstallationMutation } from "@/hooks/use-desktop-licenses";

const NOTES_MAX_LENGTH = 2000;

/**
 * Notas internas del administrador. El padre la monta con `key` = notas
 * guardadas, así el borrador se reinicia cuando llegan las del servidor.
 */
export function InstallationNotesCard({
  code,
  notes,
}: {
  code: string;
  notes: string | null;
}) {
  const saved = notes ?? "";
  const [draft, setDraft] = useState(saved);
  const updateMutation = useUpdateDesktopInstallationMutation();
  const isDirty = draft.trim() !== saved.trim();

  async function handleSave() {
    try {
      await updateMutation.mutateAsync({ code, notes: draft.trim() });
      toastSuccess({ title: "Notas guardadas" });
    } catch (error) {
      toastError({
        title: "Error",
        description: licenseErrorMessage(
          error,
          "No se pudieron guardar las notas. Intenta de nuevo.",
        ),
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-foreground">Notas</CardTitle>
        <CardDescription>Solo las ven los administradores</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          id="installation-notes"
          aria-label="Notas de la instalación"
          rows={4}
          maxLength={NOTES_MAX_LENGTH}
          className="resize-none"
          placeholder="Ej: Paga por transferencia a fin de mes"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Guardar notas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
