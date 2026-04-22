"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;

interface PageSizeSelectProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
}

export function PageSizeSelect({
  value,
  onChange,
  label = "Por página",
  disabled = false,
}: PageSizeSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Select
        value={String(value)}
        onValueChange={(v) => onChange(Number.parseInt(v, 10))}
        disabled={disabled}
      >
        <SelectTrigger
          size="sm"
          className="w-21"
          aria-label="Elementos por página"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
