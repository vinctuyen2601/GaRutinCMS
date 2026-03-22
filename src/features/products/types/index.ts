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
