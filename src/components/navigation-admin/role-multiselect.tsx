"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * IDs fijos de roles según la BD del backend.
 * TODO: cuando el backend exponga un endpoint de roles, reemplazar por una
 * consulta dinámica.
 */
export const ROLE_IDS = {
  BUSINESS_OWNER: "4",
  ADMIN: "5",
} as const;

export const ROLE_OPTIONS: Array<{ id: string; label: string }> = [
  { id: ROLE_IDS.BUSINESS_OWNER, label: "Dueño de negocio" },
  { id: ROLE_IDS.ADMIN, label: "Administrador" },
];

export function getRoleLabel(id: string): string {
  return ROLE_OPTIONS.find((r) => r.id === id)?.label ?? id;
}

export function isAdminOnly(roles: string[] | null | undefined): boolean {
  if (!roles || roles.length !== 1) return false;
  return roles[0] === ROLE_IDS.ADMIN;
}

interface RoleMultiSelectProps {
  value: string[];
  onChange: (roles: string[]) => void;
  options?: Array<{ id: string; label: string }>;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
}

export function RoleMultiSelect({
  value,
  onChange,
  options = ROLE_OPTIONS,
  disabled,
  invalid,
  placeholder = "Selecciona roles con acceso",
}: RoleMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const selected = options.filter((opt) => value.includes(opt.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid ? "true" : "false"}
          className={cn(
            "h-auto min-h-9 w-full justify-between gap-2 px-3 py-1.5 font-normal",
            selected.length === 0 && "text-muted-foreground",
          )}
        >
          <div className="flex flex-wrap items-center gap-1">
            {selected.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              selected.map((opt) => (
                <Badge key={opt.id} variant="secondary" className="font-normal">
                  {opt.label}
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
        {options.map((opt) => {
          const checked = value.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
            >
              <span>{opt.label}</span>
              {checked && <Check className="size-4 text-primary" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
