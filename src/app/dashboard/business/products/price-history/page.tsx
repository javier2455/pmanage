"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, LineChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import PriceHistoryProductSelector from "@/components/products/price-history-product-selector";
import PriceHistoryView from "@/components/products/price-history-view";
import type { ProductToShowInTable } from "@/lib/types/product";

export default function ProductPriceHistoryPage() {
  const [selectedBusinessProduct, setSelectedBusinessProduct] =
    React.useState<ProductToShowInTable | null>(null);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/business/products"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Historial de precios
          </h1>
          <p className="text-muted-foreground">
            Selecciona un producto para consultar sus cambios de precio.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <PriceHistoryProductSelector
            value={selectedBusinessProduct?.id ?? null}
            onChange={(_, item) => setSelectedBusinessProduct(item)}
          />
        </CardContent>
      </Card>

      {selectedBusinessProduct ? (
        <PriceHistoryView
          key={selectedBusinessProduct.id}
          businessProduct={selectedBusinessProduct}
        />
      ) : (
        <Card>
          <CardContent className="p-6">
            <Empty className="border-border border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LineChart />
                </EmptyMedia>
                <EmptyTitle>Sin producto seleccionado</EmptyTitle>
                <EmptyDescription>
                  Elige un producto en el selector para ver su historial de
                  precios.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
