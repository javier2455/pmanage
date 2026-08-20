import { isAxiosError } from "axios";
import { sileo } from "sileo";

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
export function toastApiError(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    toastError({
      title: error.response?.data?.error ?? "Error",
      description: error.response?.data?.message ?? fallback,
    });
    return;
  }

  toastError({ title: "Error", description: fallback });
}
