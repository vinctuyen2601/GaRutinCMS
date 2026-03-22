export type StockStatus = 'in_stock' | 'out_of_stock' | 'pre_order';

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  images: string[];
  categoryId?: string;
  weightPerUnit?: string;
  unit: string;
  stockStatus: StockStatus;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductPayload = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductPayload = Partial<CreateProductPayload>;

// AI types
export type GenerateProductDescriptionPayload = {
  name: string;
  category?: string;
  price?: number;
  weightPerUnit?: string;
  unit?: string;
};

export type GenerateProductDescriptionResult = {
  description: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
};

export type OptimizeProductSeoPayload = {
  name: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
};

export type OptimizeProductSeoResult = {
  seoTitle: string;
  seoDescription: string;
  slug: string;
  suggestions: string[];
};

export type ImproveProductDescriptionPayload = {
  name: string;
  description: string;
  category?: string;
};

export type ImproveProductDescriptionResult = {
  description: string;
  improvements: string[];
};
