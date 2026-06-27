import { redirect } from "next/navigation"

export function generateStaticParams() {
  return [{ providerId: "__dynamic__" }]
}

export default function EditProviderPage() {
  redirect("/dashboard/business/providers")
}
