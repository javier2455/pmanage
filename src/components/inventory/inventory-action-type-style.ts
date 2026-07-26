import {
  InventoryActionType,
  inventoryActionTypeLabels,
} from "@/lib/types/inventory";

export type InventoryActionTypeStyle = {
  label: string;
  dotClassName: string;
  badgeClassName: string;
};

export const inventoryActionTypeStyle: Record<
  InventoryActionType,
  InventoryActionTypeStyle
> = {
  [InventoryActionType.PURCHASE]: {
    label: inventoryActionTypeLabels[InventoryActionType.PURCHASE],
    dotClassName: "bg-primary ring-primary/20",
    badgeClassName:
      "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15",
  },
  [InventoryActionType.CANCEL_SALE]: {
    label: inventoryActionTypeLabels[InventoryActionType.CANCEL_SALE],
    dotClassName: "bg-amber-500 ring-amber-500/25",
    badgeClassName:
      "border border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300 dark:border-amber-400/40",
  },
  [InventoryActionType.INITIAL_STOCK]: {
    label: inventoryActionTypeLabels[InventoryActionType.INITIAL_STOCK],
    dotClassName: "bg-muted-foreground ring-muted-foreground/20",
    badgeClassName:
      "border border-border bg-secondary text-secondary-foreground",
  },
  [InventoryActionType.LOSS]: {
    label: inventoryActionTypeLabels[InventoryActionType.LOSS],
    dotClassName: "bg-destructive ring-destructive/25",
    badgeClassName:
      "border border-destructive/40 bg-destructive/10 text-destructive dark:text-red-400",
  },
  [InventoryActionType.SELL]: {
    label: inventoryActionTypeLabels[InventoryActionType.SELL],
    dotClassName: "bg-sky-500 ring-sky-500/25",
    badgeClassName:
      "border border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-300 dark:border-sky-400/40",
  },
  [InventoryActionType.ADJUSTMENT]: {
    label: inventoryActionTypeLabels[InventoryActionType.ADJUSTMENT],
    dotClassName: "bg-violet-500 ring-violet-500/25",
    badgeClassName:
      "border border-violet-500/40 bg-violet-500/15 text-violet-700 dark:text-violet-300 dark:border-violet-400/40",
  },
};

export const defaultInventoryActionTypeStyle: InventoryActionTypeStyle = {
  label: "",
  dotClassName: "bg-muted-foreground ring-muted-foreground/20",
  badgeClassName:
    "border border-border bg-secondary text-secondary-foreground",
};

export function getInventoryActionTypeStyle(
  actionType: InventoryActionType | string | null | undefined,
): InventoryActionTypeStyle {
  if (!actionType) return defaultInventoryActionTypeStyle;
  return (
    inventoryActionTypeStyle[actionType as InventoryActionType] ??
    defaultInventoryActionTypeStyle
  );
}
