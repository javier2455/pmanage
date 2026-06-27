import { defineSuite, expect } from "@/testing/harness";
import { changePasswordSchema, loginSchema, registerSchema, verifySchema } from "@/lib/validations/auth";
import { createPlanSchema } from "@/lib/validations/plans";
import { workerFormSchema } from "@/lib/validations/workers";
import { deactivateAccountSchema, updateUserSchema } from "@/lib/validations/user";
import type { z } from "zod";

/** ¿`schema` acepta `value`? */
function ok(schema: { safeParse: (v: unknown) => z.ZodSafeParseResult<unknown> }, value: unknown): boolean {
  return schema.safeParse(value).success;
}

/** Primer `path[0]` del error de validación (para verificar a qué campo apunta). */
function firstErrorPath(
  schema: { safeParse: (v: unknown) => z.ZodSafeParseResult<unknown> },
  value: unknown,
): PropertyKey | undefined {
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.path[0];
}

export const validationsSuite = defineSuite(
  "validations · schemas Zod de formularios",
  ({ test }) => {
    test(
      "login: acepta email válido + password ≥ 8",
      () => {
        expect(ok(loginSchema, { email: "a@b.com", password: "12345678" })).toBe(true);
      },
      "El formulario de login acepta un email con formato válido y una contraseña de al menos 8 caracteres. Caso feliz que debe pasar la validación.",
    );

    test(
      "login: rechaza email inválido o password corta",
      () => {
        expect(ok(loginSchema, { email: "no-email", password: "12345678" })).toBe(false);
        expect(ok(loginSchema, { email: "a@b.com", password: "123" })).toBe(false);
      },
      "Rechaza si el email no tiene formato válido ('no-email') o si la contraseña tiene menos de 8 caracteres ('123'). Cada regla bloquea el envío del formulario.",
    );

    test(
      "register: contraseñas distintas → error en confirmPassword",
      () => {
        const value = {
          name: "Ana",
          email: "a@b.com",
          password: "12345678",
          confirmPassword: "87654321",
        };
        expect(ok(registerSchema, value)).toBe(false);
        expect(firstErrorPath(registerSchema, value)).toBe("confirmPassword");
      },
      "El registro tiene un refine que exige password === confirmPassword. Con contraseñas distintas, la validación falla Y el error apunta al campo confirmPassword (para mostrarlo bajo ese input).",
    );

    test(
      "register: contraseñas iguales → válido",
      () => {
        expect(
          ok(registerSchema, {
            name: "Ana",
            email: "a@b.com",
            password: "12345678",
            confirmPassword: "12345678",
          }),
        ).toBe(true);
      },
      "Con nombre, email válido y ambas contraseñas iguales (≥ 8), el registro pasa la validación completa incluyendo el refine de coincidencia.",
    );

    test(
      "changePassword: rechaza si no coinciden",
      () => {
        expect(
          ok(changePasswordSchema, { password: "12345678", confirmPassword: "x2345678" }),
        ).toBe(false);
      },
      "El cambio de contraseña usa el mismo refine de coincidencia: si password y confirmPassword difieren, la validación falla.",
    );

    test(
      "verify: exige exactamente 6 dígitos",
      () => {
        expect(ok(verifySchema, { code: "123456" })).toBe(true);
        expect(ok(verifySchema, { code: "12345" })).toBe(false);
        expect(ok(verifySchema, { code: "abcdef" })).toBe(false);
      },
      "El código de verificación debe tener exactamente 6 caracteres y ser solo dígitos. '123456' pasa; '12345' (5 dígitos) y 'abcdef' (letras) fallan.",
    );

    test(
      "createPlan: válido con price nulo y maxProducts ≥ 1",
      () => {
        expect(
          ok(createPlanSchema, {
            name: "Pro",
            type: "premium",
            price: null,
            maxProducts: 500,
            isActive: true,
          }),
        ).toBe(true);
      },
      "Crear un plan admite price null (plan sin precio definido) siempre que maxProducts sea ≥ 1 y el type sea uno válido. Caso feliz con type 'premium'.",
    );

    test(
      "createPlan: rechaza maxProducts 0, price negativo y type inválido",
      () => {
        const base = { name: "X", type: "basic", price: 5, maxProducts: 10, isActive: true };
        expect(ok(createPlanSchema, { ...base, maxProducts: 0 })).toBe(false);
        expect(ok(createPlanSchema, { ...base, price: -1 })).toBe(false);
        expect(ok(createPlanSchema, { ...base, type: "ultra" })).toBe(false);
      },
      "Tres reglas de negocio del plan: maxProducts debe ser > 0 (0 falla), el precio no puede ser negativo (-1 falla) y el type debe estar en el enum free/basic/premium/enterprise ('ultra' falla).",
    );

    test(
      "worker: nombre, email válido y cargo requeridos",
      () => {
        expect(
          ok(workerFormSchema, { name: "Ana", email: "a@b.com", job: "Cajera" }),
        ).toBe(true);
        expect(ok(workerFormSchema, { name: "Ana", email: "x", job: "Cajera" })).toBe(false);
        expect(ok(workerFormSchema, { name: "Ana", email: "a@b.com", job: "" })).toBe(false);
      },
      "El alta de trabajador exige nombre, email con formato válido y cargo no vacío. Pasa con datos completos; falla con email inválido ('x') o cargo vacío. El teléfono es opcional.",
    );

    test(
      "updateUser: password vacía permitida; corta rechazada",
      () => {
        expect(ok(updateUserSchema, {})).toBe(true);
        expect(ok(updateUserSchema, { password: "" })).toBe(true);
        expect(ok(updateUserSchema, { password: "123" })).toBe(false);
      },
      "Al editar el perfil, todos los campos son opcionales: objeto vacío pasa. La contraseña vacía ('') es válida (significa 'no cambiar'), pero si se escribe algo debe tener ≥ 8 caracteres ('123' falla).",
    );

    test(
      "updateUser: password válida pero confirm distinta → error",
      () => {
        const value = { password: "12345678", confirmPassword: "x2345678" };
        expect(ok(updateUserSchema, value)).toBe(false);
        expect(firstErrorPath(updateUserSchema, value)).toBe("confirmPassword");
      },
      "Si se cambia la contraseña (no vacía), debe coincidir con la confirmación. Distintas → falla con el error apuntando a confirmPassword.",
    );

    test(
      "deactivateAccount: exige confirm === true",
      () => {
        expect(ok(deactivateAccountSchema, { confirm: true })).toBe(true);
        expect(ok(deactivateAccountSchema, { confirm: false })).toBe(false);
      },
      "Para desactivar la cuenta, el checkbox de confirmación debe estar marcado: confirm true pasa, false falla. Evita desactivaciones accidentales sin confirmación explícita.",
    );

    test(
      "deactivateAccount: rechaza motivo > 500 caracteres",
      () => {
        expect(
          ok(deactivateAccountSchema, { confirm: true, reason: "x".repeat(501) }),
        ).toBe(false);
      },
      "El motivo de desactivación es opcional pero está limitado a 500 caracteres. Un texto de 501 caracteres supera el límite y falla la validación.",
    );
  },
  { description: "Reglas de aceptación/rechazo de los formularios principales." },
);
