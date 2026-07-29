import { defineSuite, expect } from "@/testing/harness";
import { changePasswordSchema, loginSchema, registerSchema, verifySchema } from "@/lib/validations/auth";
import { planFormSchema } from "@/lib/validations/plans";
import { emptyFeatures } from "@/lib/plan-features";
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

/** Todas las capacidades del catálogo en `false`, que es como parte el alta. */
function allFeaturesOff() {
  return emptyFeatures();
}

/** Plan válido mínimo; cada test altera solo lo que quiere poner a prueba. */
function planValues(overrides: Record<string, unknown> = {}) {
  return {
    code: "pro",
    name: "Pro",
    description: null,
    type: "premium",
    tier: 2,
    currency: "USD",
    priceMonthly: 15,
    priceYearly: 144,
    maxProducts: 500,
    maxBusinesses: 3,
    maxWorkers: 5,
    features: allFeaturesOff(),
    trialDays: null,
    isActive: true,
    isPublic: true,
    displayOrder: 2,
    ...overrides,
  };
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
      "plan: caso feliz con todos los topes declarados",
      () => {
        expect(ok(planFormSchema, planValues())).toBe(true);
      },
      "Un plan completo (código, nombre, tipo, precios, los tres topes y las capacidades) pasa la validación. Es la forma que envía el formulario de administración.",
    );

    test(
      "plan: los tres topes admiten null como 'sin límite' explícito",
      () => {
        expect(
          ok(
            planFormSchema,
            planValues({ maxProducts: null, maxBusinesses: null, maxWorkers: null }),
          ),
        ).toBe(true);
      },
      "null significa 'sin límite' y es una elección deliberada del formulario (casilla 'Sin límite'). Se distingue de omitir el campo, que era lo que creaba planes ilimitados por descuido.",
    );

    test(
      "plan: omitir un tope invalida el formulario",
      () => {
        const { maxBusinesses, ...withoutLimit } = planValues();
        void maxBusinesses;
        expect(ok(planFormSchema, withoutLimit)).toBe(false);
      },
      "Omitir maxBusinesses no vale como 'sin límite': el backend interpretaba la ausencia como ilimitado, así que el schema obliga a declararlo (número o null).",
    );

    test(
      "plan: maxWorkers admite 0 pero productos y negocios exigen al menos 1",
      () => {
        expect(ok(planFormSchema, planValues({ maxWorkers: 0 }))).toBe(true);
        expect(ok(planFormSchema, planValues({ maxProducts: 0 }))).toBe(false);
        expect(ok(planFormSchema, planValues({ maxBusinesses: 0 }))).toBe(false);
      },
      "Un plan sin equipo (0 trabajadores) es una oferta legítima. En cambio un plan con 0 productos o 0 negocios no permitiría usar nada, así que se rechaza.",
    );

    test(
      "plan: el código solo admite slug en minúsculas",
      () => {
        expect(ok(planFormSchema, planValues({ code: "pro-anual" }))).toBe(true);
        expect(ok(planFormSchema, planValues({ code: "Pro Anual" }))).toBe(false);
        expect(ok(planFormSchema, planValues({ code: "-pro" }))).toBe(false);
      },
      "El código es la identidad estable del plan y viaja en URLs y integraciones: se restringe a minúsculas, números y guiones, empezando por letra o número.",
    );

    test(
      "plan: el precio anual no puede superar 12 mensualidades",
      () => {
        expect(ok(planFormSchema, planValues({ priceMonthly: 15, priceYearly: 144 }))).toBe(true);
        expect(ok(planFormSchema, planValues({ priceMonthly: 15, priceYearly: 1800 }))).toBe(false);
        expect(
          firstErrorPath(planFormSchema, planValues({ priceMonthly: 15, priceYearly: 1800 })),
        ).toBe("priceYearly");
      },
      "Pagar el año por adelantado nunca debería costar más que mes a mes; si ocurre es un cero de más al teclear. El error apunta a priceYearly, que es el campo a corregir.",
    );

    test(
      "plan: un plan inactivo no puede anunciarse en la vitrina",
      () => {
        expect(ok(planFormSchema, planValues({ isActive: false, isPublic: false }))).toBe(true);
        expect(ok(planFormSchema, planValues({ isActive: false, isPublic: true }))).toBe(false);
      },
      "Anunciar un plan que no se puede asignar lleva al usuario a un callejón sin salida: lo elige y la asignación falla. Inactivo y oculto sí es válido (plan retirado).",
    );

    test(
      "plan: rechaza tipo fuera del enum y precios negativos",
      () => {
        expect(ok(planFormSchema, planValues({ type: "ultra" }))).toBe(false);
        expect(ok(planFormSchema, planValues({ priceMonthly: -1 }))).toBe(false);
      },
      "El type debe estar en el enum free/basic/premium/enterprise ('ultra' falla) y ningún precio puede ser negativo.",
    );

    test(
      "plan: las capacidades deben venir completas y como booleanos",
      () => {
        expect(ok(planFormSchema, planValues({ features: { monthlyClose: true } }))).toBe(false);
        expect(
          ok(planFormSchema, planValues({ features: { ...allFeaturesOff(), providers: "sí" } })),
        ).toBe(false);
      },
      "El formulario envía una casilla por capacidad, así que el objeto llega con todas las claves del catálogo y valores booleanos. Un objeto parcial o con valores de otro tipo indica que el formulario y el catálogo se han desincronizado.",
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
