import { redirect } from "next/navigation";

export function generateStaticParams() {
  return [{ businessProductId: "__dynamic__" }];
}

export default function EditProductPage() {
  redirect("/dashboard/business/products");
}
