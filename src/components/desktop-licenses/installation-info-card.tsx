import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DetailRow } from "@/components/business-providers/detail-row";
import { formatDateTimeShort, formatRelativeTime } from "@/lib/dates";
import { formatDay, formatInstallationCode } from "@/lib/desktop-licenses";
import { DASH } from "@/lib/utils";
import type { DesktopInstallation } from "@/lib/types/desktop-licenses";
import { LicenseExpiry } from "./license-status-badge";

export function InstallationInfoCard({
  installation,
}: {
  installation: DesktopInstallation;
}) {
  const {
    installationCode,
    businessName,
    ownerName,
    ownerEmail,
    ownerPhone,
    appVersion,
    trialStartedAt,
    registeredAt,
    lastSeenAt,
    licenseSeq,
    createdAt,
  } = installation;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-foreground">Datos</CardTitle>
        <CardDescription>
          Los envía el PC al conectarse; una alta a mano solo tiene lo que se
          escribió en el panel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <DetailRow label="Código">
            <span className="font-mono">
              {formatInstallationCode(installationCode)}
            </span>
          </DetailRow>
          <DetailRow label="Negocio">{businessName}</DetailRow>
          <DetailRow label="Dueño">{ownerName || DASH}</DetailRow>
          <DetailRow label="Correo">
            <span className="break-all">{ownerEmail || DASH}</span>
          </DetailRow>
          <DetailRow label="Teléfono">{ownerPhone || DASH}</DetailRow>
          <DetailRow label="Versión de la app">{appVersion || DASH}</DetailRow>
          <DetailRow label="Inicio de la prueba">
            {formatDay(trialStartedAt)}
          </DetailRow>
          <DetailRow label="Registrada">
            {registeredAt ? formatDateTimeShort(registeredAt) : "Nunca se ha conectado"}
          </DetailRow>
          <DetailRow label="Última conexión">
            {lastSeenAt ? (
              <span className="flex flex-col items-end">
                <span>{formatRelativeTime(lastSeenAt)}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {formatDateTimeShort(lastSeenAt)}
                </span>
              </span>
            ) : (
              "Nunca"
            )}
          </DetailRow>
          <DetailRow label="Vence">
            <span className="flex justify-end">
              <LicenseExpiry installation={installation} />
            </span>
          </DetailRow>
          <DetailRow label="Licencias emitidas">{licenseSeq}</DetailRow>
          <DetailRow label="Alta en el servidor">
            {formatDateTimeShort(createdAt)}
          </DetailRow>
        </div>
      </CardContent>
    </Card>
  );
}
