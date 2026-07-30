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
 * Separadores de cortesía: no cambian el número, solo cómo se escribió.
 * Un negocio dado de alta con "+53 5555 1234" tiene un teléfono tan usable
 * como "+5355551234", y antes contaba como inválido — dejando el canal SMS
 * deshabilitado sin motivo real.
 */
const PHONE_SEPARATORS = /[\s().-]/g;

/**
 * Returns true if `value` is a full, valid E.164-style phone number
 * (not empty, not just a dial code). Shared rule for any feature that
 * needs to know whether a usable phone number is present.
 *
 * Tolera separadores porque responde a "¿hay un número con el que se pueda
 * contactar?". El formato de entrada lo siguen exigiendo los schemas de abajo.
 */
export function isValidPhone(value: string | null | undefined): boolean {
  if (!value) return false;
  const compact = value.replace(PHONE_SEPARATORS, "");
  return !isDialCodeOnly(compact) && /^\+[1-9]\d{6,14}$/.test(compact);
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
