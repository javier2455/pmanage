import { Product } from "./product";

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
  userId: string | null;
  geocoded: boolean;
  active: boolean;
};

export type BusinessWithProducts = {
  id: string;
  businessId: string;
  price: string;
  productId: string;
  product: Product;
  stock: number;
  updatedAt: Date;
};

export type BusinessProduct = {
  id: string;
  businessId: string;
  productId: string;
  price: number;
  stock: number;
  updatedAt: Date;
};

export interface GetAllProductOfMyBusinessesProps {
  businessId: string;
}

export interface CreateBusinessPayload {
  name: string;
  description: string | null;
  type: BusinessType;
  address: string;
  phone: string | null;
  email: string | null;
  municipalityId: string;
}

export interface UpdateBusinessPayload {
  name: string;
  description: string | null;
  type: BusinessType;
  address: string;
  phone: string | null;
  email: string | null;
}

export interface UpdateBusinessResponse {
  message: string;
  data: {
    id: string;
    name: string;
  };
}


export interface DashboardSummaryResponse {
  sales: {
    today: number;
    percentageChange: number;
  };
  transactions: {
    today: number;
    percentageChange: number;
  };
  lastFiveSales: DashboardSummarySale[];
  recentActivity: DashboardSummaryActivity[];
}

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

export type DashboardSummaryActivity = {
  id: string;
  actionType: string;
  productName: string;
  quantity: number;
  description: string;
  createdAt: string;
};