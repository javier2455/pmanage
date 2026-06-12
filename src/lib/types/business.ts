import { Product, ProductCategoryEmbed } from "./product";

export type BusinessType = "agromarket" | "mipyme" | "market";

export type Business = {
  id: string;
  name: string;
  description: string | null;
  type: BusinessType;
  address: string;
  phone: string | null;
  email: string | null;
  lat: number;
  lng: number;
  municipalityId: string | null;
  municipality: {
    id: string;
    name: string;
    provinceId: string;
  } | null;
  userId: string | null;
  geocoded: boolean;
  active: boolean;
  isWorker: boolean;
};

export type BusinessWithProducts = {
  id: string;
  businessId: string;
  price: string;
  productId: string;
  product: Product;
  stock: number;
  updatedAt: Date;
  /**
   * Categoría del `BusinessProduct` (por negocio). Reemplaza a `product.category`
   * tras el cambio de relación del backend (docs/category.md). Puede ser `null`.
   */
  category?: ProductCategoryEmbed | null;
  /**
   * Umbral de alerta de stock bajo del BusinessProduct (`null` = sin alerta).
   * Vive a nivel raíz porque es por negocio-producto, no global del `Product`
   * (igual que `CurrentInventoryEntry.stockAlertThreshold`).
   * TODO(backend): incluir este campo en `GET /businesses/:businessId/products`.
   * Mientras no llegue, el form de entrada cae al umbral por defecto visual.
   * Contrato: docs/backend-umbral-en-productos.md.
   */
  stockAlertThreshold?: number | null;
};

export type BusinessProduct = {
  id: string;
  businessId: string;
  productId: string;
  price: number;
  stock: number;
  updatedAt: Date;
  /** Categoría asignada a este producto dentro del negocio (docs/category.md). */
  category?: ProductCategoryEmbed | null;
};

export interface GetAllProductOfMyBusinessesProps {
  businessId: string;
  /** Filtra por nombre (case-insensitive) en el backend. */
  search?: string;
}

export interface CreateBusinessPayload {
  name: string;
  description: string | null;
  type: BusinessType;
  address: string;
  phone: string | null;
  email: string | null;
  municipalityId: string;
  lat: number;
  lng: number;
}

export interface UpdateBusinessPayload {
  name: string;
  description: string | null;
  type: BusinessType;
  address: string;
  phone: string | null;
  email: string | null;
  municipalityId?: string;
  lat?: number;
  lng?: number;
}

export interface UpdateBusinessResponse {
  message: string;
  data: {
    id: string;
    name: string;
  };
}


export interface DashboardSummaryResponse {
  sales: DashboardSummaryStat;
  expenses: DashboardSummaryStat;
  lastFiveSales: DashboardSummarySale[];
  lastFiveExpenses: DashboardSummaryExpense[];
  recentActivity: DashboardSummaryActivity[];
}

export type DashboardSummaryStat = {
  today: number;
  yesterday: number;
  percentageChange: number;
};

export type DashboardSummarySale = {
  id: string;
  productName: string;
  cantidad: number;
  precio: number;
  total: number;
  isCancelled: boolean;
  cancelledReason: string | null;
  createdAt: string;
};

export type DashboardSummaryExpense = {
  id: string;
  title: string;
  amount: string | number;
  description: string;
  createdAt: string;
};

export type DashboardSummaryActivity = {
  id: string;
  actionType: string;
  productName: string;
  quantity: number;
  description: string;
  createdAt: string;
};