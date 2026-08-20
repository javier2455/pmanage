import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Guion largo para "sin dato". Un solo símbolo para todas las fichas y tablas. */
export const DASH = "—";
