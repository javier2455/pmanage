import { redirect } from "next/navigation";

export function generateStaticParams() {
  return [{ productId: "__dynamic__" }];
}

export default function EditCatalogProductPage() {
  redirect("/dashboard/business/products/catalog");
}
