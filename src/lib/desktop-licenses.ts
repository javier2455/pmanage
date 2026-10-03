/**
 * Lógica pura del panel de licencias de la app de escritorio: código de
 * instalación, fechas, estado del vencimiento, mensaje de WhatsApp y errores.
 * Sin React ni APIs de navegador, para poder probarla con Vitest.
 */

import { isAxiosError } from "axios";
import { extractApiErrorMessage } from "@/lib/api-error";
import { formatAmount, formatMoney } from "@/lib/currency";
import { DASH } from "@/lib/utils";

/* ---------------------------- Código de instalación --------------------------- */

const INSTALLATION_CODE_PATTERN = /^[0-9A-F]{16}$/;

/**
 * Deja el código como 16 caracteres seguidos en mayúsculas: el cliente lo dicta
 * o lo copia con espacios, guiones o en minúsculas.
 */
export function normalizeInstallationCode(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

/** ¿Es un código normalizado válido (16 hexadecimales)? */
export function isValidInstallationCode(normalized: string): boolean {
  return INSTALLATION_CODE_PATTERN.test(normalized);
}

/**
 * Forma canónica `XXXX-XXXX-XXXX-XXXX`, la misma que muestra el escritorio y la
 * que va dentro de la licencia. Si el valor no es un código válido se devuelve
 * tal cual, para no inventar uno al pintarlo.
 */
export function formatInstallationCode(code: string): string {
  const normalized = normalizeInstallationCode(code);
  if (!isValidInstallationCode(normalized)) return code;
  return normalized.match(/.{4}/g)!.join("-");
}

/* ----------------------------------- Fechas ----------------------------------- */

/**
 * Zona del negocio: el `expiresOn` de la licencia es un día local de Cuba, así
 * que "hoy" se calcula ahí aunque el administrador esté en otro país.
 */
const BUSINESS_TIME_ZONE = "America/Havana";

const DAY_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "Hoy" en la zona del negocio, como `YYYY-MM-DD`. */
export function businessToday(now: Date = new Date()): string {
  // `en-CA` formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Fecha como `DD/MM/AAAA`. Acepta un día (`YYYY-MM-DD`, se lee sin zona: pasarlo
 * por `new Date` lo correría un día hacia atrás en Cuba) o un ISO con hora (se
 * muestra el día local).
 */
export function formatDay(value: string | null | undefined): string {
  if (!value) return DASH;
  const day = DAY_ONLY_PATTERN.exec(value);
  if (day) return `${day[3]}/${day[2]}/${day[1]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return DASH;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function dayToUtc(day: string): number {
  const [year, month, date] = day.split("-").map(Number);
  return Date.UTC(year, month - 1, date);
}

/** Días que faltan hasta `expiresOn` (0 = vence hoy, negativo = ya venció). */
export function daysUntil(expiresOn: string, now: Date = new Date()): number {
  const ms = dayToUtc(expiresOn) - dayToUtc(businessToday(now));
  return Math.round(ms / 86_400_000);
}

/* ---------------------------- Estado del vencimiento --------------------------- */

/** Desde cuántos días antes se avisa (igual que el escritorio). */
export const EXPIRING_SOON_DAYS = 7;

export type LicenseStatusKind =
  /** Nunca ha pagado y la prueba empezó. */
  | "trial"
  /** Licencia vigente con más de 7 días por delante. */
  | "active"
  /** Licencia vigente que vence en 7 días o menos. */
  | "expiring"
  /** La licencia ya venció. */
  | "expired"
  /** Ni pagos ni prueba (alta a mano que aún no se conectó). */
  | "none";

export interface LicenseStatus {
  kind: LicenseStatusKind;
  /** Solo cuando hay `expiresOn`. */
  daysLeft: number | null;
}

export function getLicenseStatus(
  installation: { expiresOn: string | null; trialStartedAt: string | null },
  now: Date = new Date(),
): LicenseStatus {
  const { expiresOn, trialStartedAt } = installation;
  if (!expiresOn) {
    return { kind: trialStartedAt ? "trial" : "none", daysLeft: null };
  }
  const daysLeft = daysUntil(expiresOn, now);
  if (daysLeft < 0) return { kind: "expired", daysLeft };
  if (daysLeft <= EXPIRING_SOON_DAYS) return { kind: "expiring", daysLeft };
  return { kind: "active", daysLeft };
}

/* ------------------------------------ Pagos ----------------------------------- */

/** Monedas en las que se cobra la licencia (mismos códigos que el resto de la app). */
export const LICENSE_PAYMENT_CURRENCIES = ["USD", "CUP", "EURO", "MLC"] as const;

/** Atajos de meses del formulario de pago. */
export const PAYMENT_MONTH_PRESETS = [1, 3, 6, 12] as const;

export const PAYMENT_MONTHS_MIN = 1;
export const PAYMENT_MONTHS_MAX = 24;

/** Importe del pago con su moneda; el decimal puede llegar como string. */
export function formatPaymentAmount(
  amount: number | string | null,
  currency: string | null,
): string {
  if (amount === null || amount === "") return DASH;
  const value = Number(amount);
  if (!Number.isFinite(value)) return DASH;
  return currency ? formatMoney(value, currency) : formatAmount(value);
}

/* ---------------------------------- WhatsApp ---------------------------------- */

/**
 * Mensaje listo para mandar al dueño tras una renovación. Con internet la
 * licencia le llega sola; sin internet tiene que pegar el código a mano.
 */
export function buildWhatsAppMessage({
  ownerName,
  expiresOn,
  licenseText,
}: {
  ownerName: string | null;
  expiresOn: string;
  licenseText: string;
}): string {
  const firstName = ownerName?.trim().split(/\s+/)[0];
  return [
    firstName ? `Hola, ${firstName}.` : "Hola.",
    "",
    `Tu licencia de Negora queda renovada hasta el ${formatDay(expiresOn)}.`,
    "",
    "Si el PC tiene internet, la renovación llega sola en menos de una hora (o al momento pulsando «Comprobar ahora» en Negora → Licencia).",
    "Si el PC no tiene internet, abre Negora → Licencia y pega este código:",
    "",
    licenseText,
  ].join("\n");
}

/* ----------------------------------- Errores ---------------------------------- */

/**
 * El backend responde en inglés; los casos que el administrador se encuentra de
 * verdad se traducen por código HTTP. El resto cae al mensaje del backend.
 */
const ERROR_BY_STATUS: Record<number, string> = {
  403: "Solo un administrador puede gestionar las licencias de escritorio.",
  404: "No se encontró la instalación o el pago. Recarga la página.",
  409: "Ya existe una instalación con ese código.",
  503: "Falta configurar la clave de firma en el servidor: no se puede emitir la licencia.",
};

export function licenseErrorMessage(error: unknown, fallback: string): string {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return (
    (status ? ERROR_BY_STATUS[status] : undefined) ??
    extractApiErrorMessage(error, fallback)
  );
}

/** ¿El fallo es porque el código ya existe? (para marcar el campo). */
export function isDuplicateCodeError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 409;
}
