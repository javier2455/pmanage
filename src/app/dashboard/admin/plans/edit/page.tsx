import { Suspense } from "react";
import PlanEditClient from "./plan-edit-client";

export default function EditPlanPage() {
  return (
    <Suspense>
      <PlanEditClient />
    </Suspense>
  );
}
