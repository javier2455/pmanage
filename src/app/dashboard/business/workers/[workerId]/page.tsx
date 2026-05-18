import { redirect } from "next/navigation";

export function generateStaticParams() {
  return [{ workerId: "__dynamic__" }];
}

export default function WorkerDetailsPage() {
  redirect("/dashboard/business/workers");
}
