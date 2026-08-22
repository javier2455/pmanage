"use client";

import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductListTemplate } from "@/lib/types/product-list";

const NO_TEMPLATE = "none";

interface TemplateBarProps {
  templates: ProductListTemplate[];
  activeTemplateId: string | null;
  onLoad: (template: ProductListTemplate | null) => void;
  onSave: (name: string) => void;
  onDelete: (templateId: string) => void;
  isSaving: boolean;
  canSave: boolean;
}

export function TemplateBar({
  templates,
  activeTemplateId,
  onLoad,
  onSave,
  onDelete,
  isSaving,
  canSave,
}: TemplateBarProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");

  const active = templates.find((t) => t.id === activeTemplateId) ?? null;

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName("");
    setDialogOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={activeTemplateId ?? NO_TEMPLATE}
        onValueChange={(value) =>
          onLoad(
            value === NO_TEMPLATE
              ? null
              : (templates.find((t) => t.id === value) ?? null),
          )
        }
      >
        <SelectTrigger className="w-[220px]" aria-label="Plantilla">
          <SelectValue placeholder="Sin plantilla" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_TEMPLATE}>Sin plantilla</SelectItem>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        disabled={!canSave || isSaving}
        onClick={() => {
          setName(active?.name ?? "");
          setDialogOpen(true);
        }}
      >
        <Save data-icon="inline-start" />
        Guardar plantilla
      </Button>

      {active && (
        <Button
          type="button"
          variant="ghost"
          className="text-destructive"
          onClick={() => onDelete(active.id)}
          aria-label={`Eliminar la plantilla ${active.name}`}
        >
          <Trash2 data-icon="inline-start" />
          Eliminar
        </Button>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar plantilla</DialogTitle>
            <DialogDescription>
              Se guardan los textos, las opciones y las categorías incluidas. La
              lista se recalcula con tu inventario cada vez que la uses.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="template-name">Nombre</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Lista de lunes"
              maxLength={100}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSave();
              }}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={!name.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
