export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  businessId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductCategoryWithBusiness extends ProductCategory {
  business: {
    id: string;
    name: string;
  };
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
  businessId: string;
}

export type UpdateProductCategoryProps = Partial<{
  name: string;
  description: string;
}>;
