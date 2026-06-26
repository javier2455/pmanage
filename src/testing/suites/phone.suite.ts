import { defineSuite, expect } from "@/testing/harness";
import {
  isDialCodeOnly,
  isValidPhone,
  optionalPhoneSchema,
} from "@/lib/validations/phone";

export const phoneSuite = defineSuite(
  "phone · validación de teléfono",
  ({ test }) => {
    test(
      "isDialCodeOnly: solo prefijo (+53) es true",
      () => {
        expect(isDialCodeOnly("+53")).toBe(true);
        expect(isDialCodeOnly("+1")).toBe(true);
      },
      "Detecta cuando el usuario seleccionó la bandera de un país pero no escribió dígitos: solo queda el prefijo internacional ('+53', '+1'). Esto NO es un teléfono usable.",
    );

    test(
      "isDialCodeOnly: número completo o vacío es false",
      () => {
        expect(isDialCodeOnly("+5355551234")).toBe(false);
        expect(isDialCodeOnly("")).toBe(false);
        expect(isDialCodeOnly(null)).toBe(false);
      },
      "Un número completo ('+5355551234') no es 'solo prefijo'. Vacío y null tampoco lo son: representan ausencia, no un prefijo suelto.",
    );

    test(
      "isValidPhone: acepta E.164 completo",
      () => {
        expect(isValidPhone("+5355551234")).toBe(true);
      },
      "Un número en formato E.164 completo (prefijo + dígitos, sin empezar por 0) se considera válido y usable.",
    );

    test(
      "isValidPhone: rechaza prefijo solo, vacío y basura",
      () => {
        expect(isValidPhone("+53")).toBe(false);
        expect(isValidPhone("")).toBe(false);
        expect(isValidPhone(null)).toBe(false);
        expect(isValidPhone("abc")).toBe(false);
      },
      "No es un teléfono usable: solo el prefijo ('+53'), cadena vacía, null o texto no telefónico ('abc'). Regla compartida por cualquier feature que necesite un número real.",
    );

    test(
      "optionalPhoneSchema: acepta vacío, prefijo o número completo",
      () => {
        expect(optionalPhoneSchema.safeParse("").success).toBe(true);
        expect(optionalPhoneSchema.safeParse("+53").success).toBe(true);
        expect(optionalPhoneSchema.safeParse("+5355551234").success).toBe(true);
      },
      "Para un campo de teléfono OPCIONAL, el schema acepta tres estados: vacío (no se dio teléfono), solo prefijo (se eligió país sin escribir) y número completo. No bloquea el formulario por un teléfono a medias.",
    );

    test(
      "optionalPhoneSchema: rechaza texto no telefónico",
      () => {
        expect(optionalPhoneSchema.safeParse("abc").success).toBe(false);
      },
      "Aunque sea opcional, si hay contenido debe parecer un teléfono: 'abc' no es vacío ni prefijo ni número E.164, así que se rechaza.",
    );
  },
  { description: "Helpers y schema de teléfono E.164." },
);
