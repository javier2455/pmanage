"use client";

import * as React from "react";
import { History } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProBadge } from "@/components/ui/pro-badge";
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan";
import { cn } from "@/lib/utils";
import PriceHistoryDialog from "./price-history-dialog";

interface PriceHistoryTriggerProps {
  productId: string;
  productName?: string;
}

const itemBaseClass =
  "flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors";

export default function PriceHistoryTrigger({
  productId,
  productName,
}: PriceHistoryTriggerProps) {
  const { isProPlan } = useUserRoleAndPlan();
  const [open, setOpen] = React.useState(false);

  if (!isProPlan) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block">
              <button
                type="button"
                disabled
                aria-disabled="true"
                className={cn(
                  itemBaseClass,
                  "cursor-not-allowed text-muted-foreground opacity-70",
                )}
              >
                <History className="size-4 text-amber-600 dark:text-amber-400" />
                <span>Historial de precios</span>
                <ProBadge />
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="left">
            Disponible en plan Pro
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(itemBaseClass, "cursor-pointer hover:bg-muted")}
      >
        <History className="size-4 text-amber-600 dark:text-amber-400" />
        <span>Historial de precios</span>
      </button>
      <PriceHistoryDialog
        productId={productId}
        productName={productName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
