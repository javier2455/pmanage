import { z } from "zod";

/**
 * Returns true if `value` is only a dial code (e.g. "+53"), i.e. the user
 * selected a country flag but didn't type any digits after it.
 */
export function isDialCodeOnly(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^\+\d{1,4}$/.test(value.trim());
}

/**
 * Returns true if `value` is a full, valid E.164-style phone number
 * (not empty, not just a dial code). Shared rule for any feature that
 * needs to know whether a usable phone number is present.
 */
export function isValidPhone(value: string | null | undefined): boolean {
  if (!value) return false;
  return !isDialCodeOnly(value) && /^\+[1-9]\d{6,14}$/.test(value);
}

/**
 * Accepts an empty string or a full E.164-style number.
 * Rejects dial-code-only values (e.g. "+53") as invalid.
 * Use for optional phone fields.
 */
export const optionalPhoneSchema = z
  .string()
  .refine(
    (val) => !val || isDialCodeOnly(val) || /^\+[1-9]\d{6,14}$/.test(val),
    { message: "El número de teléfono no es válido" },
  );

/**
 * Requires a full phone number (not just a dial code, not empty).
 * Use for required phone fields.
 */
export const requiredPhoneSchema = z
  .string()
  .refine((val) => !!val && !isDialCodeOnly(val), {
    message: "El número de teléfono es requerido",
  })
  .refine(
    (val) => !val || isDialCodeOnly(val) || /^\+[1-9]\d{6,14}$/.test(val),
    { message: "El número de teléfono no es válido" },
  );
