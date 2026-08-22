"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProductListOptions } from "@/lib/types/product-list";

const CHECKBOX_DARK = "dark:bg-card dark:border-white";

const OPTION_LABELS: Array<{ key: keyof ProductListOptions; label: string }> = [
  { key: "showPrices", label: "Precio" },
  { key: "showAvailability", label: "Disponibilidad" },
  { key: "showUnit", label: "Unidad de medida" },
  { key: "groupByCategory", label: "Agrupar por categoría" },
  { key: "markOffers", label: "Marcar ofertas" },
];

interface MessageComposerProps {
  intro: string;
  outro: string;
  options: ProductListOptions;
  onIntroChange: (value: string) => void;
  onOutroChange: (value: string) => void;
  onOptionsChange: (options: ProductListOptions) => void;
}

export function MessageComposer({
  intro,
  outro,
  options,
  onIntroChange,
  onOutroChange,
  onOptionsChange,
}: MessageComposerProps) {
  function toggleOption(key: keyof ProductListOptions) {
    onOptionsChange({ ...options, [key]: !options[key] });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Qué mostrar de cada producto</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {OPTION_LABELS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`option-${key}`}
                className={CHECKBOX_DARK}
                checked={options[key]}
                onCheckedChange={() => toggleOption(key)}
              />
              <Label
                htmlFor={`option-${key}`}
                className="cursor-pointer font-normal"
              >
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="intro">Introducción (opcional)</Label>
        <Textarea
          id="intro"
          value={intro}
          onChange={(event) => onIntroChange(event.target.value)}
          placeholder="Buenos días! Ya estamos abiertos, hacemos entrega en toda la zona."
          rows={3}
          maxLength={1000}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="outro">Nota final (opcional)</Label>
        <Textarea
          id="outro"
          value={outro}
          onChange={(event) => onOutroChange(event.target.value)}
          placeholder="Pedidos al 5555-5555 hasta las 6:00 pm."
          rows={2}
          maxLength={1000}
        />
      </div>
    </div>
  );
}
