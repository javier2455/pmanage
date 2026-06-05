import { SalesProductInfoResponse } from "./product";

export interface SalesResponseInterface {
  data: SaleWithProductAndBusiness[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}

export interface SaleWithProductAndBusiness {
  id: string;
  idbusiness: string;
  total: string;
  descripcion: string;
  isCancelled: boolean;
  cancelledReason: string | null;
  createdAt: Date;
  createdBy: string;
  userName: string;
  items: SalesProductInfoResponse[];
}

export interface CreateSaleItemProps {
  idproducto: string;
  quantity: number;
  price: number;
}

export interface CreateSaleProps {
  idbusiness: string;
  descripcion: string;
  items: CreateSaleItemProps[];
}