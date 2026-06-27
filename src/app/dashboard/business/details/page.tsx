import { Suspense } from "react";
import { BusinessDetailsTabs } from "@/components/business/business-details-tabs";

export default function BusinessDetailsPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Detalles del negocio
        </h1>
        <p className="text-muted-foreground">
          Información del negocio actual
        </p>
      </div>
      <Suspense>
        <BusinessDetailsTabs />
      </Suspense>
    </div>
  );
}
