import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Guion largo para "sin dato". Un solo símbolo para todas las fichas y tablas. */
export const DASH = "—";

/**
 * Iniciales de un nombre, máximo dos letras ("Ana María Pérez" → "AM").
 * `fallback` es lo que se muestra cuando no hay nombre (p. ej. "TR", "IN").
 */
export function getInitials(name: string | null | undefined, fallback: string) {
  if (!name?.trim()) return fallback;
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}
