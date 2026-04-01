import { Product } from "./product";

export interface SaleWithProductAndBusiness {
  // id: string;
  // idbusiness: string;
  // idproducto: string;
  // business: Business;
  // product: Product;
  // cantidad: number;
  // precio: number;
  // descripcion: string;
  // createdAt: Date;

  id: string;
  idbusiness: string;
  idproducto: string;
  product: Product;
  cantidad: number;
  precio: number;
  descripcion: string;
  isCancelled: boolean;
  createdAt: Date;
  productName: string;
}

export interface SaleDetailsProps {
  id: string;
  idbusiness: string;
  idproducto: string;
  cantidad: string;
  precio: string;
  descripcion: string;
  isCancelled: boolean;
  cancelledReason: string; 
  createdAt: Date;
  productName: string;
}


export interface CreateSaleProps {
  idbusiness: string;
  idproducto: string;
  cantidad: number;
  precio: number;
  descripcion: string;
}