import { HandCoins, Package, type LucideIcon } from "lucide-react";
import {
  useCreateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
  useGetAllExpenseCategoriesQuery,
  useGetExpenseCategoryByIdQuery,
  useUpdateExpenseCategoryMutation,
} from "@/hooks/use-expense-categories";
import {
  useCreateProductCategoryMutation,
  useDeleteProductCategoryMutation,
  useGetAllProductCategoriesQuery,
  useGetProductCategoryByIdQuery,
  useUpdateProductCategoryMutation,
} from "@/hooks/use-product-categories";

export type CategoryKind = "expenses" | "products";

export interface CategoryKindConfig {
  kind: CategoryKind;
  cardTitle: string;
  cardDescription: string;
  detailTitle: string;
  detailDescription: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  icon: LucideIcon;
  detailHref: string;
  useList:
    | typeof useGetAllExpenseCategoriesQuery
    | typeof useGetAllProductCategoriesQuery;
  useById:
    | typeof useGetExpenseCategoryByIdQuery
    | typeof useGetProductCategoryByIdQuery;
  useCreate:
    | typeof useCreateExpenseCategoryMutation
    | typeof useCreateProductCategoryMutation;
  useUpdate:
    | typeof useUpdateExpenseCategoryMutation
    | typeof useUpdateProductCategoryMutation;
  useDelete:
    | typeof useDeleteExpenseCategoryMutation
    | typeof useDeleteProductCategoryMutation;
}

export const CATEGORY_KINDS: Record<CategoryKind, CategoryKindConfig> = {
  expenses: {
    kind: "expenses",
    cardTitle: "Gastos",
    cardDescription: "Categorías para clasificar tus gastos",
    detailTitle: "Categorías de Gastos",
    detailDescription:
      "Administra las categorías que usarás para clasificar gastos.",
    emptyStateTitle: "Sin categorías registradas",
    emptyStateDescription:
      "Aún no hay categorías de gastos. Crea una para empezar a clasificarlos.",
    icon: HandCoins,
    detailHref: "/dashboard/business/categories/expenses",
    useList: useGetAllExpenseCategoriesQuery,
    useById: useGetExpenseCategoryByIdQuery,
    useCreate: useCreateExpenseCategoryMutation,
    useUpdate: useUpdateExpenseCategoryMutation,
    useDelete: useDeleteExpenseCategoryMutation,
  },
  products: {
    kind: "products",
    cardTitle: "Productos",
    cardDescription: "Categorías para clasificar tus productos",
    detailTitle: "Categorías de Productos",
    detailDescription:
      "Administra las categorías que usarás para clasificar productos.",
    emptyStateTitle: "Sin categorías registradas",
    emptyStateDescription:
      "Aún no hay categorías de productos. Crea una para organizarlos por familia.",
    icon: Package,
    detailHref: "/dashboard/business/categories/products",
    useList: useGetAllProductCategoriesQuery,
    useById: useGetProductCategoryByIdQuery,
    useCreate: useCreateProductCategoryMutation,
    useUpdate: useUpdateProductCategoryMutation,
    useDelete: useDeleteProductCategoryMutation,
  },
};

export function isValidCategoryKind(
  value: string | string[] | undefined,
): value is CategoryKind {
  return value === "expenses" || value === "products";
}
