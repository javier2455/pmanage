import { Suspense } from "react";
import InstallationDetailClient from "./installation-detail-client";

export default function DesktopLicenseDetailPage() {
  return (
    <Suspense>
      <InstallationDetailClient />
    </Suspense>
  );
}
