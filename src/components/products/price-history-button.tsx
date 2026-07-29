"use client";

import Link from "next/link";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProBadge } from "@/components/ui/pro-badge";
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan";
import { cn } from "@/lib/utils";

const PRICE_HISTORY_HREF = "/dashboard/business/products/price-history";

/**
 * En móvil el botón comparte fila con "Asignar producto", así que la etiqueta se
 * acorta para que quepa sin desbordar ni truncarse.
 */
function PriceHistoryLabel() {
  return (
    <>
      <span className="min-w-0 truncate sm:hidden">Historial</span>
      <span className="hidden sm:inline">Historial de precios</span>
    </>
  );
}

interface PriceHistoryButtonProps {
  className?: string;
}

export default function PriceHistoryButton({
  className,
}: PriceHistoryButtonProps) {
  const { hasFeature } = useUserRoleAndPlan();

  if (hasFeature("priceComparator")) {
    return (
      <Button asChild variant="outline" className={className}>
        <Link href={PRICE_HISTORY_HREF}>
          <History data-icon="inline-start" />
          <PriceHistoryLabel />
        </Link>
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex", className)}>
            <Button
              type="button"
              variant="outline"
              disabled
              aria-disabled="true"
              className="w-full cursor-not-allowed"
            >
              <History data-icon="inline-start" />
              <PriceHistoryLabel />
              <ProBadge className="ml-2" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Disponible en plan Pro</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
