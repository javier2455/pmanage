"use client";

import { Image as ImageIcon, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductListMode } from "@/lib/types/product-list";

const MODES: Array<{
  value: ProductListMode;
  label: string;
  icon: typeof Type;
  hint: string;
}> = [
  { value: "text", label: "Texto", icon: Type, hint: "Un solo mensaje" },
  {
    value: "image",
    label: "Imágenes",
    icon: ImageIcon,
    hint: "Láminas de 4 productos con foto",
  },
];

interface ModeTabsProps {
  value: ProductListMode;
  onChange: (mode: ProductListMode) => void;
  disabled?: boolean;
}

export function ModeTabs({ value, onChange, disabled }: ModeTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Formato del mensaje"
      className="flex gap-1 rounded-lg bg-muted p-1"
    >
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const isActive = value === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onChange(mode.value)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-md px-3 py-2 text-sm transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isActive
                ? "bg-background font-medium text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-2">
              <Icon className="size-4" />
              {mode.label}
            </span>
            <span className="text-xs text-muted-foreground">{mode.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
