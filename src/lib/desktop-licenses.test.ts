import { describe, expect, it } from "vitest";
import {
  buildWhatsAppMessage,
  businessToday,
  daysUntil,
  formatDay,
  formatInstallationCode,
  formatPaymentAmount,
  getLicenseStatus,
  isDuplicateCodeError,
  isValidInstallationCode,
  licenseErrorMessage,
  normalizeInstallationCode,
} from "./desktop-licenses";

/** Mediodía en La Habana del 2 de octubre de 2026 (UTC-4 en horario de verano). */
const NOW = new Date("2026-10-02T16:00:00.000Z");

/** Simula un AxiosError con el status y el body del backend. */
function axiosErrorWith(status: number, data: unknown = {}): unknown {
  return { isAxiosError: true, response: { status, data } };
}

describe("código de instalación", () => {
  it("normaliza espacios, guiones y minúsculas", () => {
    expect(normalizeInstallationCode(" a1b2-c3d4 e5f6-7890 ")).toBe(
      "A1B2C3D4E5F67890",
    );
  });

  it("valida 16 hexadecimales", () => {
    expect(isValidInstallationCode("A1B2C3D4E5F67890")).toBe(true);
    expect(isValidInstallationCode("A1B2C3D4E5F6789")).toBe(false);
    expect(isValidInstallationCode("A1B2C3D4E5F6789G")).toBe(false);
    expect(isValidInstallationCode("A1B2-C3D4-E5F6-7890")).toBe(false);
  });

  it("formatea en grupos de cuatro", () => {
    expect(formatInstallationCode("a1b2c3d4e5f67890")).toBe(
      "A1B2-C3D4-E5F6-7890",
    );
    expect(formatInstallationCode("A1B2-C3D4-E5F6-7890")).toBe(
      "A1B2-C3D4-E5F6-7890",
    );
  });

  it("deja tal cual un valor que no es un código", () => {
    expect(formatInstallationCode("abc")).toBe("abc");
  });
});

describe("fechas", () => {
  it("formatea un día sin correrlo por la zona horaria", () => {
    expect(formatDay("2026-11-02")).toBe("02/11/2026");
    expect(formatDay(null)).toBe("—");
    expect(formatDay("no es fecha")).toBe("—");
  });

  it("calcula hoy en La Habana, no en UTC", () => {
    // 02:00 UTC del día 3 son las 22:00 del día 2 en Cuba.
    expect(businessToday(new Date("2026-10-03T02:00:00.000Z"))).toBe(
      "2026-10-02",
    );
  });

  it("cuenta los días que faltan", () => {
    expect(daysUntil("2026-10-02", NOW)).toBe(0);
    expect(daysUntil("2026-10-09", NOW)).toBe(7);
    expect(daysUntil("2026-10-01", NOW)).toBe(-1);
    // Cruza el cambio de horario (1 de noviembre) sin perder un día.
    expect(daysUntil("2026-11-02", NOW)).toBe(31);
  });
});

describe("getLicenseStatus", () => {
  it("prueba: sin vencimiento y con la prueba empezada", () => {
    expect(
      getLicenseStatus(
        { expiresOn: null, trialStartedAt: "2026-09-25T10:00:00.000Z" },
        NOW,
      ),
    ).toEqual({ kind: "trial", daysLeft: null });
  });

  it("sin licencia: alta a mano que aún no se conectó", () => {
    expect(
      getLicenseStatus({ expiresOn: null, trialStartedAt: null }, NOW),
    ).toEqual({ kind: "none", daysLeft: null });
  });

  it("vence pronto a 7 días o menos, incluido hoy", () => {
    expect(
      getLicenseStatus({ expiresOn: "2026-10-09", trialStartedAt: null }, NOW),
    ).toEqual({ kind: "expiring", daysLeft: 7 });
    expect(
      getLicenseStatus({ expiresOn: "2026-10-02", trialStartedAt: null }, NOW)
        .kind,
    ).toBe("expiring");
  });

  it("activa con más de 7 días y vencida si ya pasó", () => {
    expect(
      getLicenseStatus({ expiresOn: "2026-10-10", trialStartedAt: null }, NOW),
    ).toEqual({ kind: "active", daysLeft: 8 });
    expect(
      getLicenseStatus(
        { expiresOn: "2026-09-30", trialStartedAt: "2026-08-01T10:00:00Z" },
        NOW,
      ),
    ).toEqual({ kind: "expired", daysLeft: -2 });
  });
});

describe("formatPaymentAmount", () => {
  it("acepta el decimal como número o como string", () => {
    expect(formatPaymentAmount(25, "USD")).toBe("25.00 USD");
    expect(formatPaymentAmount("1500.5", "CUP")).toBe("1,500.50 CUP");
  });

  it("sin moneda muestra solo el importe y sin importe, guion", () => {
    expect(formatPaymentAmount(10, null)).toBe("10.00");
    expect(formatPaymentAmount(null, "USD")).toBe("—");
  });
});

describe("buildWhatsAppMessage", () => {
  it("saluda por el nombre e incluye el vencimiento y el código", () => {
    const message = buildWhatsAppMessage({
      ownerName: "  Ana María Pérez ",
      expiresOn: "2026-11-02",
      licenseText: "NGL1.abc.def",
    });

    expect(message.startsWith("Hola, Ana.")).toBe(true);
    expect(message).toContain(
      "Tu licencia de Negora queda renovada hasta el 02/11/2026.",
    );
    expect(message).toContain("Si el PC tiene internet");
    expect(message).toContain(
      "Si el PC no tiene internet, abre Negora → Licencia y pega este código:",
    );
    expect(message.endsWith("\nNGL1.abc.def")).toBe(true);
  });

  it("sin nombre saluda sin más", () => {
    const message = buildWhatsAppMessage({
      ownerName: null,
      expiresOn: "2026-11-02",
      licenseText: "NGL1.abc.def",
    });
    expect(message.startsWith("Hola.\n")).toBe(true);
  });
});

describe("licenseErrorMessage", () => {
  const FALLBACK = "No se pudo guardar.";

  it("traduce los casos conocidos por código HTTP", () => {
    expect(
      licenseErrorMessage(
        axiosErrorWith(409, { message: "Installation already exists" }),
        FALLBACK,
      ),
    ).toBe("Ya existe una instalación con ese código.");
    expect(licenseErrorMessage(axiosErrorWith(503), FALLBACK)).toContain(
      "clave de firma",
    );
    expect(licenseErrorMessage(axiosErrorWith(403), FALLBACK)).toContain(
      "administrador",
    );
    expect(licenseErrorMessage(axiosErrorWith(404), FALLBACK)).toContain(
      "No se encontró",
    );
  });

  it("el resto cae al mensaje del backend o al fallback", () => {
    expect(
      licenseErrorMessage(
        axiosErrorWith(400, { message: ["months must not be greater than 24"] }),
        FALLBACK,
      ),
    ).toBe("months must not be greater than 24");
    expect(licenseErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
  });

  it("detecta el código duplicado", () => {
    expect(isDuplicateCodeError(axiosErrorWith(409))).toBe(true);
    expect(isDuplicateCodeError(axiosErrorWith(400))).toBe(false);
  });
});
