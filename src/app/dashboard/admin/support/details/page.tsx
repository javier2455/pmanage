import { Suspense } from "react";
import AdminSupportDetailClient from "./admin-support-detail-client";

export default function AdminSupportDetailPage() {
  return (
    <Suspense>
      <AdminSupportDetailClient />
    </Suspense>
  );
}
