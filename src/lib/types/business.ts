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

