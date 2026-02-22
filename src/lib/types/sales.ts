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

export interface CreateSaleProps {
  idbusiness: string;
  idproducto: string;
  cantidad: number;
  precio: number;
  descripcion: string;
}