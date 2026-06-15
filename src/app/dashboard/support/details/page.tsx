import { Suspense } from "react";
import SupportDetailClient from "./support-detail-client";

export default function SupportDetailPage() {
  return (
    <Suspense>
      <SupportDetailClient />
    </Suspense>
  );
}
