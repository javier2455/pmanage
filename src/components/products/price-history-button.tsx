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

const PRICE_HISTORY_HREF = "/dashboard/business/products/price-history";

export default function PriceHistoryButton() {
  const { isProPlan } = useUserRoleAndPlan();

  if (isProPlan) {
    return (
      <Button asChild variant="outline">
        <Link href={PRICE_HISTORY_HREF}>
          <History data-icon="inline-start" />
          Historial de precios
        </Link>
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              variant="outline"
              disabled
              aria-disabled="true"
              className="cursor-not-allowed"
            >
              <History data-icon="inline-start" />
              Historial de precios
              <ProBadge className="ml-2" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Disponible en plan Pro</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
