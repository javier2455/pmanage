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
  /** Habilita delivery/mensajería para este negocio. Gate del backend para ventas `delivery`. */
  acceptsMessaging: boolean;
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
  /**
   * Estado del negocio respecto a los límites del plan.
   * `archived` = bloqueado en solo-lectura tras un downgrade (los datos se
   * conservan y se restauran al volver a Pro). Si el backend aún no lo envía se
   * asume `active`.
   * TODO(backend): incluir `status`/`archivedReason` en `GET /businesses/my-businesses`.
   * Contrato: docs/análisis-planes/backend-cambios.md.
   */
  status?: "active" | "archived";
  /** Motivo del archivado (p.ej. `plan_downgrade`). `null`/ausente si está activo. */
  archivedReason?: string | null;
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
  acceptsMessaging?: boolean;
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
  acceptsMessaging?: boolean;
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
  sales: DashboardSalesStat;
  expenses: DashboardExpensesStat;
  lastFiveSales: DashboardSummarySale[];
  lastFiveExpenses: DashboardSummaryExpense[];
  recentActivity: DashboardSummaryActivity[];
}

/** Total de ventas/gastos de un período agrupado por moneda. */
export type DashboardCurrencyTotal = {
  currency: string;
  total: number;
};

export type DashboardSalesStat = {
  today: DashboardCurrencyTotal[];
  yesterday: DashboardCurrencyTotal[];
  totalTransactions: number;
  percentageChange: number;
};

export type DashboardExpensesStat = {
  today: DashboardCurrencyTotal[];
  yesterday: DashboardCurrencyTotal[];
  totalCount: number;
  percentageChange: number;
};

export type DashboardSummarySale = {
  id: string;
  productName: string;
  cantidad: number;
  precio: number;
  total: number;
  currency: string;
  isCancelled: boolean;
  cancelledReason: string | null;
  createdAt: string;
};

export type DashboardSummaryExpense = {
  id: string;
  title: string;
  amount: string | number;
  /** Moneda del gasto. Puede faltar si el backend aún no la incluye aquí; el UI cae a CUP. */
  currency?: string;
  description: string;
  createdAt: string;
};

export type DashboardSummaryActivity = {
  id: string;
  actionType: string;
  productName: string;
  quantity: number;
  currency: string;
  description: string;
  createdAt: string;
};