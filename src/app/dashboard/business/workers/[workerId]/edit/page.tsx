import WorkerEditClient from "./worker-edit-client";

export function generateStaticParams() {
  return [{ workerId: "__dynamic__" }];
}

export default function EditWorkerPage() {
  return <WorkerEditClient />;
}
