import { Suspense } from "react";
import WorkerEditClient from "./worker-edit-client";

export default function EditWorkerPage() {
  return (
    <Suspense>
      <WorkerEditClient />
    </Suspense>
  );
}
