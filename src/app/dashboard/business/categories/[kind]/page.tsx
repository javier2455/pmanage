import { Suspense } from "react";
import CategoriesKindClient from "./categories-kind-client";

export function generateStaticParams() {
  return [{ kind: "expenses" }, { kind: "products" }];
}

export default function CategoriesKindPage() {
  return (
    <Suspense>
      <CategoriesKindClient />
    </Suspense>
  );
}
