"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { Product } from "@/lib/types/product";

export default function ProductPriceHistoryPage() {
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null,
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button asChild variant="ghost" className="w-fit -ml-2">
          <Link href="/dashboard/business/products">
            <ArrowLeft data-icon="inline-start" />
            Volver a productos
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Historial de precios
        </h1>
        <p className="text-muted-foreground">
          Selecciona un producto para consultar sus cambios de precio.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <PriceHistoryProductSelector
            value={selectedProduct?.id ?? null}
            onChange={(_, product) => setSelectedProduct(product)}
          />
        </CardContent>
      </Card>

      {selectedProduct ? (
        <PriceHistoryView
          key={selectedProduct.id}
          product={selectedProduct}
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
