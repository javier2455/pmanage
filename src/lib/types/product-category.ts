// Las categorías de producto son globales por usuario (no pertenecen a un
// negocio). Un producto es el mismo en todos los negocios del usuario, por lo
// que su categoría también debe ser la misma en todos. Por eso aquí no hay
// `businessId` (a diferencia de las categorías de gasto).
export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GetAllProductCategoriesResponse {
  data: ProductCategory[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateProductCategoryProps {
  name: string;
  description: string;
}

export type UpdateProductCategoryProps = Partial<{
  name: string;
  description: string;
}>;
