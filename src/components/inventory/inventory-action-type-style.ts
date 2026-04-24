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
