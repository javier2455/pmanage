import { describe, expect, it } from "vitest";
import { extractApiErrorMessage } from "./api-error";

/** Simula un AxiosError con el body que devolvió el gateway. */
function axiosErrorWith(data: unknown): unknown {
  return { isAxiosError: true, response: { status: 500, data } };
}

const FALLBACK = "Error al iniciar sesión. Intenta de nuevo.";

describe("extractApiErrorMessage", () => {
  it("desanida el JSON que el gateway mete dentro de `message` (login inválido)", () => {
    const error = axiosErrorWith({
      statusCode: 500,
      message: JSON.stringify({
        status: 400,
        message: "Credenciales inválidas",
        data: {
          statusCode: 400,
          message: "Credenciales inválidas",
          error: "Bad Request",
          path: "/auth/login",
        },
      }),
      error: "Internal Server Error",
    });

    expect(extractApiErrorMessage(error, FALLBACK)).toBe("Credenciales inválidas");
  });

  it("devuelve el message plano cuando el backend no lo envuelve", () => {
    const error = axiosErrorWith({ statusCode: 400, message: "Usuario no encontrado" });

    expect(extractApiErrorMessage(error, FALLBACK)).toBe("Usuario no encontrado");
  });

  it("une el arreglo de mensajes de class-validator", () => {
    const error = axiosErrorWith({ message: ["El correo es inválido", "La contraseña es corta"] });

    expect(extractApiErrorMessage(error, FALLBACK)).toBe(
      "El correo es inválido, La contraseña es corta",
    );
  });

  it("descarta los textos técnicos del transporte y cae al fallback", () => {
    const error = axiosErrorWith({ statusCode: 500, message: "Internal Server Error" });

    expect(extractApiErrorMessage(error, FALLBACK)).toBe(FALLBACK);
  });

  it("sin respuesta (red caída) usa el fallback", () => {
    expect(extractApiErrorMessage(new Error("Network Error"), FALLBACK)).toBe("Network Error");
    expect(extractApiErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
  });
});
