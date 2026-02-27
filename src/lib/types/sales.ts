import { Business } from "./business";
import { Product } from "./product";

export interface SaleWithProductAndBusiness {
  id: string;
  idbusiness: string;
  idproducto: string;
  business: Business;
  product: Product;
  cantidad: number;
  precio: number;
  descripcion: string;
  createdAt: Date;
}

export interface SaleDetailsProps {
    id: string;
    idbusiness: string;
    idproducto: string;
    cantidad: string;
    precio: string;
    descripcion: string;
    isCancelled: boolean;
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