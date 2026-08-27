import axios from "axios";

/**
 * Extrae el mensaje legible de un error del backend.
 *
 * El gateway v2 no propaga tal cual el error del microservicio: lo envuelve
 * como *string JSON* dentro de `message` y responde 500. Un login con
 * credenciales incorrectas llega así:
 *
 *   { statusCode: 500,
 *     message: '{"status":400,"message":"Credenciales inválidas","data":{…}}',
 *     error: "Internal Server Error" }
 *
 * Leer `response.data.message` a secas pintaba ese JSON completo en pantalla.
 * Aquí desanidamos hasta encontrar el texto real ("Credenciales inválidas").
 */
const MAX_DEPTH = 6;

/** Textos técnicos del transporte HTTP: nunca son un mensaje para el usuario. */
const TECHNICAL_MESSAGES = new Set([
  "bad request",
  "internal server error",
  "unauthorized",
  "forbidden",
  "not found",
  "request failed with status code 500",
]);

function unwrap(value: unknown, depth: number): string | null {
  if (depth > MAX_DEPTH) return null;

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return null;
    // Un message que es JSON serializado: seguimos bajando por el envoltorio.
    if (text.startsWith("{") || text.startsWith("[")) {
      try {
        const inner = unwrap(JSON.parse(text), depth + 1);
        if (inner) return inner;
      } catch {
        // No era JSON válido: el string ya es el mensaje final.
      }
    }
    return TECHNICAL_MESSAGES.has(text.toLowerCase()) ? null : text;
  }

  // class-validator devuelve `message` como arreglo de strings.
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => unwrap(item, depth + 1))
      .filter((part): part is string => Boolean(part));
    return parts.length ? parts.join(", ") : null;
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return (
      unwrap(obj.message, depth + 1) ??
      unwrap(obj.mensaje, depth + 1) ??
      unwrap(obj.data, depth + 1)
    );
  }

  return null;
}

export function extractApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError(error)) {
    return unwrap(error.response?.data, 0) ?? fallback;
  }
  if (error instanceof Error) {
    return unwrap(error.message, 0) ?? fallback;
  }
  return fallback;
}
