/**
 * Instalación de la app de escritorio (negora-desktop) registrada en el
 * servidor de Negora. Los campos coinciden con el contrato del módulo
 * `desktop-licenses` de psearch-back (ver negora-desktop/docs/plan/
 * 12-trozo-10a-licencias.md). Una instalación dada de alta a mano en el panel
 * que todavía no se ha conectado no tiene dueño, versión ni última conexión.
 */
export interface DesktopInstallation {
  id: string;
  /** 16 hexadecimales en mayúsculas, `XXXX-XXXX-XXXX-XXXX`. */
  installationCode: string;
  businessName: string;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  appVersion: string | null;
  trialStartedAt: string | null;
  registeredAt: string | null;
  lastSeenAt: string | null;
  /** Último día válido (`YYYY-MM-DD`, día local del negocio). Null = sin pagos. */
  expiresOn: string | null;
  licenseSeq: number;
  /** Licencia firmada vigente (`NGL1.…`), el "código de renovación". */
  licenseText: string | null;
  duplicateSuspected: boolean;
  notes: string | null;
  createdAt: string;
}

export interface DesktopLicensePayment {
  id: string;
  months: number;
  /** El backend puede devolver el decimal como string. */
  amount: number | string | null;
  currency: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
}

/** Detalle (`GET /:code`): la instalación con sus pagos, más nuevos primero. */
export interface DesktopInstallationDetail extends DesktopInstallation {
  payments: DesktopLicensePayment[];
}

export interface GetDesktopInstallationsResponse {
  data: DesktopInstallation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Alta a mano: cliente que paga al instalar y el PC no tiene internet. */
export interface CreateDesktopInstallationProps {
  installationCode: string;
  businessName: string;
  ownerName?: string;
  ownerPhone?: string;
  notes?: string;
}

export interface UpdateDesktopInstallationProps {
  notes?: string;
  businessName?: string;
  /** Solo se puede apagar: "Marcar como revisado". */
  duplicateSuspected?: false;
}

export interface AddDesktopLicensePaymentProps {
  months: number;
  amount?: number;
  currency?: string;
  note?: string;
}

/**
 * Número de WhatsApp al que escriben los clientes del escritorio para pagar o
 * renovar. La lista es una sola para todas las instalaciones y llega ordenada.
 */
export interface DesktopLicenseContact {
  id: string;
  /** `+` y de 8 a 15 dígitos, sin espacios: `+5354600851`. */
  phone: string;
  label: string | null;
  position: number;
}

export interface DesktopLicenseContactsResponse {
  data: DesktopLicenseContact[];
}

/** Sustituye la lista entera (de 0 a 5 números), en el orden en que se manda. */
export interface UpdateDesktopLicenseContactsProps {
  contacts: { phone: string; label?: string }[];
}
