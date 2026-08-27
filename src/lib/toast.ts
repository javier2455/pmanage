import { isAxiosError } from "axios";
import { sileo } from "sileo";
import { extractApiErrorMessage } from "@/lib/api-error";

/**
 * Estilos compartidos para los toasts del sistema. Se usan en combinación
 * con `fill: ""` (success) para que el texto sea blanco sobre el fondo de
 * color, y con un rojo personalizado en el caso de error.
 */
export const SUCCESS_TOAST_STYLES = {
  title: "text-white! text-[16px]! font-bold!",
  description: "text-white/90! text-[15px]!",
};

export const ERROR_TOAST_STYLES = {
  description: "text-[#dc2626]/90! text-[15px]!",
};

interface ToastPayload {
  title: string;
  description?: string;
}

/** Helper para toast de éxito alineado al estilo del sistema. */
export function toastSuccess({ title, description }: ToastPayload) {
  sileo.success({
    title,
    fill: "",
    styles: SUCCESS_TOAST_STYLES,
    description,
  });
}

/** Helper para toast de error alineado al estilo del sistema. */
export function toastError({ title, description }: ToastPayload) {
  sileo.error({
    title,
    styles: ERROR_TOAST_STYLES,
    description,
  });
}

/**
 * Toast de error para un fallo de API.
 *
 * Toma `error`/`message` de la respuesta del backend cuando el fallo viene con
 * ella, y cae a `fallback` cuando es un error de red o inesperado. Existe para
 * no repetir el mismo `isAxiosError` con sus dos ramas en cada `catch`.
 */
/**
 * Mensaje de error que manda el backend, o `undefined` si el fallo no viene de
 * la API (red caída, error inesperado).
 *
 * NestJS manda un array de mensajes cuando falla la validación de varios campos;
 * sin unirlos, React los pegaría sin separación. Sirve para rellenar el error de
 * un formulario (`setError("root")`) además de mostrarlo en un toast.
 *
 * Delega en `extractApiErrorMessage` para no pintar envoltorios crudos: los
 * endpoints que pasan por el gateway DveloxSoft devolvían el error del
 * microservicio como JSON serializado dentro de `message`.
 */
export function apiMessage(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  return extractApiErrorMessage(error, "") || undefined;
}

/**
 * Título del toast. `data.error` es el nombre HTTP del fallo y a veces llega
 * como código (`BAD_REQUEST`, `INTERNAL_SERVER_ERROR`): eso no se le muestra al
 * usuario, se cae a "Error".
 */
function apiErrorTitle(error: unknown): string {
  const raw = isAxiosError(error) ? error.response?.data?.error : undefined;
  if (typeof raw !== "string" || !raw.trim()) return "Error";
  const looksTechnical = raw.includes("_") || raw === raw.toUpperCase();
  return looksTechnical ? "Error" : raw;
}

export function toastApiError(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    toastError({
      title: apiErrorTitle(error),
      description: apiMessage(error) ?? fallback,
    });
    return;
  }

  toastError({ title: "Error", description: fallback });
}
